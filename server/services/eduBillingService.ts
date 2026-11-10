import type Stripe from "stripe";
import { createHash } from "node:crypto";
import { SUBSCRIPTION_PRODUCTS } from "../../shared/products";

export type EduBillingMode = "live" | "test";
export type EduPlan = "starter" | "professional";
const DAY = 86_400_000;
export const EDU_NOTICE_DAYS = 30;
export const EDU_BILLING_POLICY =
  "EDU verification lasts one year with 30 days of renewal eligibility grace. The billing discount is anchored to verifiedUntil; eligibility grace does not promise an additional discounted month because Stripe’s coupon repeats for 12 months. Renewed evidence does not itself extend billing: a verified renewal must replace the matched EDU coupon. At least 30 days of accepted transactional notice precede discount removal; the paid subscription is never cancelled. Unsupported legacy billing requires manual review.";
const TYPE = "edu_student_discount";

/** Billing provenance is independent of mutable review status. Admin evidence writes
 * must preserve it (including notices) until reconciliation finishes. */
export interface EduBillingVerification {
  id: number;
  userId: number;
  status: string;
  revision: number;
  verifiedUntil: Date | null;
  graceUntil: Date | null;
  checkoutSessionId: string | null;
  stripeCouponId: string | null;
  stripeSubscriptionId: string | null;
  billingMode: EduBillingMode | null;
  billingVerificationRevision: number | null;
  renewalNoticeSentAt: Date | null;
  expiryNoticeSentAt: Date | null;
  discountEndsAt: Date | null;
  billingReconcileAfter: Date | null;
}
export type EduBillingPatch = Partial<
  Pick<
    EduBillingVerification,
    | "checkoutSessionId"
    | "stripeCouponId"
    | "stripeSubscriptionId"
    | "billingMode"
    | "billingVerificationRevision"
    | "renewalNoticeSentAt"
    | "expiryNoticeSentAt"
    | "discountEndsAt"
    | "billingReconcileAfter"
  >
>;
export interface EduBillingAccount {
  email: string | null;
  stripeSubscriptionId: string | null;
}
export interface EduBillingTransaction {
  verification: EduBillingVerification | null;
  account: EduBillingAccount;
  latestApprovalRevision: number | null;
  save(patch: EduBillingPatch): Promise<void>;
}
export interface EduNotice {
  key: string;
  userId: number;
  verificationId: number;
  revision: number;
  kind: "checkout_terms" | "renewal" | "expiry" | "renewal_terms";
  to: string;
  subject: string;
  html: string;
  deadline: Date;
}
export interface EduBillingRepository {
  /** Serialize with admin reviews using a row lock, not an in-process mutex. */
  withUserLock<T>(
    userId: number,
    work: (tx: EduBillingTransaction) => Promise<T>
  ): Promise<T>;
  listUserIds(
    limit: number,
    afterUserId: number,
    mode?: EduBillingMode
  ): Promise<number[]>;
  /** Durable outbox must survive a rollback of withUserLock. An uncertain attempt
   * is NOT retried automatically: SendGrid has no exactly-once send primitive. */
  deliverNotice(
    notice: EduNotice,
    send: EduBillingDependencies["sendEmail"]
  ): Promise<"sent" | "uncertain">;
}
export interface EduCoupon {
  id: string;
  livemode: boolean;
  percentOff: number | null;
  duration: string;
  months: number | null;
  redeemBy: number | null;
  products: string[];
  metadata: Record<string, string>;
}
export interface EduCheckout {
  id: string;
  livemode: boolean;
  status: string | null;
  url: string | null;
  expiresAt: number;
  customerId: string | null;
  subscriptionId: string | null;
  paymentStatus: string;
  metadata: Record<string, string>;
}
export interface EduSubscription {
  id: string;
  livemode: boolean;
  customerId: string | null;
  status: string;
  metadata: Record<string, string>;
  productIds: string[];
  discounts: Array<{
    id: string;
    coupon: EduCoupon | null;
    end: number | null;
  }>;
  unsupportedDiscounts: boolean;
}
export interface EduBillingStripe {
  mode: EduBillingMode;
  resolvePlan(
    plan: EduPlan,
    interval: "month" | "year"
  ): Promise<{
    priceId: string;
    productId: string;
    eligibleProductIds: string[];
  }>;
  createCoupon(
    params: Stripe.CouponCreateParams,
    key: string
  ): Promise<EduCoupon>;
  retrieveCoupon(id: string): Promise<EduCoupon>;
  retrieveCheckout(id: string): Promise<EduCheckout>;
  expireCheckout(id: string): Promise<void>;
  createCheckout(
    params: Stripe.Checkout.SessionCreateParams,
    key: string
  ): Promise<EduCheckout>;
  retrieveSubscription(id: string): Promise<EduSubscription>;
  /** Only this operation may change charged settings: replace the exact discount
   * list, without proration, cancellation, or changes to prices/billing dates. */
  setDiscounts(
    id: string,
    discounts: Array<{ discount: string } | { coupon: string }>,
    key: string
  ): Promise<void>;
}
export interface EduBillingDependencies {
  repository: EduBillingRepository;
  stripe: EduBillingStripe;
  sendEmail(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean>;
  now?: () => Date;
}
export class EduBillingBlocked extends Error {
  constructor(public readonly reason: string) {
    super(reason);
    this.name = "EduBillingBlocked";
  }
}
function block(reason: string): never {
  throw new EduBillingBlocked(reason);
}
const clock = (deps: EduBillingDependencies) => deps.now?.() ?? new Date();
const validDate = (date: Date | null) =>
  date && Number.isFinite(date.getTime()) ? date : null;
const eligibilityEnd = (v: EduBillingVerification) =>
  validDate(v.graceUntil) ?? validDate(v.verifiedUntil);
const eligible = (v: EduBillingVerification, now: Date) =>
  v.status === "approved" &&
  !!validDate(v.verifiedUntil) &&
  !!eligibilityEnd(v) &&
  eligibilityEnd(v)!.getTime() > now.getTime();
function modeMatches(livemode: boolean, deps: EduBillingDependencies) {
  return livemode === (deps.stripe.mode === "live");
}
function assertMode(v: EduBillingVerification, deps: EduBillingDependencies) {
  if (v.billingMode && v.billingMode !== deps.stripe.mode)
    block("billing_mode_mismatch");
  if (
    !v.billingMode &&
    (v.checkoutSessionId || v.stripeSubscriptionId || v.stripeCouponId)
  )
    block("legacy_billing_provenance_requires_review");
}
function metadata(
  v: EduBillingVerification,
  mode: EduBillingMode,
  revision = v.revision
): Record<string, string> {
  return {
    type: TYPE,
    userId: String(v.userId),
    eduVerificationId: String(v.id),
    verificationId: String(v.id),
    eduVerificationRevision: String(revision),
    eduBillingMode: mode,
  };
}
function ownedMetadata(
  m: Record<string, string>,
  v: EduBillingVerification,
  mode: EduBillingMode,
  revision: number
) {
  return (
    m.type === TYPE &&
    m.userId === String(v.userId) &&
    m.eduVerificationId === String(v.id) &&
    m.eduVerificationRevision === String(revision) &&
    m.eduBillingMode === mode
  );
}
function ownedCoupon(
  c: EduCoupon,
  v: EduBillingVerification,
  deps: EduBillingDependencies,
  revision: number
) {
  return (
    modeMatches(c.livemode, deps) &&
    ownedMetadata(c.metadata, v, deps.stripe.mode, revision) &&
    c.percentOff === 50 &&
    c.duration === "repeating" &&
    c.months === 12 &&
    c.products.length > 0
  );
}
function twelveMonthsFrom(now: Date) {
  const result = new Date(now);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCFullYear(result.getUTCFullYear() + 1);
  result.setUTCMonth(result.getUTCMonth() + 1, 0);
  result.setUTCDate(Math.min(day, result.getUTCDate()));
  return result;
}
function preparedEnd(v: EduBillingVerification, now: Date) {
  const end = v.verifiedUntil!;
  if (end.getTime() > twelveMonthsFrom(now).getTime())
    block("verified_window_exceeds_stripe_coupon_term_wait_for_renewal");
  return new Date(end);
}
function notice(
  v: EduBillingVerification,
  tx: EduBillingTransaction,
  kind: EduNotice["kind"],
  end: Date
): EduNotice {
  if (!tx.account.email || /[\r\n]/.test(tx.account.email))
    block("transactional_email_unavailable");
  const title =
    kind === "renewal"
      ? "Renew your OlogyWood EDU verification"
      : "Your OlogyWood EDU discount billing deadline";
  return {
    key: `edu:${v.id}:${v.revision}:${kind}:${kind === "expiry" ? "notice" : end.getTime()}`,
    userId: v.userId,
    verificationId: v.id,
    revision: v.revision,
    kind,
    to: tx.account.email!,
    subject: title,
    deadline: end,
    html: `<h2>${title}</h2><p>Your EDU discount is scheduled to end on ${end.toISOString().slice(0, 10)} (UTC). Renew your verification before this date to remain eligible. A verified renewal must also be applied to your existing subscription.</p><p>After the discount ends, future subscription invoices use your standard plan price. Your paid plan is not cancelled. No immediate prorated charge is made by EDU reconciliation. EDU cannot be combined with referral or other promotional discounts.</p>`,
  };
}
async function deliver(
  v: EduBillingVerification,
  tx: EduBillingTransaction,
  deps: EduBillingDependencies,
  kind: EduNotice["kind"],
  end: Date
) {
  if (
    (await deps.repository.deliverNotice(
      notice(v, tx, kind, end),
      deps.sendEmail
    )) !== "sent"
  )
    block("transactional_notice_delivery_uncertain");
}
async function coupon(
  v: EduBillingVerification,
  deps: EduBillingDependencies,
  products: string[],
  end: Date
) {
  const c = await deps.stripe.createCoupon(
    {
      id: `edu_${deps.stripe.mode}_${v.id}_r${v.revision}`,
      percent_off: 50,
      duration: "repeating",
      duration_in_months: 12,
      name: "OlogyWood EDU Student (50%, verified deadline)",
      max_redemptions: 1,
      redeem_by: Math.floor(end.getTime() / 1000),
      applies_to: { products: [...new Set(products)].sort() },
      metadata: metadata(v, deps.stripe.mode),
    },
    `edu-coupon:${deps.stripe.mode}:${v.id}:${v.revision}:${end.getTime()}`
  );
  if (
    !ownedCoupon(c, v, deps, v.revision) ||
    c.redeemBy !== Math.floor(end.getTime() / 1000) ||
    c.products.some(id => !products.includes(id))
  )
    block("coupon_provenance_mismatch");
  return c;
}
async function expireOutstanding(
  v: EduBillingVerification,
  deps: EduBillingDependencies
) {
  if (!v.checkoutSessionId) return;
  const session = await deps.stripe.retrieveCheckout(v.checkoutSessionId);
  const revision = Number(session.metadata.eduVerificationRevision);
  if (
    !modeMatches(session.livemode, deps) ||
    !ownedMetadata(session.metadata, v, deps.stripe.mode, revision) ||
    !Number.isSafeInteger(revision) ||
    revision < 1 ||
    revision > (v.billingVerificationRevision ?? -1) ||
    (session.status === "complete" &&
      v.stripeSubscriptionId &&
      session.subscriptionId !== v.stripeSubscriptionId)
  )
    block("checkout_provenance_mismatch");
  if (session.status === "open") await deps.stripe.expireCheckout(session.id);
  else if (session.status === "complete" && !v.stripeSubscriptionId)
    block("completed_checkout_activation_pending");
}
export interface PrepareEduDiscountCheckoutInput {
  userId: number;
  customerId: string;
  plan: string;
  interval: "month" | "year";
  successUrl: string;
  cancelUrl: string;
  useCredits?: boolean;
}
export type PrepareEduDiscountCheckoutResult =
  | { status: "not_applicable"; reason: "unsupported_plan" | "not_eligible" }
  | {
      status: "ready";
      checkoutUrl: string;
      checkoutSessionId: string;
      couponId: string;
      eduVerificationId: string;
      reused: boolean;
      discountEndsAt: Date;
    };
/** Caller must authenticate the user, enforce paid/owner/complimentary access and
 * approved-origin return URLs before entering this service. Never fall back to an
 * undiscounted checkout when this throws: that would hide a billing blocker. */
export async function prepareEduDiscountCheckout(
  input: PrepareEduDiscountCheckoutInput,
  injectedDeps?: EduBillingDependencies
): Promise<PrepareEduDiscountCheckoutResult> {
  const deps = injectedDeps ?? (await defaultEduBillingDependencies());
  if (input.plan !== "starter" && input.plan !== "professional")
    return { status: "not_applicable", reason: "unsupported_plan" };
  return deps.repository.withUserLock<PrepareEduDiscountCheckoutResult>(
    input.userId,
    async tx => {
      const v = tx.verification;
      const now = clock(deps);
      if (!v || !eligible(v, now))
        return { status: "not_applicable", reason: "not_eligible" };
      assertMode(v, deps);
      if (input.useCredits) block("edu_cannot_stack_referral_credits");
      if (tx.account.stripeSubscriptionId || v.stripeSubscriptionId)
        block("existing_subscription_requires_verified_renewal_flow");
      const resolved = await deps.stripe.resolvePlan(
        input.plan as EduPlan,
        input.interval
      );
      if (!resolved.eligibleProductIds.includes(resolved.productId))
        block("unsupported_plan_product");
      if (v.checkoutSessionId) {
        const session = await deps.stripe.retrieveCheckout(v.checkoutSessionId);
        if (
          !modeMatches(session.livemode, deps) ||
          !ownedMetadata(
            session.metadata,
            v,
            deps.stripe.mode,
            v.billingVerificationRevision ?? -1
          )
        )
          block("checkout_provenance_mismatch");
        const end = validDate(v.discountEndsAt);
        const matches =
          session.status === "open" &&
          session.url &&
          session.expiresAt * 1000 > now.getTime() &&
          v.billingVerificationRevision === v.revision &&
          end &&
          end.getTime() > now.getTime() &&
          session.customerId === input.customerId &&
          session.metadata.plan ===
            SUBSCRIPTION_PRODUCTS[
              input.plan === "starter"
                ? "ARTIST_STARTER"
                : "ARTIST_PROFESSIONAL"
            ].key &&
          session.metadata.interval === input.interval &&
          session.metadata.eduPriceId === resolved.priceId &&
          session.metadata.eduSuccessUrl === input.successUrl &&
          session.metadata.eduCancelUrl === input.cancelUrl;
        if (matches && v.stripeCouponId) {
          const c = await deps.stripe.retrieveCoupon(v.stripeCouponId);
          if (!ownedCoupon(c, v, deps, v.revision))
            block("coupon_provenance_mismatch");
          return {
            status: "ready",
            checkoutUrl: session.url!,
            checkoutSessionId: session.id,
            couponId: c.id,
            eduVerificationId: String(v.id),
            reused: true,
            discountEndsAt: end!,
          };
        }
        await expireOutstanding(v, deps);
      }
      // A short remaining grace window cannot provide the approved notice period.
      // Eligibility is unchanged; ask for verified renewal rather than charge early.
      const end = preparedEnd(v, now);
      if (end.getTime() < now.getTime() + EDU_NOTICE_DAYS * DAY)
        block("renew_before_checkout_notice_window_too_short");
      await deliver(v, tx, deps, "checkout_terms", end);
      const c = await coupon(v, deps, resolved.eligibleProductIds, end);
      const m = {
        ...metadata(v, deps.stripe.mode),
        plan: SUBSCRIPTION_PRODUCTS[
          input.plan === "starter" ? "ARTIST_STARTER" : "ARTIST_PROFESSIONAL"
        ].key,
        interval: input.interval,
        eduPriceId: resolved.priceId,
        eduDiscountEndsAt: String(end.getTime()),
        eduSuccessUrl: input.successUrl,
        eduCancelUrl: input.cancelUrl,
      };
      const session = await deps.stripe.createCheckout(
        {
          customer: input.customerId,
          client_reference_id: String(input.userId),
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [{ price: resolved.priceId, quantity: 1 }],
          discounts: [{ coupon: c.id }],
          metadata: m,
          subscription_data: { metadata: m },
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
        },
        `edu-checkout:${deps.stripe.mode}:${v.id}:${v.revision}:${resolved.priceId}:${c.id}:${v.checkoutSessionId ?? "initial"}:${createHash(
          "sha256"
        )
          .update(input.successUrl + "\n" + input.cancelUrl)
          .digest("hex")
          .slice(0, 24)}`
      );
      if (
        !modeMatches(session.livemode, deps) ||
        !session.url ||
        !ownedMetadata(session.metadata, v, deps.stripe.mode, v.revision)
      )
        block("checkout_provenance_mismatch");
      await tx.save({
        checkoutSessionId: session.id,
        stripeCouponId: c.id,
        billingMode: deps.stripe.mode,
        billingVerificationRevision: v.revision,
        discountEndsAt: end,
        expiryNoticeSentAt: now,
        billingReconcileAfter: now,
      });
      return {
        status: "ready",
        checkoutUrl: session.url,
        checkoutSessionId: session.id,
        couponId: c.id,
        eduVerificationId: String(v.id),
        reused: false,
        discountEndsAt: end,
      };
    }
  );
}

async function recordActivationLocked(
  input: { userId: number; checkoutSessionId: string; subscriptionId: string },
  tx: EduBillingTransaction,
  deps: EduBillingDependencies
) {
  const v = tx.verification;
  if (!v) return { status: "skipped" as const, reason: "no_verification" };
  assertMode(v, deps);
  if (
    v.checkoutSessionId !== input.checkoutSessionId ||
    !v.stripeCouponId ||
    v.billingVerificationRevision === null
  )
    block("activation_provenance_mismatch");
  if (
    (tx.account.stripeSubscriptionId &&
      tx.account.stripeSubscriptionId !== input.subscriptionId) ||
    (v.stripeSubscriptionId && v.stripeSubscriptionId !== input.subscriptionId)
  )
    block("competing_subscription_identity");
  const session = await deps.stripe.retrieveCheckout(input.checkoutSessionId);
  const sub = await deps.stripe.retrieveSubscription(input.subscriptionId);
  if (!modeMatches(session.livemode, deps) || !modeMatches(sub.livemode, deps))
    block("billing_mode_mismatch");
  if (
    session.status !== "complete" ||
    session.paymentStatus !== "paid" ||
    session.subscriptionId !== sub.id ||
    session.customerId !== sub.customerId ||
    !["active", "past_due"].includes(sub.status) ||
    !ownedMetadata(
      session.metadata,
      v,
      deps.stripe.mode,
      v.billingVerificationRevision
    ) ||
    !ownedMetadata(
      sub.metadata,
      v,
      deps.stripe.mode,
      v.billingVerificationRevision
    )
  )
    block("activation_evidence_mismatch");
  const discount = sub.discounts.find(d => d.coupon?.id === v.stripeCouponId);
  if (
    !discount?.coupon ||
    !ownedCoupon(discount.coupon, v, deps, v.billingVerificationRevision) ||
    !sub.productIds.length ||
    sub.productIds.some(p => !discount.coupon!.products.includes(p))
  )
    block("activation_coupon_mismatch");
  const end = validDate(v.discountEndsAt);
  if (!end || (discount.end && discount.end * 1000 < end.getTime()))
    block("stripe_discount_ends_before_disclosed_deadline");
  await tx.save({
    stripeSubscriptionId: sub.id,
    billingReconcileAfter: clock(deps),
  });
  return {
    status: "recorded" as const,
    subscriptionId: sub.id,
    discountEndsAt: end,
  };
}
export async function recordEduSubscriptionActivation(
  input: { userId: number; checkoutSessionId: string; subscriptionId: string },
  injectedDeps?: EduBillingDependencies
) {
  const deps = injectedDeps ?? (await defaultEduBillingDependencies());
  return deps.repository.withUserLock(input.userId, tx =>
    recordActivationLocked(input, tx, deps)
  );
}

export async function reconcileEduBillingLifecycle(
  input: { userId: number },
  injectedDeps?: EduBillingDependencies
) {
  const deps = injectedDeps ?? (await defaultEduBillingDependencies());
  return deps.repository.withUserLock(input.userId, async tx => {
    const v = tx.verification;
    const now = clock(deps);
    if (!v) return { status: "skipped" as const, reason: "no_verification" };
    assertMode(v, deps);
    if (v.checkoutSessionId && !v.stripeSubscriptionId) {
      const checkout = await deps.stripe.retrieveCheckout(v.checkoutSessionId);
      if (!modeMatches(checkout.livemode, deps)) block("billing_mode_mismatch");
      if (checkout.status === "complete") {
        if (
          !checkout.subscriptionId ||
          tx.account.stripeSubscriptionId !== checkout.subscriptionId
        )
          block("completed_checkout_requires_subscription_sync");
        await recordActivationLocked(
          {
            userId: v.userId,
            checkoutSessionId: checkout.id,
            subscriptionId: checkout.subscriptionId,
          },
          tx,
          deps
        );
      }
    }
    const end = validDate(v.discountEndsAt);
    const renewal =
      eligible(v, now) &&
      v.billingVerificationRevision !== null &&
      (tx.latestApprovalRevision ?? -1) > v.billingVerificationRevision;
    if (!eligible(v, now) || renewal || (end && end.getTime() <= now.getTime()))
      await expireOutstanding(v, deps);
    if (
      eligible(v, now) &&
      v.verifiedUntil &&
      now.getTime() >= v.verifiedUntil.getTime() - EDU_NOTICE_DAYS * DAY &&
      !v.renewalNoticeSentAt
    ) {
      await deliver(
        v,
        tx,
        deps,
        "renewal",
        v.discountEndsAt ?? v.verifiedUntil!
      );
      await tx.save({ renewalNoticeSentAt: now });
    }
    if (!v.stripeSubscriptionId) {
      await tx.save({ billingReconcileAfter: new Date(now.getTime() + DAY) });
      return {
        status: "skipped" as const,
        reason: v.checkoutSessionId ? "checkout_only" : "no_billing_provenance",
      };
    }
    if (
      !v.stripeCouponId ||
      !end ||
      v.billingVerificationRevision === null ||
      tx.account.stripeSubscriptionId !== v.stripeSubscriptionId
    )
      block("legacy_or_unmatched_subscription");
    const sub = await deps.stripe.retrieveSubscription(v.stripeSubscriptionId);
    if (!modeMatches(sub.livemode, deps)) block("billing_mode_mismatch");
    const activationRevision = Number(sub.metadata.eduVerificationRevision);
    if (
      !Number.isSafeInteger(activationRevision) ||
      activationRevision < 1 ||
      activationRevision > v.billingVerificationRevision ||
      !ownedMetadata(sub.metadata, v, deps.stripe.mode, activationRevision)
    )
      block("subscription_provenance_mismatch");
    if (sub.unsupportedDiscounts)
      block("unexpanded_or_item_level_discounts_require_review");
    let edu = sub.discounts.find(d => d.coupon?.id === v.stripeCouponId);
    if (renewal && !edu) {
      const recovered = sub.discounts.find(
        d => d.coupon && ownedCoupon(d.coupon, v, deps, v.revision)
      );
      if (
        recovered?.coupon &&
        sub.discounts.length === 1 &&
        recovered.coupon.redeemBy ===
          Math.floor(v.verifiedUntil!.getTime() / 1000) &&
        sub.productIds.length &&
        sub.productIds.every(p => recovered.coupon!.products.includes(p))
      ) {
        await deliver(v, tx, deps, "renewal_terms", v.verifiedUntil!);
        await tx.save({
          stripeCouponId: recovered.coupon.id,
          billingVerificationRevision: v.revision,
          discountEndsAt: v.verifiedUntil,
          expiryNoticeSentAt: now,
          renewalNoticeSentAt: null,
          billingReconcileAfter: new Date(now.getTime() + DAY),
        });
        return { status: "renewed" as const, discountEndsAt: v.verifiedUntil };
      }
      if (sub.discounts.length)
        block("renewal_cannot_stack_unrelated_discounts");
      const previous = await deps.stripe.retrieveCoupon(v.stripeCouponId);
      if (!ownedCoupon(previous, v, deps, v.billingVerificationRevision))
        block("coupon_provenance_mismatch");
      // Only a previously activated, exactly matched EDU coupon may be renewed
      // after automatic expiry/removal. Legacy or deleted coupons fail closed.
      edu = { id: "expired_edu_discount", coupon: previous, end: null };
    }
    if (!edu) {
      await tx.save({ billingReconcileAfter: new Date(now.getTime() + DAY) });
      return {
        status: "skipped" as const,
        reason: "matched_edu_discount_already_absent",
      };
    }
    if (
      !edu.coupon ||
      !ownedCoupon(edu.coupon, v, deps, v.billingVerificationRevision)
    )
      block("coupon_provenance_mismatch");
    if (
      !sub.productIds.length ||
      sub.productIds.some(p => !edu.coupon!.products.includes(p))
    )
      block("unsupported_subscription_product");
    if (renewal) {
      if (sub.discounts.length > 1)
        block("renewal_cannot_stack_unrelated_discounts");
      if (!["active", "past_due"].includes(sub.status))
        block("subscription_not_renewable");
      const newEnd = preparedEnd(v, now);
      if (newEnd.getTime() < now.getTime() + EDU_NOTICE_DAYS * DAY)
        block("renewal_notice_window_too_short");
      await deliver(v, tx, deps, "renewal_terms", newEnd);
      const c = await coupon(v, deps, edu.coupon.products, newEnd);
      await deps.stripe.setDiscounts(
        sub.id,
        [{ coupon: c.id }],
        `edu-renew:${deps.stripe.mode}:${v.id}:${v.revision}:${c.id}`
      );
      // Preserve subscription metadata's initial activation revision. Reconciliation
      // validates it separately from the current coupon's renewal revision.
      await tx.save({
        stripeCouponId: c.id,
        billingVerificationRevision: v.revision,
        discountEndsAt: newEnd,
        expiryNoticeSentAt: now,
        renewalNoticeSentAt: null,
        billingReconcileAfter: new Date(now.getTime() + DAY),
      });
      return { status: "renewed" as const, discountEndsAt: newEnd };
    }
    const effectiveEnd = new Date(
      Math.min(end.getTime(), edu.end ? edu.end * 1000 : end.getTime())
    );
    if (edu.end && edu.end * 1000 < end.getTime())
      block("stripe_discount_ends_before_disclosed_deadline");
    const ending = !eligible(v, now) || now.getTime() >= effectiveEnd.getTime();
    if (
      !ending &&
      now.getTime() < effectiveEnd.getTime() - EDU_NOTICE_DAYS * DAY
    ) {
      await tx.save({ billingReconcileAfter: new Date(now.getTime() + DAY) });
      return { status: "unchanged" as const };
    }
    const noticeWindowEnd =
      (v.expiryNoticeSentAt?.getTime() ?? now.getTime()) +
      EDU_NOTICE_DAYS * DAY;
    if (edu.end && edu.end * 1000 < noticeWindowEnd)
      block("stripe_coupon_expiry_precedes_notice_window_manual_review");
    if (!v.expiryNoticeSentAt) {
      await deliver(
        v,
        tx,
        deps,
        "expiry",
        new Date(
          Math.max(
            effectiveEnd.getTime(),
            now.getTime() + EDU_NOTICE_DAYS * DAY
          )
        )
      );
      await tx.save({
        expiryNoticeSentAt: now,
        billingReconcileAfter: new Date(now.getTime() + EDU_NOTICE_DAYS * DAY),
      });
      return { status: "notice_sent" as const };
    }
    const removeAfter = Math.max(
      effectiveEnd.getTime(),
      v.expiryNoticeSentAt.getTime() + EDU_NOTICE_DAYS * DAY
    );
    // Revocation keeps the original disclosed deadline (or 30-day notice), never
    // accelerates standard billing merely because an admin clicked Revoke.
    if (!ending || now.getTime() < removeAfter) {
      await tx.save({
        billingReconcileAfter: new Date(
          Math.min(removeAfter, now.getTime() + DAY)
        ),
      });
      return {
        status: "notice_period" as const,
        reconcileAfter: new Date(removeAfter),
      };
    }
    await deps.stripe.setDiscounts(
      sub.id,
      sub.discounts.filter(d => d.id !== edu.id).map(d => ({ discount: d.id })),
      `edu-remove:${deps.stripe.mode}:${v.id}:${v.billingVerificationRevision}:${edu.id}`
    );
    await tx.save({ billingReconcileAfter: null });
    return { status: "discount_removed" as const, subscriptionId: sub.id };
  });
}

/** Invoke from an existing authenticated project Heartbeat only. No registration,
 * timer, or integration call occurs at import. Errors are visible per account. */
export async function runEduLifecycleBatch(
  input: { limit?: number; afterUserId?: number; mode?: EduBillingMode } = {},
  injectedDeps?: EduBillingDependencies
) {
  const limit = Math.min(200, Math.max(1, Math.floor(input.limit ?? 50)));
  const repository =
    injectedDeps?.repository ?? (await createSqlEduBillingRepository());
  const mode =
    injectedDeps?.stripe.mode ??
    input.mode ??
    (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "live" : "test");
  const ids = await repository.listUserIds(
    limit + 1,
    input.afterUserId ?? 0,
    mode
  );
  if (!ids.length)
    return {
      results: [],
      blocked: 0,
      hasMore: false,
      nextCursor: input.afterUserId ?? 0,
    };
  const deps = injectedDeps ?? {
    ...(await defaultEduBillingDependencies(mode)),
    repository,
  };
  const results: Array<{ userId: number; status: string; reason?: string }> =
    [];
  const batchStarted = Date.now();
  for (const userId of ids.slice(0, limit)) {
    if (Date.now() - batchStarted >= 80_000) break;
    try {
      results.push({
        userId,
        ...(await reconcileEduBillingLifecycle({ userId }, deps)),
      });
    } catch (error) {
      results.push({
        userId,
        status: "blocked",
        reason:
          error instanceof EduBillingBlocked
            ? error.reason
            : "billing_dependency_failed",
      });
    }
  }
  return {
    results,
    blocked: results.filter(r => r.status === "blocked").length,
    hasMore: ids.length > results.length,
    nextCursor: results.at(-1)?.userId ?? input.afterUserId ?? 0,
  };
}

/** Adapt an explicitly chosen mode-specific Stripe client. Never use another
 * mode as fallback. Resolves existing configured price lookup keys only. */
export function createEduStripeGateway(
  client: Stripe,
  mode: EduBillingMode
): EduBillingStripe {
  const id = (value: string | { id: string } | null | undefined) =>
    typeof value === "string" ? value : (value?.id ?? null);
  const normalizeCoupon = (c: Stripe.Coupon): EduCoupon => ({
    id: c.id,
    livemode: c.livemode,
    percentOff: c.percent_off,
    duration: c.duration,
    months: c.duration_in_months,
    redeemBy: c.redeem_by,
    products: c.applies_to?.products ?? [],
    metadata: c.metadata ?? {},
  });
  const normalizeCheckout = (s: Stripe.Checkout.Session): EduCheckout => ({
    id: s.id,
    livemode: s.livemode,
    status: s.status,
    url: s.url,
    expiresAt: s.expires_at,
    customerId: id(s.customer),
    subscriptionId: id(s.subscription),
    paymentStatus: s.payment_status,
    metadata: s.metadata ?? {},
  });
  return {
    mode,
    async resolvePlan(plan, interval) {
      const product =
        SUBSCRIPTION_PRODUCTS[
          plan === "starter" ? "ARTIST_STARTER" : "ARTIST_PROFESSIONAL"
        ];
      const keys: string[] = [
        SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.lookupKey,
        SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.yearlyLookupKey,
        SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.lookupKey,
        SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.yearlyLookupKey,
      ];
      const enterpriseKeys = [
        SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.lookupKey,
        SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.yearlyLookupKey,
      ];
      const prices = await client.prices.list({
        lookup_keys: [...keys, ...enterpriseKeys],
        active: true,
        limit: 100,
      });
      const enterpriseProducts = new Set(
        prices.data
          .filter(p => enterpriseKeys.some(key => key === p.lookup_key))
          .map(p => id(p.product))
      );
      if (prices.has_more) block("configured_plan_prices_require_review");
      const supported = prices.data.filter(
        p =>
          p.livemode === (mode === "live") &&
          p.type === "recurring" &&
          p.currency === "usd" &&
          p.recurring?.interval_count === 1 &&
          keys.includes(p.lookup_key ?? "") &&
          Object.values(SUBSCRIPTION_PRODUCTS).some(
            config =>
              (p.lookup_key === config.lookupKey &&
                p.recurring?.interval === "month" &&
                p.unit_amount === config.priceMonthly) ||
              (p.lookup_key === config.yearlyLookupKey &&
                p.recurring?.interval === "year" &&
                p.unit_amount === config.priceYearly)
          )
      );
      const selected = supported.filter(
        p =>
          p.lookup_key ===
          (interval === "year" ? product.yearlyLookupKey : product.lookupKey)
      );
      if (
        selected.length !== 1 ||
        !id(selected[0].product) ||
        supported.some(p => enterpriseProducts.has(id(p.product)))
      )
        block("configured_plan_price_unavailable_or_ambiguous");
      const productIds = [
        ...new Set(
          supported.map(p => id(p.product)).filter((p): p is string => !!p)
        ),
      ];
      return {
        priceId: selected[0].id,
        productId: id(selected[0].product)!,
        eligibleProductIds: productIds,
      };
    },
    async createCoupon(params, key) {
      return normalizeCoupon(
        await client.coupons.create(params, { idempotencyKey: key })
      );
    },
    async retrieveCoupon(couponId) {
      return normalizeCoupon(await client.coupons.retrieve(couponId));
    },
    async retrieveCheckout(sessionId) {
      return normalizeCheckout(
        await client.checkout.sessions.retrieve(sessionId)
      );
    },
    async expireCheckout(sessionId) {
      await client.checkout.sessions.expire(sessionId);
    },
    async createCheckout(params, key) {
      return normalizeCheckout(
        await client.checkout.sessions.create(params, { idempotencyKey: key })
      );
    },
    async retrieveSubscription(subscriptionId) {
      const s = await client.subscriptions.retrieve(subscriptionId, {
        expand: ["discounts.source.coupon", "items.data.discounts"],
      });
      return {
        id: s.id,
        livemode: s.livemode,
        customerId: id(s.customer),
        status: s.status,
        metadata: s.metadata,
        productIds: s.items.data
          .map(item => id(item.price.product))
          .filter((p): p is string => !!p),
        unsupportedDiscounts:
          s.items.has_more ||
          s.discounts.some(d => typeof d === "string") ||
          s.items.data.some(item => item.discounts.length > 0),
        discounts: s.discounts
          .filter((d): d is Stripe.Discount => typeof d !== "string")
          .map(d => ({
            id: d.id,
            end: d.end,
            coupon:
              typeof d.source.coupon === "object" && d.source.coupon
                ? normalizeCoupon(d.source.coupon)
                : null,
          })),
      };
    },
    async setDiscounts(subscriptionId, discounts, key) {
      await client.subscriptions.update(
        subscriptionId,
        {
          discounts: discounts.length ? discounts : "",
          proration_behavior: "none",
        },
        { idempotencyKey: key }
      );
    },
  };
}

export async function defaultEduBillingDependencies(
  mode?: EduBillingMode
): Promise<EduBillingDependencies> {
  const [
    { getDefaultStripeApiKey, getStripeClientForWebhookMode },
    { sendEmail },
  ] = await Promise.all([import("./stripeWebhookMode"), import("../email")]);
  const chosen =
    mode ?? (getDefaultStripeApiKey().startsWith("sk_live_") ? "live" : "test");
  const repository = await createSqlEduBillingRepository();
  return {
    repository,
    stripe: createEduStripeGateway(
      getStripeClientForWebhookMode(chosen),
      chosen
    ),
    sendEmail: params => sendEmail(params, { timeoutMs: 10_000 }),
  };
}

export interface EduSqlConnection {
  execute(query: string, values?: unknown[]): Promise<any>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
}
export interface EduSqlPool {
  execute(query: string, values?: unknown[]): Promise<any>;
  getConnection(): Promise<EduSqlConnection>;
}
/** Called only at supported runtime entry points. Schema readiness is checked by
 * the parent EDU schema bootstrap; missing columns fail closed, not fake success. */
export async function createSqlEduBillingRepository(
  injectedPool?: EduSqlPool
): Promise<EduBillingRepository> {
  let pool = injectedPool;
  if (!pool) {
    const db = await import("../db");
    await db.getDb();
    pool = db.getPool() as unknown as EduSqlPool | undefined;
  }
  if (!pool) block("edu_billing_database_unavailable");
  const database = pool!;
  const { ensureEduBillingSchema } = await import("./eduBillingSchemaService");
  await ensureEduBillingSchema(database);
  return {
    async withUserLock(userId, work) {
      const conn = await database.getConnection();
      try {
        await conn.beginTransaction();
        const [rows] = await conn.execute(
          "SELECT * FROM edu_verifications WHERE userId=? LIMIT 1 FOR UPDATE",
          [userId]
        );
        const [accounts] = await conn.execute(
          "SELECT u.email, s.stripeSubscriptionId FROM users u LEFT JOIN user_subscriptions s ON s.userId=u.id WHERE u.id=? LIMIT 1",
          [userId]
        );
        const v = rows[0] as EduBillingVerification | undefined;
        const [approvals] = v
          ? await conn.execute(
              "SELECT MAX(revision) AS revision FROM edu_verification_events WHERE verificationId=? AND reviewDecision IN (?,?) AND manualProofConfirmed=1",
              [v.id, "approve", "renew"]
            )
          : [[]];
        const tx: EduBillingTransaction = {
          verification: v ?? null,
          account: accounts[0] ?? { email: null, stripeSubscriptionId: null },
          latestApprovalRevision: approvals[0]?.revision ?? null,
          async save(patch) {
            if (!v) block("verification_missing");
            const allowed = [
              "checkoutSessionId",
              "stripeCouponId",
              "stripeSubscriptionId",
              "billingMode",
              "billingVerificationRevision",
              "renewalNoticeSentAt",
              "expiryNoticeSentAt",
              "discountEndsAt",
              "billingReconcileAfter",
            ];
            const entries = Object.entries(patch);
            if (!entries.length) return;
            if (entries.some(([key]) => !allowed.includes(key)))
              block("invalid_billing_patch");
            await conn.execute(
              `UPDATE edu_verifications SET ${entries.map(([key]) => `\`${key}\`=?`).join(",")} WHERE id=? AND revision=?`,
              [...entries.map(([, value]) => value), v!.id, v!.revision]
            );
            Object.assign(v!, patch);
          },
        };
        const result = await work(tx);
        await conn.commit();
        return result;
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
    },
    async listUserIds(limit, afterUserId, mode) {
      const [rows] = await database.execute(
        "SELECT userId FROM edu_verifications WHERE userId>? AND (billingMode=? OR (billingMode IS NULL AND status=?)) AND (billingReconcileAfter IS NULL OR billingReconcileAfter<=UTC_TIMESTAMP()) ORDER BY userId LIMIT ?",
        [afterUserId, mode ?? "test", "approved", limit]
      );
      return rows.map((row: { userId: number }) => row.userId);
    },
    async deliverNotice(n, send) {
      // Independent autocommit connection: accepted sends survive billing rollback.
      // No email addresses or evidence are copied into the durable outbox.
      const [insert] = await database.execute(
        "INSERT IGNORE INTO edu_billing_notices (noticeKey,userId,verificationId,revision,kind,deadline,state) VALUES (?,?,?,?,?,?,?)",
        [
          n.key,
          n.userId,
          n.verificationId,
          n.revision,
          n.kind,
          n.deadline,
          "attempting",
        ]
      );
      if (insert.affectedRows !== 1) {
        const [rows] = await database.execute(
          "SELECT state FROM edu_billing_notices WHERE noticeKey=? LIMIT 1",
          [n.key]
        );
        if (rows[0]?.state === "sent") return "sent";
        if (rows[0]?.state !== "retry_authorized") return "uncertain";
        const [claim] = await database.execute(
          "UPDATE edu_billing_notices SET state=?,createdAt=UTC_TIMESTAMP() WHERE noticeKey=? AND state=?",
          ["attempting", n.key, "retry_authorized"]
        );
        if (claim.affectedRows !== 1) return "uncertain";
      }
      try {
        if (await send({ to: n.to, subject: n.subject, html: n.html })) {
          await database.execute(
            "UPDATE edu_billing_notices SET state=?,sentAt=UTC_TIMESTAMP() WHERE noticeKey=? AND state=?",
            ["sent", n.key, "attempting"]
          );
          return "sent";
        }
      } catch {
        /* uncertain delivery remains durable and is not auto-replayed */
      }
      return "uncertain";
    },
  };
}

/** This is an integration hook, NOT a public/admin route. The parent must bind
 * authorize to its verified admin/owner policy. No send or Stripe mutation occurs.
 * Operator must consult provider evidence; 'not_accepted' is never inferred from
 * a timeout or sendEmail(false). Resolutions are transactionally audited. */
export async function resolveEduNoticeDelivery(
  input: {
    noticeKey: string;
    actorUserId: number;
    decision: "accepted" | "not_accepted";
    providerEvidence: string;
    acceptedAt?: Date;
  },
  deps: {
    pool: EduSqlPool;
    authorize(actorUserId: number): Promise<boolean>;
    now?: () => Date;
  }
) {
  if (
    !Number.isSafeInteger(input.actorUserId) ||
    input.actorUserId < 1 ||
    !(await deps.authorize(input.actorUserId))
  )
    block("notice_resolution_forbidden");
  if (
    !/^edu:[0-9]+:[0-9]+:[a-z_]+:[a-z0-9]+$/.test(input.noticeKey) ||
    input.providerEvidence.trim().length < 10 ||
    input.providerEvidence.length > 500 ||
    !["accepted", "not_accepted"].includes(input.decision)
  )
    block("invalid_notice_resolution");
  const now = deps.now?.() ?? new Date();
  if (
    input.decision === "accepted" &&
    (!input.acceptedAt ||
      !validDate(input.acceptedAt) ||
      input.acceptedAt.getTime() > now.getTime())
  )
    block("invalid_provider_acceptance_time");
  const conn = await deps.pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      "SELECT state,createdAt FROM edu_billing_notices WHERE noticeKey=? FOR UPDATE",
      [input.noticeKey]
    );
    if (!rows[0] || rows[0].state !== "attempting")
      block("notice_resolution_conflict");
    // Do not race an in-flight sender; platform callbacks have a two-minute limit.
    if (now.getTime() - new Date(rows[0].createdAt).getTime() < 120_000)
      block("notice_attempt_still_in_flight");
    if (input.decision === 'accepted' && input.acceptedAt!.getTime() < new Date(rows[0].createdAt).getTime() - 1000)
      block('invalid_provider_acceptance_time');
    await conn.execute(
      "INSERT INTO edu_billing_notice_resolutions (noticeKey,actorUserId,decision,providerEvidence) VALUES (?,?,?,?)",
      [
        input.noticeKey,
        input.actorUserId,
        input.decision,
        input.providerEvidence.trim(),
      ]
    );
    await conn.execute(
      "UPDATE edu_billing_notices SET state=?,sentAt=? WHERE noticeKey=? AND state=?",
      [
        input.decision === "accepted" ? "sent" : "retry_authorized",
        input.acceptedAt ?? null,
        input.noticeKey,
        "attempting",
      ]
    );
    await conn.commit();
    return {
      status:
        input.decision === "accepted"
          ? ("notice_confirmed" as const)
          : ("retry_authorized" as const),
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
