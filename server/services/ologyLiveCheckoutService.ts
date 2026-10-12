import Stripe from 'stripe';
import { getDb, getPool } from '../db';
import { ensureOlogyLiveBookingsSchema } from './ologyLiveSchemaService';
import {
  findSlotForBooking,
  getLiveBookingParticipants,
  getLockedExperience,
  getLockedLiveBooking,
  getLockedLiveBookingForParticipants,
  isLiveActive,
  syncLiveSlotCapacity,
  withLockedLiveTalent,
  type LiveBookingRow,
  type LiveScheduleConnection,
} from './ologyLiveScheduleService';
import { getStripeClientForWebhookMode } from './stripeWebhookMode';

const CHECKOUT_TIMEOUT_MS = 5_000;
const STALE_HOLD_MS = 30 * 60 * 1_000;
const RECONCILIATION_LIMIT = 50;
const RECONCILIATION_CONCURRENCY = 3;
const RECONCILIATION_TIMEOUT_MS = 8_000;

/** Deliberately generic: webhook callers must not receive provider or database details. */
function internalFailure(): Error {
  return new Error('Ology Live checkout processing failed.');
}

function assertBeforeDeadline(deadline?: number) {
  if (deadline !== undefined && Date.now() >= deadline) throw internalFailure();
}

type CheckoutIdentity = {
  bookingId: number;
  experienceId: number;
  slotId: number;
  fanId: number;
  talentId: number;
};

type LockedCheckoutBooking = LiveBookingRow & {
  amount: string | number;
  createdAt?: Date | string;
};

type CheckoutCandidate = {
  id: number;
  stripePaymentIntentId: string | null;
};

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function parseIdentityValue(value: unknown): number | undefined {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return isPositiveSafeInteger(parsed) && String(parsed) === value ? parsed : undefined;
}

function identityFromMetadata(metadata: Stripe.Metadata | null | undefined): CheckoutIdentity {
  const values = {
    bookingId: parseIdentityValue(metadata?.bookingId),
    experienceId: parseIdentityValue(metadata?.experienceId),
    slotId: parseIdentityValue(metadata?.slotId),
    fanId: parseIdentityValue(metadata?.fanId),
    talentId: parseIdentityValue(metadata?.talentId),
  };
  if (metadata?.type !== 'ology_live_booking'
    || !values.bookingId || !values.experienceId || !values.slotId || !values.fanId || !values.talentId) {
    throw internalFailure();
  }
  return values as CheckoutIdentity;
}

function checkoutIdentity(session: Stripe.Checkout.Session): CheckoutIdentity {
  return identityFromMetadata(session.metadata);
}

/** Exact decimal-to-cent conversion; never use binary floating-point for payment proof. */
function decimalToCents(value: unknown): number | undefined {
  const text = typeof value === 'number'
    ? String(value)
    : typeof value === 'string'
      ? value
      : '';
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) return undefined;
  const whole = Number(match[1]);
  const fraction = (match[2] || '').padEnd(2, '0');
  const cents = whole * 100 + Number(fraction || 0);
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : undefined;
}

function assertCheckoutBasics(session: Stripe.Checkout.Session): CheckoutIdentity {
  if (typeof session.id !== 'string' || !session.id.startsWith('cs_')
    || session.mode !== 'payment'
    || session.currency?.toLowerCase() !== 'usd'
    || !Number.isSafeInteger(session.amount_total)
    || (session.amount_total ?? 0) <= 0) {
    throw internalFailure();
  }
  return checkoutIdentity(session);
}

async function withProviderTimeout<T>(operation: Promise<T>, timeoutMs = CHECKOUT_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(internalFailure()), Math.max(1, timeoutMs));
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

type CurrentCheckout = {
  session: Stripe.Checkout.Session;
  client: Stripe;
};

async function retrieveCurrentCheckout(
  eventSession: Stripe.Checkout.Session,
  stripeClient?: Stripe,
): Promise<CurrentCheckout> {
  if (typeof eventSession.id !== 'string' || !eventSession.id.startsWith('cs_')) throw internalFailure();
  try {
    const client = stripeClient ?? getStripeClientForWebhookMode(eventSession.livemode ? 'live' : 'test');
    const current = await withProviderTimeout(client.checkout.sessions.retrieve(eventSession.id));
    if (!current || current.id !== eventSession.id || Boolean(current.livemode) !== Boolean(eventSession.livemode)) {
      throw internalFailure();
    }
    return { session: current, client };
  } catch {
    throw internalFailure();
  }
}

function paymentIntentId(session: Stripe.Checkout.Session): string {
  const paymentIntent = session.payment_intent;
  const id = typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id;
  if (typeof id !== 'string' || !id.startsWith('pi_')) throw internalFailure();
  return id;
}

function sameIdentity(left: CheckoutIdentity, right: CheckoutIdentity): boolean {
  return left.bookingId === right.bookingId
    && left.experienceId === right.experienceId
    && left.slotId === right.slotId
    && left.fanId === right.fanId
    && left.talentId === right.talentId;
}

function checkoutPaymentIntentId(session: Stripe.Checkout.Session): string {
  return paymentIntentId(session);
}

function isFullRefund(paymentIntent: Stripe.PaymentIntent): boolean {
  const charge = paymentIntent.latest_charge;
  return typeof charge === 'object' && charge !== null
    && (charge.refunded === true || Number(charge.amount_refunded || 0) >= Number(charge.amount || 0));
}

/** PaymentIntent is a second current-state proof and detects a later full refund. */
async function verifyCurrentPaymentIntent(session: Stripe.Checkout.Session, client: Stripe): Promise<{ allowNullAttachment: boolean; fullyRefunded: boolean }> {
  const identity = assertCheckoutBasics(session);
  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await withProviderTimeout(client.paymentIntents.retrieve(paymentIntentId(session), {
      expand: ['latest_charge'],
    }));
  } catch {
    throw internalFailure();
  }
  const metadata = paymentIntent.metadata;
  const hasIdentityMetadata = Boolean(metadata && ['type', 'bookingId', 'experienceId', 'slotId', 'fanId', 'talentId'].some(key => metadata[key] !== undefined));
  if (hasIdentityMetadata && !sameIdentity(identityFromMetadata(metadata), identity)) throw internalFailure();
  const latestCharge = paymentIntent.latest_charge;
  if (paymentIntent.id !== paymentIntentId(session)
    || Boolean(paymentIntent.livemode) !== Boolean(session.livemode)
    || paymentIntent.status !== 'succeeded'
    || paymentIntent.currency?.toLowerCase() !== 'usd'
    || paymentIntent.amount_received !== session.amount_total
    || typeof latestCharge !== 'object' || latestCharge === null
    || Number(latestCharge.amount) !== session.amount_total) {
    throw internalFailure();
  }
  // Older issued Checkouts had identity only on the Session. They require an
  // already-bound cs_* receipt under lock; never allow their null-attach race.
  return { allowNullAttachment: hasIdentityMetadata, fullyRefunded: isFullRefund(paymentIntent) };
}

function isNotFound(error: unknown): boolean {
  const candidate = error as { code?: unknown; statusCode?: unknown; status?: unknown } | undefined;
  return candidate?.code === 'resource_missing' || candidate?.statusCode === 404 || candidate?.status === 404;
}

/**
 * Reconciliation has no event snapshot to choose a Stripe mode from. It may
 * probe the configured modes only on a definite not-found response; an outage
 * or any ambiguous response remains fail-closed.
 */
async function retrieveCurrentCheckoutForReconciliation(sessionId: string, deadline: number): Promise<CurrentCheckout> {
  let configuredClient = false;
  for (const mode of ['test', 'live'] as const) {
    let client: Stripe;
    try {
      client = getStripeClientForWebhookMode(mode);
      configuredClient = true;
    } catch {
      // A deployment may intentionally have only one mode configured.
      continue;
    }
    try {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw internalFailure();
      const current = await withProviderTimeout(client.checkout.sessions.retrieve(sessionId), Math.min(CHECKOUT_TIMEOUT_MS, remaining));
      if (!current || current.id !== sessionId || Boolean(current.livemode) !== (mode === 'live')) throw internalFailure();
      return { session: current, client };
    } catch (error) {
      if (isNotFound(error)) continue;
      throw internalFailure();
    }
  }
  if (!configuredClient) throw internalFailure();
  throw internalFailure();
}

async function initializeCheckoutStorage() {
  const db = await getDb();
  if (!db) throw internalFailure();
  try {
    await ensureOlogyLiveBookingsSchema(db);
  } catch {
    throw internalFailure();
  }
  return db;
}

async function participantsFor(identity: CheckoutIdentity) {
  let participants: { talentId: number; fanId: number } | undefined;
  try {
    participants = await getLiveBookingParticipants(identity.bookingId);
  } catch {
    throw internalFailure();
  }
  if (!participants
    || participants.talentId !== identity.talentId
    || participants.fanId !== identity.fanId) {
    throw internalFailure();
  }
  return participants;
}

function assertLockedBookingIdentity(
  booking: LockedCheckoutBooking | undefined,
  identity: CheckoutIdentity,
  participants: { talentId: number; fanId: number },
  current: Stripe.Checkout.Session,
  allowNullCheckoutAttachment: boolean,
): asserts booking is LockedCheckoutBooking {
  if (!booking
    || booking.id !== identity.bookingId
    || booking.experienceId !== identity.experienceId
    || booking.fanId !== identity.fanId
    || booking.talentId !== identity.talentId
    || booking.fanId !== participants.fanId
    || booking.talentId !== participants.talentId
    || decimalToCents(booking.amount) !== current.amount_total) {
    throw internalFailure();
  }
  if (booking.stripePaymentIntentId !== current.id
    && !(allowNullCheckoutAttachment && booking.stripePaymentIntentId === null)) {
    throw internalFailure();
  }
}

async function lockedContext(
  conn: LiveScheduleConnection,
  booking: LockedCheckoutBooking,
  identity: CheckoutIdentity,
) {
  const experience = await getLockedExperience(conn, booking.experienceId, booking.talentId);
  const slot = await findSlotForBooking(conn, booking);
  if (!experience || experience.id !== identity.experienceId || experience.talentId !== identity.talentId
    || !slot || slot.id !== identity.slotId || slot.experienceId !== identity.experienceId || slot.talentId !== identity.talentId) {
    throw internalFailure();
  }
  return { experience, slot };
}

async function fulfillVerifiedCheckout(current: Stripe.Checkout.Session, allowNullAttachment = true): Promise<void> {
  const identity = assertCheckoutBasics(current);
  if (current.status !== 'complete' || current.payment_status !== 'paid') throw internalFailure();

  await initializeCheckoutStorage();
  const participants = await participantsFor(identity);
  try {
    await withLockedLiveTalent(participants.talentId, async conn => {
      const booking = await getLockedLiveBookingForParticipants(conn, identity.bookingId, participants) as LockedCheckoutBooking | undefined;
      assertLockedBookingIdentity(booking, identity, participants, current, allowNullAttachment);

      // Stripe retries and reordered terminal events cannot revive immutable
      // lifecycle rows. A correctly bound paid receipt is already fulfilled.
      if (booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'no_show'
        || booking.paymentStatus === 'refunded' || booking.paymentStatus === 'paid') {
        return;
      }
      if (booking.status !== 'pending' || booking.paymentStatus !== 'unpaid') throw internalFailure();

      // Validate the authoritative booking/experience/slot tuple while both
      // participants are locked. This deliberately leaves the booking pending:
      // talent confirmation remains a separate action.
      await lockedContext(conn, booking, identity);
      const [result] = await conn.execute(
        "UPDATE ology_live_bookings SET paymentStatus='paid', paidAt=UTC_TIMESTAMP(), stripePaymentIntentId=? WHERE id=? AND experienceId=? AND fanId=? AND talentId=? AND status='pending' AND paymentStatus='unpaid' AND (stripePaymentIntentId IS NULL OR stripePaymentIntentId=?)",
        [current.id, booking.id, identity.experienceId, identity.fanId, identity.talentId, current.id],
      );
      if (Number((result as { affectedRows?: number })?.affectedRows || 0) !== 1) throw internalFailure();
    }, [participants.fanId]);
  } catch {
    throw internalFailure();
  }
}

async function cancelExpiredVerifiedCheckout(current: Stripe.Checkout.Session, failedPaymentProof = false): Promise<void> {
  const identity = assertCheckoutBasics(current);
  const expired = current.status === 'expired' && current.payment_status !== 'paid';
  const failed = failedPaymentProof && current.status === 'complete' && current.payment_status === 'unpaid';
  if (!expired && !failed) return;

  await initializeCheckoutStorage();
  const participants = await participantsFor(identity);
  try {
    await withLockedLiveTalent(participants.talentId, async conn => {
      const booking = await getLockedLiveBookingForParticipants(conn, identity.bookingId, participants) as LockedCheckoutBooking | undefined;
      // Expiry never gets the null-attachment race exception: only a receipt
      // explicitly bound to this Checkout session can be cancelled here.
      assertLockedBookingIdentity(booking, identity, participants, current, false);
      if (booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'no_show'
        || booking.paymentStatus === 'paid' || booking.paymentStatus === 'refunded') {
        return;
      }
      if (booking.status !== 'pending' || booking.paymentStatus !== 'unpaid') return;

      const { experience, slot } = await lockedContext(conn, booking, identity);
      const [result] = await conn.execute(
        "UPDATE ology_live_bookings SET status='cancelled', cancelledAt=UTC_TIMESTAMP(), cancelledBy='system', cancellationReason=? WHERE id=? AND experienceId=? AND fanId=? AND talentId=? AND status='pending' AND paymentStatus='unpaid' AND stripePaymentIntentId=?",
        [failed ? 'Checkout payment failed.' : 'Checkout expired before payment.', booking.id, identity.experienceId, identity.fanId, identity.talentId, current.id],
      );
      if (Number((result as { affectedRows?: number })?.affectedRows || 0) === 1) {
        await syncLiveSlotCapacity(conn, slot, isLiveActive(experience.isActive));
      }
    }, [participants.fanId]);
  } catch {
    throw internalFailure();
  }
}

async function isCurrentCheckoutPaymentFailed(current: Stripe.Checkout.Session, client: Stripe): Promise<boolean> {
  if (current.status !== 'complete' || current.payment_status !== 'unpaid') return false;
  const identity = assertCheckoutBasics(current);
  let intent: Stripe.PaymentIntent;
  try { intent = await withProviderTimeout(client.paymentIntents.retrieve(paymentIntentId(current))); }
  catch { throw internalFailure(); }
  if (intent.id !== paymentIntentId(current) || Boolean(intent.livemode) !== Boolean(current.livemode)
    || intent.currency?.toLowerCase() !== 'usd' || intent.amount !== current.amount_total) throw internalFailure();
  if (intent.metadata && Object.keys(intent.metadata).length && !sameIdentity(identityFromMetadata(intent.metadata), identity)) throw internalFailure();
  return intent.status === 'canceled' || (intent.status === 'requires_payment_method' && Boolean(intent.last_payment_error));
}

/**
 * Handles checkout.session.completed and checkout.session.async_payment_succeeded
 * after the central webhook signature has been verified. The supplied event is
 * only a locator; the just-retrieved Checkout object is the payment authority.
 */
export async function handleOlogyLiveCheckout(
  session: Stripe.Checkout.Session,
  stripeClient?: Stripe,
): Promise<void> {
  const current = await retrieveCurrentCheckout(session, stripeClient);
  if (current.session.status === 'complete' && current.session.payment_status === 'unpaid') {
    assertCheckoutBasics(current.session);
    return; // Async payment completion is not payment proof; its success event can arrive later.
  }
  const proof = await verifyCurrentPaymentIntent(current.session, current.client);
  if (proof.fullyRefunded) await applyVerifiedFullRefund(current.session, proof.allowNullAttachment);
  else await fulfillVerifiedCheckout(current.session, proof.allowNullAttachment);
}

/** Handles terminal Checkout events without treating an unpaid async completion as an expiry. */
export async function handleOlogyLiveCheckoutTerminal(
  session: Stripe.Checkout.Session,
  stripeClient?: Stripe,
): Promise<void> {
  const current = await retrieveCurrentCheckout(session, stripeClient);
  const failed = await isCurrentCheckoutPaymentFailed(current.session, current.client);
  await cancelExpiredVerifiedCheckout(current.session, failed);
}

/**
 * Processes only an already-verified charge.refunded event for Live. A partial
 * refund deliberately preserves the paid receipt. A full refund updates no
 * money and creates no remote action; it only reflects Stripe's current state.
 */
export async function handleOlogyLiveCheckoutRefund(
  charge: Stripe.Charge,
  stripeClient?: Stripe,
): Promise<void> {
  if (charge.metadata?.type !== 'ology_live_booking') return;
  const eventPaymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;
  if (typeof eventPaymentIntentId !== 'string' || !eventPaymentIntentId.startsWith('pi_')) throw internalFailure();

  let client: Stripe;
  let paymentIntent: Stripe.PaymentIntent;
  try {
    client = stripeClient ?? getStripeClientForWebhookMode(charge.livemode ? 'live' : 'test');
    paymentIntent = await withProviderTimeout(client.paymentIntents.retrieve(eventPaymentIntentId, {
      expand: ['latest_charge'],
    }));
  } catch {
    throw internalFailure();
  }
  const identity = identityFromMetadata(paymentIntent.metadata);
  if (paymentIntent.id !== eventPaymentIntentId
    || Boolean(paymentIntent.livemode) !== Boolean(charge.livemode)
    || paymentIntent.status !== 'succeeded'
    || paymentIntent.currency?.toLowerCase() !== 'usd') {
    throw internalFailure();
  }
  // A partial charge.refunded delivery must be harmless even if stale/replayed.
  if (!isFullRefund(paymentIntent)) return;

  await initializeCheckoutStorage();
  const participants = await participantsFor(identity);
  let receiptRows: Array<{ stripePaymentIntentId: string | null }>;
  try {
    const pool = getPool();
    if (!pool) throw internalFailure();
    const [result] = await pool.execute(
      'SELECT stripePaymentIntentId FROM ology_live_bookings WHERE id=? AND talentId=? AND fanId=? LIMIT 1',
      [identity.bookingId, identity.talentId, identity.fanId],
    );
    receiptRows = Array.isArray(result) ? result as Array<{ stripePaymentIntentId: string | null }> : [];
  } catch {
    throw internalFailure();
  }
  const checkoutId = receiptRows[0]?.stripePaymentIntentId;
  if (typeof checkoutId !== 'string' || !checkoutId.startsWith('cs_')) throw internalFailure();

  let currentCheckout: Stripe.Checkout.Session;
  try {
    currentCheckout = await withProviderTimeout(client.checkout.sessions.retrieve(checkoutId));
  } catch {
    throw internalFailure();
  }
  const checkoutIdentityValue = assertCheckoutBasics(currentCheckout);
  if (Boolean(currentCheckout.livemode) !== Boolean(charge.livemode)
    || !sameIdentity(checkoutIdentityValue, identity)
    || checkoutPaymentIntentId(currentCheckout) !== paymentIntent.id
    || currentCheckout.amount_total !== paymentIntent.amount_received) {
    throw internalFailure();
  }

  await applyVerifiedFullRefund(currentCheckout);
}

async function applyVerifiedFullRefund(currentCheckout: Stripe.Checkout.Session, allowNullAttachment = false): Promise<void> {
  const identity = assertCheckoutBasics(currentCheckout);
  await initializeCheckoutStorage();
  const participants = await participantsFor(identity);
  try {
    await withLockedLiveTalent(participants.talentId, async conn => {
      const booking = await getLockedLiveBookingForParticipants(conn, identity.bookingId, participants) as LockedCheckoutBooking | undefined;
      assertLockedBookingIdentity(booking, identity, participants, currentCheckout, allowNullAttachment);
      if (booking.paymentStatus === 'refunded') return;
      if (!['unpaid', 'paid'].includes(booking.paymentStatus)) return;
      const activeReceipt = booking.status === 'pending' || booking.status === 'confirmed';
      let context: Awaited<ReturnType<typeof lockedContext>> | undefined;
      if (activeReceipt) context = await lockedContext(conn, booking, identity);
      const [result] = await conn.execute(
        "UPDATE ology_live_bookings SET paymentStatus='refunded', refundedAt=UTC_TIMESTAMP(), stripePaymentIntentId=?, cancelledAt=CASE WHEN status IN ('pending','confirmed') THEN UTC_TIMESTAMP() ELSE cancelledAt END, cancelledBy=CASE WHEN status IN ('pending','confirmed') THEN 'system' ELSE cancelledBy END, cancellationReason=CASE WHEN status IN ('pending','confirmed') THEN ? ELSE cancellationReason END, status=CASE WHEN status IN ('pending','confirmed') THEN 'cancelled' ELSE status END WHERE id=? AND experienceId=? AND fanId=? AND talentId=? AND (stripePaymentIntentId=? OR (stripePaymentIntentId IS NULL AND ?=1)) AND paymentStatus IN ('unpaid','paid')",
        [currentCheckout.id, 'Payment was fully refunded by Stripe.', booking.id, identity.experienceId, identity.fanId, identity.talentId, currentCheckout.id, allowNullAttachment ? 1 : 0],
      );
      if (Number((result as { affectedRows?: number })?.affectedRows || 0) === 1 && context) {
        await syncLiveSlotCapacity(conn, context.slot, isLiveActive(context.experience.isActive));
      }
    }, [participants.fanId]);
  } catch {
    throw internalFailure();
  }
}

async function releaseUnlinkedStaleReservation(bookingId: number, cutoff: Date, deadline: number): Promise<void> {
  assertBeforeDeadline(deadline);
  let participants: { talentId: number; fanId: number } | undefined;
  try {
    participants = await getLiveBookingParticipants(bookingId);
  } catch {
    throw internalFailure();
  }
  if (!participants || !isPositiveSafeInteger(participants.talentId) || !isPositiveSafeInteger(participants.fanId)) {
    throw internalFailure();
  }

  try {
    assertBeforeDeadline(deadline);
    await withLockedLiveTalent(participants.talentId, async conn => {
      const booking = await getLockedLiveBookingForParticipants(conn, bookingId, participants) as LockedCheckoutBooking | undefined;
      if (!booking || booking.id !== bookingId || booking.talentId !== participants.talentId || booking.fanId !== participants.fanId) {
        throw internalFailure();
      }
      if (booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'no_show'
        || booking.paymentStatus === 'paid' || booking.paymentStatus === 'refunded') return;
      if (booking.status !== 'pending' || booking.paymentStatus !== 'unpaid' || booking.stripePaymentIntentId !== null) return;
      if (booking.createdAt == null) return;
      const createdAt = booking.createdAt instanceof Date ? booking.createdAt : new Date(booking.createdAt);
      if (!Number.isFinite(createdAt.getTime()) || createdAt.getTime() > cutoff.getTime()) return;

      const identity = {
        bookingId: booking.id,
        experienceId: booking.experienceId,
        fanId: booking.fanId,
        talentId: booking.talentId,
        slotId: 0,
      };
      const experience = await getLockedExperience(conn, booking.experienceId, booking.talentId);
      const slot = await findSlotForBooking(conn, booking);
      if (!experience || !slot || slot.experienceId !== booking.experienceId || slot.talentId !== booking.talentId) {
        throw internalFailure();
      }
      const [result] = await conn.execute(
        "UPDATE ology_live_bookings SET status='cancelled', cancelledAt=UTC_TIMESTAMP(), cancelledBy='system', cancellationReason=? WHERE id=? AND experienceId=? AND fanId=? AND talentId=? AND status='pending' AND paymentStatus='unpaid' AND stripePaymentIntentId IS NULL",
        ['Checkout was not attached within the reservation window.', identity.bookingId, identity.experienceId, identity.fanId, identity.talentId],
      );
      if (Number((result as { affectedRows?: number })?.affectedRows || 0) === 1) {
        await syncLiveSlotCapacity(conn, slot, isLiveActive(experience.isActive));
      }
    }, [participants.fanId]);
  } catch {
    throw internalFailure();
  }
}

async function reconcileCandidate(candidate: CheckoutCandidate, cutoff: Date, deadline: number): Promise<void> {
  if (Date.now() >= deadline) throw internalFailure();
  if (!isPositiveSafeInteger(candidate.id)) throw internalFailure();
  if (candidate.stripePaymentIntentId === null) {
    await releaseUnlinkedStaleReservation(candidate.id, cutoff, deadline);
    return;
  }
  // This column deliberately stores Checkout IDs for Live. A legacy/non-Checkout
  // value is not authoritative payment proof and is left untouched fail-closed.
  if (!candidate.stripePaymentIntentId.startsWith('cs_')) return;

  const current = await retrieveCurrentCheckoutForReconciliation(candidate.stripePaymentIntentId, deadline);
  const identity = assertCheckoutBasics(current.session);
  if (identity.bookingId !== candidate.id) throw internalFailure();
  if (current.session.status === 'expired' && current.session.payment_status !== 'paid') {
    if (Date.now() >= deadline) throw internalFailure();
    await cancelExpiredVerifiedCheckout(current.session);
  } else if (current.session.status === 'complete' && current.session.payment_status === 'unpaid') {
    const failed = await isCurrentCheckoutPaymentFailed(current.session, current.client);
    if (Date.now() >= deadline) throw internalFailure();
    if (failed) await cancelExpiredVerifiedCheckout(current.session, true);
  } else if (current.session.status === 'complete' && current.session.payment_status === 'paid') {
    if (Date.now() >= deadline) throw internalFailure();
    const proof = await verifyCurrentPaymentIntent(current.session, current.client);
    if (Date.now() >= deadline) throw internalFailure();
    if (proof.fullyRefunded) await applyVerifiedFullRefund(current.session, proof.allowNullAttachment);
    else await fulfillVerifiedCheckout(current.session, proof.allowNullAttachment);
  }
  // Open Checkout and complete-but-unpaid async payments deliberately keep the
  // capacity hold until their authoritative state becomes terminal.
}

async function runBounded<T>(items: T[], task: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  let failed = false;
  const worker = async () => {
    while (!failed) {
      const index = next++;
      if (index >= items.length) return;
      try {
        await task(items[index]);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };
  const completed = await Promise.allSettled(Array.from({ length: Math.min(RECONCILIATION_CONCURRENCY, items.length) }, worker));
  if (completed.some(result => result.status === 'rejected')) throw internalFailure();
}

/**
 * Bounded, request-driven repair for stale paid-session holds. Call it outside
 * schedule locks before reserving capacity or returning availability/calendar
 * reads; it may acquire the same shared participant locks itself.
 */
export async function reconcileOlogyLiveReservations(scope: {
  experienceId?: number;
  userId?: number;
}): Promise<void> {
  if ((scope.experienceId === undefined && scope.userId === undefined)
    || (scope.experienceId !== undefined && !isPositiveSafeInteger(scope.experienceId))
    || (scope.userId !== undefined && !isPositiveSafeInteger(scope.userId))) {
    throw internalFailure();
  }

  const deadline = Date.now() + RECONCILIATION_TIMEOUT_MS;
  await initializeCheckoutStorage();
  assertBeforeDeadline(deadline);
  const pool = getPool();
  if (!pool) throw internalFailure();
  const now = Date.now();
  const cutoff = new Date(now - STALE_HOLD_MS);
  const conditions = ["status='pending'", "paymentStatus='unpaid'", 'createdAt<=?'];
  const values: unknown[] = [cutoff];
  if (scope.experienceId !== undefined) {
    conditions.push('experienceId=?');
    values.push(scope.experienceId);
  }
  if (scope.userId !== undefined) {
    conditions.push('(fanId=? OR talentId=?)');
    values.push(scope.userId, scope.userId);
  }
  values.push(RECONCILIATION_LIMIT);

  let rows: CheckoutCandidate[];
  try {
    const [result] = await pool.execute(
      `SELECT id, stripePaymentIntentId FROM ology_live_bookings WHERE ${conditions.join(' AND ')} ORDER BY createdAt ASC, id ASC LIMIT ?`,
      values,
    );
    rows = Array.isArray(result) ? result as CheckoutCandidate[] : [];
  } catch {
    throw internalFailure();
  }

  try {
    assertBeforeDeadline(deadline);
    await runBounded(rows.slice(0, RECONCILIATION_LIMIT), candidate => reconcileCandidate(candidate, cutoff, deadline));
  } catch {
    throw internalFailure();
  }
}
