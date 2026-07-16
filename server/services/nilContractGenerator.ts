/**
 * NIL Contract Document Generator
 * Generates professional, comprehensive contract documents for athlete bookings.
 * Auto-fills from booking data + rider template to produce a signable NIL/college sports contract.
 * 
 * Sections:
 * 1. Header & Parties
 * 2. Appearance/Engagement Details
 * 3. Compensation & Payment Terms
 * 4. Travel & Logistics
 * 5. Security Requirements
 * 6. Equipment & Facilities
 * 7. Content & Media Rights
 * 8. NIL Compliance (NCAA/Conference)
 * 9. Cancellation & Force Majeure
 * 10. General Terms
 * 11. Signatures
 */

export interface ContractParty {
  name: string;
  role: 'athlete' | 'venue' | 'brand' | 'representative';
  organization?: string;
  email?: string;
  phone?: string;
  address?: string;
  sport?: string;
  school?: string;
  position?: string;
}

export interface ContractEngagement {
  type: string; // appearance, autograph_signing, speaking, camp_clinic, brand_endorsement
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  location: string;
  venue?: string;
  expectedAttendance?: string;
}

export interface ContractCompensation {
  totalFee: number;
  currency: string;
  depositRequired: boolean;
  depositPercent?: number;
  depositAmount?: number;
  depositDueDate?: string;
  balanceDueDate?: string;
  paymentMethod: string;
  bonuses?: string;
  revenueShare?: string;
}

export interface ContractTravel {
  travelProvided: boolean;
  flightClass?: string;
  hotelStars?: string;
  groundTransport?: string;
  meals?: string;
  perDiem?: number;
  travelDays?: number;
  companions?: number;
}

export interface ContractSecurity {
  securityRequired: boolean;
  securityDetail?: string;
  privateEntrance?: boolean;
  crowdControl?: string;
  greenRoom?: boolean;
}

export interface ContractEquipment {
  venueProvides?: string[];
  athleteBrings?: string[];
  avRequirements?: string;
  specialRequirements?: string;
}

export interface ContractMediaRights {
  photographyAllowed: boolean;
  videoAllowed: boolean;
  socialMediaPosting: string; // 'both_parties', 'athlete_only', 'venue_only', 'none'
  likenessUsage: string; // 'event_promotion_only', 'ongoing_marketing', 'limited_time', 'none'
  likenessUsageDuration?: string;
  contentApproval: boolean;
  exclusivityPeriod?: string;
}

export interface ContractNILCompliance {
  ncaaCompliant: boolean;
  schoolApprovalRequired: boolean;
  schoolApprovalObtained?: boolean;
  conferenceRules?: string;
  disclosureRequired: boolean;
  disclosureMethod?: string;
  conflictingBrands?: string[];
  athleteRepresentative?: string;
  representativeContact?: string;
}

export interface ContractCancellation {
  cancellationNotice: string; // e.g., '14 days', '30 days'
  athleteCancellationFee?: string;
  venueCancellationFee?: string;
  forceMajeure: boolean;
  injuryClause: boolean;
  weatherClause?: boolean;
  substituteAllowed?: boolean;
}

export interface NILContractData {
  contractId?: string;
  generatedDate: string;
  parties: {
    athlete: ContractParty;
    booker: ContractParty;
    representative?: ContractParty;
  };
  engagement: ContractEngagement;
  compensation: ContractCompensation;
  travel: ContractTravel;
  security: ContractSecurity;
  equipment: ContractEquipment;
  mediaRights: ContractMediaRights;
  nilCompliance: ContractNILCompliance;
  cancellation: ContractCancellation;
  additionalTerms?: string;
}

/**
 * Build NILContractData from booking + rider template data + profile data
 */
export function buildContractDataFromBooking(params: {
  booking: any;
  riderData: Record<string, any>;
  artistProfile: any;
  venueProfile?: any;
  bookingType?: string;
}): NILContractData {
  const { booking, riderData, artistProfile, venueProfile, bookingType } = params;

  const isAthlete = artistProfile?.talentType === 'athlete';
  const today = new Date().toISOString().split('T')[0];

  // Parse athlete stats if available
  let athleteStats: any = {};
  try {
    athleteStats = typeof artistProfile?.athleteStats === 'string'
      ? JSON.parse(artistProfile.athleteStats)
      : artistProfile?.athleteStats || {};
  } catch { athleteStats = {}; }

  const contractData: NILContractData = {
    contractId: `OLG-${Date.now().toString(36).toUpperCase()}`,
    generatedDate: today,
    parties: {
      athlete: {
        name: artistProfile?.artistName || riderData.artist_name || 'Athlete',
        role: 'athlete',
        sport: artistProfile?.sportCategory || riderData.sport || '',
        school: artistProfile?.sportTeam || '',
        position: artistProfile?.sportPosition || '',
        email: '',
        organization: artistProfile?.sportTeam || '',
      },
      booker: {
        name: venueProfile?.organizationName || riderData.venue_name || 'Booker',
        role: 'venue',
        organization: venueProfile?.organizationName || '',
        email: '',
      },
    },
    engagement: {
      type: bookingType || booking?.bookingType || riderData.booking_type || 'appearance',
      title: riderData.event_name || booking?.eventName || 'Engagement',
      description: riderData.event_description || booking?.message || '',
      date: riderData.event_date || booking?.eventDate || today,
      startTime: riderData.event_time || booking?.startTime || '',
      endTime: riderData.event_end_time || '',
      duration: riderData.set_duration || riderData.duration || '',
      location: riderData.venue_address || booking?.location || '',
      venue: riderData.venue_name || venueProfile?.organizationName || '',
      expectedAttendance: riderData.expected_attendance || '',
    },
    compensation: {
      totalFee: parseFloat(riderData.performance_fee || booking?.totalFee || '0'),
      currency: 'USD',
      depositRequired: riderData.deposit_required !== 'No deposit',
      depositPercent: riderData.deposit_required?.includes('25%') ? 25 :
        riderData.deposit_required?.includes('50%') ? 50 :
        riderData.deposit_required?.includes('100%') ? 100 : 0,
      depositAmount: 0,
      paymentMethod: riderData.payment_method || 'Stripe (via Ologywood)',
      bonuses: riderData.bonuses || '',
      revenueShare: riderData.revenue_share || '',
    },
    travel: {
      travelProvided: riderData.travel_provided === 'Yes' || riderData.travel_provided === true,
      flightClass: riderData.flight_class || riderData.travel_class || '',
      hotelStars: riderData.hotel_rating || riderData.hotel_stars || '',
      groundTransport: riderData.ground_transport || riderData.transportation || '',
      meals: riderData.meals_provided || riderData.catering || '',
      perDiem: parseFloat(riderData.per_diem || '0') || undefined,
      travelDays: parseInt(riderData.travel_days || '0') || undefined,
      companions: parseInt(riderData.companions || riderData.travel_companions || '0') || undefined,
    },
    security: {
      securityRequired: riderData.security_required === 'Yes' || riderData.security_required === true,
      securityDetail: riderData.security_detail || riderData.security_personnel || '',
      privateEntrance: riderData.private_entrance === 'Yes' || riderData.private_entrance === true,
      crowdControl: riderData.crowd_control || '',
      greenRoom: riderData.green_room === 'Yes' || riderData.green_room === true || riderData.private_area === true,
    },
    equipment: {
      venueProvides: riderData.venue_provides ? (Array.isArray(riderData.venue_provides) ? riderData.venue_provides : [riderData.venue_provides]) : [],
      athleteBrings: riderData.athlete_brings ? (Array.isArray(riderData.athlete_brings) ? riderData.athlete_brings : [riderData.athlete_brings]) : [],
      avRequirements: riderData.av_requirements || riderData.sound_system || '',
      specialRequirements: riderData.special_requirements || riderData.additional_requirements || '',
    },
    mediaRights: {
      photographyAllowed: riderData.photography_allowed !== false && riderData.photography_allowed !== 'No',
      videoAllowed: riderData.video_allowed !== false && riderData.video_allowed !== 'No',
      socialMediaPosting: riderData.social_media_posting || 'both_parties',
      likenessUsage: riderData.likeness_usage || 'event_promotion_only',
      likenessUsageDuration: riderData.likeness_duration || '',
      contentApproval: riderData.content_approval === 'Yes' || riderData.content_approval === true,
      exclusivityPeriod: riderData.exclusivity_period || '',
    },
    nilCompliance: {
      ncaaCompliant: isAthlete,
      schoolApprovalRequired: isAthlete,
      schoolApprovalObtained: riderData.school_approval_obtained === true,
      conferenceRules: riderData.conference_rules || '',
      disclosureRequired: isAthlete,
      disclosureMethod: riderData.disclosure_method || 'Platform disclosure via Ologywood',
      conflictingBrands: riderData.conflicting_brands ? (Array.isArray(riderData.conflicting_brands) ? riderData.conflicting_brands : [riderData.conflicting_brands]) : [],
      athleteRepresentative: riderData.representative_name || '',
      representativeContact: riderData.representative_contact || '',
    },
    cancellation: {
      cancellationNotice: riderData.cancellation_notice || '14 days',
      athleteCancellationFee: riderData.athlete_cancellation_fee || 'No fee if 14+ days notice; 50% fee if less than 14 days',
      venueCancellationFee: riderData.venue_cancellation_fee || 'Full deposit forfeited if less than 14 days notice',
      forceMajeure: true,
      injuryClause: isAthlete,
      weatherClause: riderData.weather_clause === true || riderData.outdoor_event === true,
      substituteAllowed: riderData.substitute_allowed === true,
    },
    additionalTerms: riderData.additional_terms || riderData.special_notes || '',
  };

  // Calculate deposit amount
  if (contractData.compensation.depositRequired && contractData.compensation.depositPercent) {
    contractData.compensation.depositAmount =
      contractData.compensation.totalFee * (contractData.compensation.depositPercent / 100);
  }

  return contractData;
}

/**
 * Generate the full NIL contract HTML document
 */
export function generateNILContractHTML(data: NILContractData): string {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'TBD';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateStr; }
  };

  const engagementTypeLabel: Record<string, string> = {
    appearance: 'Personal Appearance',
    autograph_signing: 'Autograph Signing Session',
    speaking: 'Speaking Engagement',
    camp_clinic: 'Sports Camp / Clinic',
    brand_endorsement: 'Brand Endorsement / NIL Deal',
    performance: 'Live Performance',
    concert: 'Concert',
  };

  const html = `
<div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 48px 40px; color: #1a1a2e; line-height: 1.6; background: white;">
  
  <!-- HEADER -->
  <div style="text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #6c5ce7;">
    <div style="font-size: 11px; letter-spacing: 3px; color: #6c5ce7; text-transform: uppercase; margin-bottom: 8px;">Ologywood™ · Official Contract Document</div>
    <h1 style="margin: 0 0 8px 0; color: #1a1a2e; font-size: 28px; font-weight: 700;">
      ${data.parties.athlete.sport ? 'NIL ' : ''}ENGAGEMENT CONTRACT
    </h1>
    <p style="margin: 0; color: #636e72; font-size: 14px;">
      Contract ID: <strong>${data.contractId || 'PENDING'}</strong> · Generated: ${formatDate(data.generatedDate)}
    </p>
  </div>

  <!-- SECTION 1: PARTIES -->
  <div style="margin-bottom: 32px;">
    <h2 style="font-size: 14px; font-weight: 700; color: #6c5ce7; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;">1. Parties to This Agreement</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr>
        <td style="padding: 8px 12px; width: 50%; vertical-align: top; border: 1px solid #eee;">
          <strong style="color: #6c5ce7; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Talent / Athlete</strong><br/>
          <span style="font-size: 16px; font-weight: 600;">${data.parties.athlete.name}</span><br/>
          ${data.parties.athlete.sport ? `<span style="color: #555;">Sport: ${data.parties.athlete.sport}</span><br/>` : ''}
          ${data.parties.athlete.position ? `<span style="color: #555;">Position: ${data.parties.athlete.position}</span><br/>` : ''}
          ${data.parties.athlete.school ? `<span style="color: #555;">School/Team: ${data.parties.athlete.school}</span><br/>` : ''}
        </td>
        <td style="padding: 8px 12px; width: 50%; vertical-align: top; border: 1px solid #eee;">
          <strong style="color: #6c5ce7; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Booker / Organization</strong><br/>
          <span style="font-size: 16px; font-weight: 600;">${data.parties.booker.name}</span><br/>
          ${data.parties.booker.organization ? `<span style="color: #555;">Organization: ${data.parties.booker.organization}</span><br/>` : ''}
        </td>
      </tr>
    </table>
    ${data.nilCompliance.athleteRepresentative ? `
    <p style="margin-top: 12px; font-size: 12px; color: #555;">
      <strong>Athlete Representative:</strong> ${data.nilCompliance.athleteRepresentative}
      ${data.nilCompliance.representativeContact ? ` · Contact: ${data.nilCompliance.representativeContact}` : ''}
    </p>` : ''}
  </div>

  <!-- SECTION 2: ENGAGEMENT DETAILS -->
  <div style="margin-bottom: 32px;">
    <h2 style="font-size: 14px; font-weight: 700; color: #6c5ce7; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;">2. Engagement Details</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555; width: 35%;">Type of Engagement</td>
        <td style="padding: 8px 12px;">${engagementTypeLabel[data.engagement.type] || data.engagement.type}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Event Title</td>
        <td style="padding: 8px 12px;">${data.engagement.title}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Date</td>
        <td style="padding: 8px 12px;">${formatDate(data.engagement.date)}</td>
      </tr>
      ${data.engagement.startTime ? `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Time</td>
        <td style="padding: 8px 12px;">${data.engagement.startTime}${data.engagement.endTime ? ' – ' + data.engagement.endTime : ''}</td>
      </tr>` : ''}
      ${data.engagement.duration ? `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Duration</td>
        <td style="padding: 8px 12px;">${data.engagement.duration}</td>
      </tr>` : ''}
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Location</td>
        <td style="padding: 8px 12px;">${data.engagement.location || 'TBD'}</td>
      </tr>
      ${data.engagement.venue ? `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Venue</td>
        <td style="padding: 8px 12px;">${data.engagement.venue}</td>
      </tr>` : ''}
      ${data.engagement.expectedAttendance ? `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Expected Attendance</td>
        <td style="padding: 8px 12px;">${data.engagement.expectedAttendance}</td>
      </tr>` : ''}
      ${data.engagement.description ? `
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #555; vertical-align: top;">Description</td>
        <td style="padding: 8px 12px; white-space: pre-line;">${data.engagement.description}</td>
      </tr>` : ''}
    </table>
  </div>

  <!-- SECTION 3: COMPENSATION -->
  <div style="margin-bottom: 32px;">
    <h2 style="font-size: 14px; font-weight: 700; color: #6c5ce7; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;">3. Compensation & Payment Terms</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="border-bottom: 1px solid #f0f0f0; background: #f9f9ff;">
        <td style="padding: 10px 12px; font-weight: 700; color: #1a1a2e; width: 35%;">Total Compensation</td>
        <td style="padding: 10px 12px; font-weight: 700; font-size: 16px; color: #6c5ce7;">${formatCurrency(data.compensation.totalFee)}</td>
      </tr>
      ${data.compensation.depositRequired ? `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Deposit Required</td>
        <td style="padding: 8px 12px;">${data.compensation.depositPercent}% — ${formatCurrency(data.compensation.depositAmount || 0)}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Balance Due</td>
        <td style="padding: 8px 12px;">${formatCurrency(data.compensation.totalFee - (data.compensation.depositAmount || 0))} — Due upon completion of engagement</td>
      </tr>` : ''}
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Payment Method</td>
        <td style="padding: 8px 12px;">${data.compensation.paymentMethod}</td>
      </tr>
      ${data.compensation.bonuses ? `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Bonuses / Incentives</td>
        <td style="padding: 8px 12px;">${data.compensation.bonuses}</td>
      </tr>` : ''}
      ${data.compensation.revenueShare ? `
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Revenue Share</td>
        <td style="padding: 8px 12px;">${data.compensation.revenueShare}</td>
      </tr>` : ''}
    </table>
  </div>

  <!-- SECTION 4: TRAVEL & LOGISTICS -->
  <div style="margin-bottom: 32px;">
    <h2 style="font-size: 14px; font-weight: 700; color: #6c5ce7; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;">4. Travel & Logistics</h2>
    ${data.travel.travelProvided ? `
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      ${data.travel.flightClass ? `<tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 12px; font-weight: 600; color: #555; width: 35%;">Flight Class</td><td style="padding: 8px 12px;">${data.travel.flightClass}</td></tr>` : ''}
      ${data.travel.hotelStars ? `<tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 12px; font-weight: 600; color: #555;">Hotel</td><td style="padding: 8px 12px;">${data.travel.hotelStars}</td></tr>` : ''}
      ${data.travel.groundTransport ? `<tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 12px; font-weight: 600; color: #555;">Ground Transport</td><td style="padding: 8px 12px;">${data.travel.groundTransport}</td></tr>` : ''}
      ${data.travel.meals ? `<tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 12px; font-weight: 600; color: #555;">Meals</td><td style="padding: 8px 12px;">${data.travel.meals}</td></tr>` : ''}
      ${data.travel.perDiem ? `<tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 12px; font-weight: 600; color: #555;">Per Diem</td><td style="padding: 8px 12px;">${formatCurrency(data.travel.perDiem)} / day</td></tr>` : ''}
      ${data.travel.travelDays ? `<tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 12px; font-weight: 600; color: #555;">Travel Days</td><td style="padding: 8px 12px;">${data.travel.travelDays} day(s)</td></tr>` : ''}
      ${data.travel.companions ? `<tr><td style="padding: 8px 12px; font-weight: 600; color: #555;">Companions Covered</td><td style="padding: 8px 12px;">${data.travel.companions} person(s)</td></tr>` : ''}
    </table>` : `
    <p style="font-size: 13px; color: #555; font-style: italic;">Travel arrangements are the responsibility of the Talent. No travel provisions are included in this agreement.</p>`}
  </div>

  <!-- SECTION 5: SECURITY -->
  <div style="margin-bottom: 32px;">
    <h2 style="font-size: 14px; font-weight: 700; color: #6c5ce7; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;">5. Security Requirements</h2>
    ${data.security.securityRequired ? `
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      ${data.security.securityDetail ? `<tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 12px; font-weight: 600; color: #555; width: 35%;">Security Detail</td><td style="padding: 8px 12px;">${data.security.securityDetail}</td></tr>` : ''}
      <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 12px; font-weight: 600; color: #555;">Private Entrance/Exit</td><td style="padding: 8px 12px;">${data.security.privateEntrance ? '✓ Required' : 'Not required'}</td></tr>
      ${data.security.crowdControl ? `<tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 12px; font-weight: 600; color: #555;">Crowd Control</td><td style="padding: 8px 12px;">${data.security.crowdControl}</td></tr>` : ''}
      <tr><td style="padding: 8px 12px; font-weight: 600; color: #555;">Green Room / Private Area</td><td style="padding: 8px 12px;">${data.security.greenRoom ? '✓ Required' : 'Not required'}</td></tr>
    </table>` : `
    <p style="font-size: 13px; color: #555; font-style: italic;">No special security requirements specified for this engagement.</p>`}
  </div>

  <!-- SECTION 6: EQUIPMENT & FACILITIES -->
  <div style="margin-bottom: 32px;">
    <h2 style="font-size: 14px; font-weight: 700; color: #6c5ce7; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;">6. Equipment & Facilities</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      ${data.equipment.venueProvides && data.equipment.venueProvides.length > 0 ? `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555; width: 35%; vertical-align: top;">Venue Provides</td>
        <td style="padding: 8px 12px;">${data.equipment.venueProvides.join(', ')}</td>
      </tr>` : ''}
      ${data.equipment.athleteBrings && data.equipment.athleteBrings.length > 0 ? `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555; vertical-align: top;">Talent Provides</td>
        <td style="padding: 8px 12px;">${data.equipment.athleteBrings.join(', ')}</td>
      </tr>` : ''}
      ${data.equipment.avRequirements ? `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">A/V Requirements</td>
        <td style="padding: 8px 12px;">${data.equipment.avRequirements}</td>
      </tr>` : ''}
      ${data.equipment.specialRequirements ? `
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #555; vertical-align: top;">Special Requirements</td>
        <td style="padding: 8px 12px; white-space: pre-line;">${data.equipment.specialRequirements}</td>
      </tr>` : ''}
    </table>
  </div>

  <!-- SECTION 7: CONTENT & MEDIA RIGHTS -->
  <div style="margin-bottom: 32px;">
    <h2 style="font-size: 14px; font-weight: 700; color: #6c5ce7; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;">7. Content & Media Rights</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555; width: 35%;">Photography</td>
        <td style="padding: 8px 12px;">${data.mediaRights.photographyAllowed ? '✓ Allowed' : '✗ Not Allowed'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Video Recording</td>
        <td style="padding: 8px 12px;">${data.mediaRights.videoAllowed ? '✓ Allowed' : '✗ Not Allowed'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Social Media Posting</td>
        <td style="padding: 8px 12px;">${data.mediaRights.socialMediaPosting === 'both_parties' ? 'Both parties may post' : data.mediaRights.socialMediaPosting === 'athlete_only' ? 'Talent only' : data.mediaRights.socialMediaPosting === 'venue_only' ? 'Booker only' : 'No social media posting'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Likeness Usage</td>
        <td style="padding: 8px 12px;">${data.mediaRights.likenessUsage === 'event_promotion_only' ? 'Event promotion only' : data.mediaRights.likenessUsage === 'ongoing_marketing' ? 'Ongoing marketing (with approval)' : data.mediaRights.likenessUsage === 'limited_time' ? 'Limited time: ' + (data.mediaRights.likenessUsageDuration || 'TBD') : 'No likeness usage permitted'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Content Approval Required</td>
        <td style="padding: 8px 12px;">${data.mediaRights.contentApproval ? '✓ Yes — Talent must approve before publication' : 'No — Booker may publish without prior approval'}</td>
      </tr>
      ${data.mediaRights.exclusivityPeriod ? `
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Exclusivity Period</td>
        <td style="padding: 8px 12px;">${data.mediaRights.exclusivityPeriod}</td>
      </tr>` : ''}
    </table>
  </div>

  <!-- SECTION 8: NIL COMPLIANCE -->
  ${data.nilCompliance.ncaaCompliant ? `
  <div style="margin-bottom: 32px;">
    <h2 style="font-size: 14px; font-weight: 700; color: #6c5ce7; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;">8. NIL Compliance & NCAA Regulations</h2>
    <div style="background: #f9f9ff; border: 1px solid #e8e4ff; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
      <p style="font-size: 12px; color: #555; margin: 0 0 12px 0;">
        <strong>IMPORTANT:</strong> This agreement is subject to all applicable NCAA, conference, and institutional rules regarding Name, Image, and Likeness (NIL) activities. Both parties acknowledge and agree to the following:
      </p>
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555; width: 35%;">NCAA Compliant</td>
        <td style="padding: 8px 12px;">✓ This agreement complies with current NCAA NIL policies</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">School Approval</td>
        <td style="padding: 8px 12px;">${data.nilCompliance.schoolApprovalRequired ? (data.nilCompliance.schoolApprovalObtained ? '✓ Required and obtained' : '⏳ Required — pending approval') : 'Not required'}</td>
      </tr>
      ${data.nilCompliance.conferenceRules ? `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Conference Rules</td>
        <td style="padding: 8px 12px;">${data.nilCompliance.conferenceRules}</td>
      </tr>` : ''}
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Disclosure Required</td>
        <td style="padding: 8px 12px;">${data.nilCompliance.disclosureRequired ? '✓ Yes' : 'No'}</td>
      </tr>
      ${data.nilCompliance.disclosureMethod ? `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Disclosure Method</td>
        <td style="padding: 8px 12px;">${data.nilCompliance.disclosureMethod}</td>
      </tr>` : ''}
      ${data.nilCompliance.conflictingBrands && data.nilCompliance.conflictingBrands.length > 0 ? `
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Conflicting Brands</td>
        <td style="padding: 8px 12px;">${data.nilCompliance.conflictingBrands.join(', ')}</td>
      </tr>` : ''}
    </table>
    <p style="font-size: 11px; color: #888; margin-top: 12px; font-style: italic;">
      The Talent represents that they have disclosed this agreement to their institution's compliance office as required. The Booker agrees not to condition this agreement on athletic performance or enrollment decisions.
    </p>
  </div>` : ''}

  <!-- SECTION 9: CANCELLATION & FORCE MAJEURE -->
  <div style="margin-bottom: 32px;">
    <h2 style="font-size: 14px; font-weight: 700; color: #6c5ce7; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;">${data.nilCompliance.ncaaCompliant ? '9' : '8'}. Cancellation & Force Majeure</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555; width: 35%;">Cancellation Notice</td>
        <td style="padding: 8px 12px;">${data.cancellation.cancellationNotice} advance notice required</td>
      </tr>
      ${data.cancellation.athleteCancellationFee ? `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Talent Cancellation</td>
        <td style="padding: 8px 12px;">${data.cancellation.athleteCancellationFee}</td>
      </tr>` : ''}
      ${data.cancellation.venueCancellationFee ? `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Booker Cancellation</td>
        <td style="padding: 8px 12px;">${data.cancellation.venueCancellationFee}</td>
      </tr>` : ''}
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Force Majeure</td>
        <td style="padding: 8px 12px;">${data.cancellation.forceMajeure ? '✓ Included — Neither party liable for acts of God, government action, pandemic, or natural disaster' : 'Not included'}</td>
      </tr>
      ${data.cancellation.injuryClause ? `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Injury Clause</td>
        <td style="padding: 8px 12px;">✓ Talent may cancel without penalty in the event of injury preventing participation. Medical documentation may be required.</td>
      </tr>` : ''}
      ${data.cancellation.weatherClause ? `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Weather Clause</td>
        <td style="padding: 8px 12px;">✓ Outdoor events may be rescheduled due to inclement weather without penalty</td>
      </tr>` : ''}
      ${data.cancellation.substituteAllowed !== undefined ? `
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #555;">Substitute Allowed</td>
        <td style="padding: 8px 12px;">${data.cancellation.substituteAllowed ? '✓ Talent may send an approved substitute' : '✗ No substitutes — Talent must appear personally'}</td>
      </tr>` : ''}
    </table>
  </div>

  <!-- SECTION 10: ADDITIONAL TERMS -->
  ${data.additionalTerms ? `
  <div style="margin-bottom: 32px;">
    <h2 style="font-size: 14px; font-weight: 700; color: #6c5ce7; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;">${data.nilCompliance.ncaaCompliant ? '10' : '9'}. Additional Terms</h2>
    <p style="font-size: 13px; color: #333; white-space: pre-line;">${data.additionalTerms}</p>
  </div>` : ''}

  <!-- SECTION 11: GENERAL TERMS -->
  <div style="margin-bottom: 32px;">
    <h2 style="font-size: 14px; font-weight: 700; color: #6c5ce7; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;">${data.nilCompliance.ncaaCompliant ? (data.additionalTerms ? '11' : '10') : (data.additionalTerms ? '10' : '9')}. General Terms & Conditions</h2>
    <div style="font-size: 11px; color: #555; line-height: 1.7;">
      <p><strong>a) Entire Agreement:</strong> This document, together with any attached rider, constitutes the entire agreement between the parties and supersedes all prior negotiations and agreements.</p>
      <p><strong>b) Governing Law:</strong> This agreement shall be governed by the laws of the state in which the engagement takes place.</p>
      <p><strong>c) Amendments:</strong> Any modifications to this agreement must be made in writing and signed by both parties.</p>
      <p><strong>d) Severability:</strong> If any provision of this agreement is found to be unenforceable, the remaining provisions shall continue in full force and effect.</p>
      <p><strong>e) Confidentiality:</strong> Both parties agree to keep the financial terms of this agreement confidential unless disclosure is required by law or institutional policy.</p>
      <p><strong>f) Dispute Resolution:</strong> Any disputes arising from this agreement shall first be addressed through the Ologywood platform's dispute resolution process before pursuing legal remedies.</p>
      <p><strong>g) Digital Signatures:</strong> Both parties agree that electronic signatures executed through the Ologywood platform carry the same legal weight as handwritten signatures under the ESIGN Act and UETA.</p>
    </div>
  </div>

  <!-- SECTION 12: SIGNATURES -->
  <div style="margin-top: 48px; padding-top: 24px; border-top: 3px solid #6c5ce7;">
    <h2 style="font-size: 14px; font-weight: 700; color: #6c5ce7; text-transform: uppercase; letter-spacing: 1px; margin: 0 0: 24px 0;">Signatures</h2>
    <p style="font-size: 11px; color: #888; margin-bottom: 24px;">By signing below, both parties agree to all terms and conditions outlined in this contract.</p>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 16px; width: 50%; vertical-align: top;">
          <p style="font-weight: 700; color: #6c5ce7; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 32px;">Talent / Athlete</p>
          <div style="border-bottom: 2px solid #333; margin-bottom: 8px; min-height: 40px;"></div>
          <p style="font-size: 12px; color: #555; margin: 4px 0;">Name: ${data.parties.athlete.name}</p>
          <p style="font-size: 11px; color: #999;">Date: _______________</p>
        </td>
        <td style="padding: 16px; width: 50%; vertical-align: top;">
          <p style="font-weight: 700; color: #6c5ce7; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 32px;">Booker / Organization</p>
          <div style="border-bottom: 2px solid #333; margin-bottom: 8px; min-height: 40px;"></div>
          <p style="font-size: 12px; color: #555; margin: 4px 0;">Name: ${data.parties.booker.name}</p>
          <p style="font-size: 11px; color: #999;">Date: _______________</p>
        </td>
      </tr>
    </table>
  </div>

  <!-- FOOTER -->
  <div style="margin-top: 40px; text-align: center; padding-top: 16px; border-top: 1px solid #eee;">
    <p style="font-size: 10px; color: #bbb; margin: 4px 0;">Generated by Ologywood™ · NIL & Talent Booking Platform</p>
    <p style="font-size: 10px; color: #bbb; margin: 4px 0;">Contract ID: ${data.contractId} · This document is legally binding when signed by both parties.</p>
    <p style="font-size: 10px; color: #bbb; margin: 4px 0;">www.ologywood.com</p>
  </div>
</div>`;

  return html;
}
