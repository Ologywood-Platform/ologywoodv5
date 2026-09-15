import { getDb } from "../db";
import { eq } from "drizzle-orm";
import {
  ologyLiveSessionContracts,
  ologyLiveBookings,
  ologyLiveExperiences,
  users,
} from "../../drizzle/schema";

/**
 * Ology Live Session Contract Generator
 * Creates creator-session agreements. Athlete sessions include readiness guidance,
 * but Ologywood does not certify NIL compliance or act as an athlete agent.
 */

interface ContractParty {
  name: string;
  email: string | null;
  role: "talent" | "fan";
}

interface SessionDetails {
  experienceTitle: string;
  platform: string;
  duration: number; // minutes
  scheduledAt: Date;
  price: string;
  platformFee: string;
  netToTalent: string;
  capacityType: string;
  category: string;
}

interface NILContractContent {
  version: string;
  generatedAt: string;
  parties: {
    talent: ContractParty;
    fan: ContractParty;
  };
  sessionDetails: SessionDetails;
  sections: {
    title: string;
    content: string;
  }[];
  ncaaComplianceDisclaimer: string;
  mediaRights: {
    recordingAllowed: boolean;
    streamingAllowed: boolean;
    commercialUseAllowed: boolean;
    contentOwnership: string;
  };
  cancellationPolicy: {
    talentCancellation: string;
    fanCancellation: string;
    refundPolicy: string;
  };
  compensation: {
    totalAmount: string;
    platformFee: string;
    platformFeeClassification: string;
    paymentProcessingDisclosure: string;
    netToTalent: string;
    paymentMethod: string;
    paymentTiming: string;
  };
}

const PLATFORM_FEE_PERCENT = 15;

export async function generateSessionContract(bookingId: number): Promise<number> {
  const drizzleDb = (await getDb())!;
  // Fetch booking with related data
  const booking = (await drizzleDb.select().from(ologyLiveBookings)
    .where(eq(ologyLiveBookings.id, bookingId)).limit(1))[0];

  if (!booking) throw new Error(`Booking ${bookingId} not found`);

  const experience = (await drizzleDb.select().from(ologyLiveExperiences)
    .where(eq(ologyLiveExperiences.id, booking.experienceId)).limit(1))[0];

  if (!experience) throw new Error(`Experience ${booking.experienceId} not found`);

  const talent = (await drizzleDb.select().from(users)
    .where(eq(users.id, booking.talentId)).limit(1))[0];

  const fan = (await drizzleDb.select().from(users)
    .where(eq(users.id, booking.fanId)).limit(1))[0];

  if (!talent || !fan) throw new Error("Talent or fan not found");

  const price = parseFloat(booking.amount || "0");
  const platformFee = price * (PLATFORM_FEE_PERCENT / 100);
  const netToTalent = price - platformFee;

  const sessionDetails: SessionDetails = {
    experienceTitle: experience.title,
    platform: experience.platform,
    duration: experience.duration,
    scheduledAt: booking.scheduledAt!,
    price: price.toFixed(2),
    platformFee: platformFee.toFixed(2),
    netToTalent: netToTalent.toFixed(2),
    capacityType: experience.capacityType,
    category: experience.category,
  };

  const contractContent: NILContractContent = {
    version: "2.0",
    generatedAt: new Date().toISOString(),
    parties: {
      talent: { name: talent.name || "Talent", email: talent.email, role: "talent" },
      fan: { name: fan.name || "Fan", email: fan.email, role: "fan" },
    },
    sessionDetails,
    sections: generateContractSections(sessionDetails, talent.name || "Talent", fan.name || "Fan"),
    ncaaComplianceDisclaimer: generateNcaaDisclaimer(),
    mediaRights: {
      recordingAllowed: false,
      streamingAllowed: experience.capacityType === "broadcast",
      commercialUseAllowed: false,
      contentOwnership: "All content created during the session remains the intellectual property of the respective creator. The Talent retains all rights to their name, image, and likeness. No commercial use of session content is permitted without separate written agreement.",
    },
    cancellationPolicy: {
      talentCancellation: "Talent may cancel up to 24 hours before the session for a full refund to the Fan. Cancellations within 24 hours may result in a partial refund at platform discretion.",
      fanCancellation: "Fan may cancel up to 48 hours before the session for a full refund. Cancellations within 48 hours but more than 24 hours before receive a 50% refund. Cancellations within 24 hours are non-refundable.",
      refundPolicy: "Refunds are processed within 5-10 business days to the original payment method.",
    },
    compensation: {
      totalAmount: `$${price.toFixed(2)}`,
      platformFee: `$${platformFee.toFixed(2)} (${PLATFORM_FEE_PERCENT}%)`,
      platformFeeClassification: "Ologywood technology marketplace service fee; not athlete-agent compensation",
      paymentProcessingDisclosure: "Stripe payment-processing fees, if applicable, are separate from Ologywood's platform service fee and are disclosed through the payment flow.",
      netToTalent: `$${netToTalent.toFixed(2)}`,
      paymentMethod: "Stripe (processed by Ologywood)",
      paymentTiming: "Payment is collected at time of booking. Talent payout is processed after session completion.",
    },
  };

  // Insert the contract
  const result = await drizzleDb.insert(ologyLiveSessionContracts).values({
    bookingId,
    experienceId: booking.experienceId,
    talentId: booking.talentId,
    fanId: booking.fanId,
    contractContent: contractContent,
    status: "generated",
    compensationAmount: price.toFixed(2),
    mediaRightsGranted: contractContent.mediaRights,
    ncaaComplianceNote: contractContent.ncaaComplianceDisclaimer,
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  return result[0].insertId;
}

function generateContractSections(
  session: SessionDetails,
  talentName: string,
  fanName: string
): { title: string; content: string }[] {
  return [
    {
      title: "1. Agreement Overview",
      content: `This Virtual Session Agreement ("Agreement") is entered into between ${talentName} ("Talent") and ${fanName} ("Fan") through the Ologywood technology marketplace ("Platform"). This Agreement governs the terms of a virtual ${session.category} session scheduled for ${new Date(session.scheduledAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} with a duration of ${session.duration} minutes. If the Talent is a student athlete and the session involves NIL activity, separate institutional, state, or federal requirements may apply.`,
    },
    {
      title: "2. Session Details",
      content: `The Talent agrees to provide a ${session.capacityType.replace("_", " ")} ${session.category} session titled "${session.experienceTitle}" via ${session.platform}. The session shall last approximately ${session.duration} minutes. The Talent will provide access to the session platform at the scheduled time.`,
    },
    {
      title: "3. Compensation",
      content: `The Fan agrees to pay $${session.price} for this session. Ologywood charges a ${PLATFORM_FEE_PERCENT}% technology marketplace service fee ($${session.platformFee}), which is separate from any athlete-agent compensation, and the Talent receives $${session.netToTalent} before any separately disclosed payment-processing adjustments. Payment is processed by Stripe. Ologywood is not an escrow agent and does not provide athlete-agent representation.`,
    },
    {
      title: "4. Name, Image, and Likeness Rights",
      content: `The Talent grants limited use of their name, image, and likeness solely for the purpose of this session and its promotion on the Platform. This grant does not extend to any commercial endorsement, advertising, or promotional use by the Fan. The Talent retains all ownership rights to their NIL. Any use of the Talent's NIL beyond this session requires separate written consent.`,
    },
    {
      title: "5. Recording and Content Rights",
      content: `Unless explicitly agreed upon in writing, recording of the session by either party is prohibited. If the session is a broadcast-type experience, the Talent retains all rights to any broadcast content. Screenshots, screen recordings, or any capture of the session without consent constitutes a breach of this Agreement.`,
    },
    {
      title: "6. Conduct and Expectations",
      content: `Both parties agree to conduct themselves professionally and respectfully during the session. Harassment, hate speech, or inappropriate behavior by either party will result in immediate session termination without refund. The Platform reserves the right to ban users who violate these conduct standards.`,
    },
    {
      title: "7. Cancellation and Rescheduling",
      content: `Either party may request cancellation or rescheduling subject to the Platform's cancellation policy. The Talent may cancel up to 24 hours before the session for a full refund. The Fan may cancel up to 48 hours before for a full refund, or up to 24 hours before for a 50% refund. No-shows by either party are handled per Platform policy.`,
    },
    {
      title: "8. Limitation of Liability",
      content: `The Platform facilitates this connection but is not responsible for the quality, content, or outcome of the session. The Platform's liability is limited to the amount paid for the session. Neither party shall be liable for indirect, incidental, or consequential damages.`,
    },
    {
      title: "9. Dispute Resolution",
      content: `The parties may first use the Platform's voluntary support and dispute process. Nothing in this Agreement requires a student athlete to arbitrate a claim, waive a private right of action, or waive another non-waivable statutory remedy that applicable law preserves. Other disputes remain subject to the applicable Platform Terms.`,
    },
    {
      title: "10. Governing Law",
      content: `This Agreement shall be governed by and construed in accordance with the laws of the State of [Talent's State], without regard to conflict of law principles.`,
    },
  ];
}

function generateNcaaDisclaimer(): string {
  return `STUDENT-ATHLETE NIL READINESS NOTICE: Ologywood does not certify that this Agreement complies with NCAA, conference, institutional, state, or federal requirements. If the Talent is a student athlete and this session is NIL activity, the Talent is responsible for confirming eligibility, obtaining any required institutional or legal review, making required disclosures, and retaining submission evidence. Ologywood provides private tracking tools and in-app reminders but does not file disclosures. This notice is educational and is not legal advice.`;
}

export async function getContractByBookingId(bookingId: number) {
  const drizzleDb = (await getDb())!;
  const contract = (await drizzleDb.select().from(ologyLiveSessionContracts)
    .where(eq(ologyLiveSessionContracts.bookingId, bookingId)).limit(1))[0];
  return contract || null;
}

export async function signContract(
  contractId: number,
  signerRole: "talent" | "fan",
  signature: string
): Promise<void> {
  const drizzleDb = (await getDb())!;
  const contract = (await drizzleDb.select().from(ologyLiveSessionContracts)
    .where(eq(ologyLiveSessionContracts.id, contractId)).limit(1))[0];

  if (!contract) throw new Error("Contract not found");

  const now = new Date();

  if (signerRole === "talent") {
    const newStatus = contract.fanSignedAt ? "fully_executed" : "signed_by_talent";
    await drizzleDb.update(ologyLiveSessionContracts)
      .set({ talentSignature: signature, talentSignedAt: now, status: newStatus })
      .where(eq(ologyLiveSessionContracts.id, contractId));
  } else {
    const newStatus = contract.talentSignedAt ? "fully_executed" : "signed_by_fan";
    await drizzleDb.update(ologyLiveSessionContracts)
      .set({ fanSignature: signature, fanSignedAt: now, status: newStatus })
      .where(eq(ologyLiveSessionContracts.id, contractId));
  }
}

export async function markContractViewed(contractId: number, viewerRole: "talent" | "fan"): Promise<void> {
  const drizzleDb = (await getDb())!;
  const contract = (await drizzleDb.select().from(ologyLiveSessionContracts)
    .where(eq(ologyLiveSessionContracts.id, contractId)).limit(1))[0];

  if (!contract) throw new Error("Contract not found");

  // Only update status if it's still in "generated" state
  if (contract.status === "generated") {
    await drizzleDb.update(ologyLiveSessionContracts)
      .set({ status: "viewed" })
      .where(eq(ologyLiveSessionContracts.id, contractId));
  }
}
