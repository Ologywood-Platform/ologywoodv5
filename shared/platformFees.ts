export const FAN_CLUB_PLATFORM_FEE_PERCENT = 10;
export const FAN_CLUB_TALENT_SHARE_PERCENT = 100 - FAN_CLUB_PLATFORM_FEE_PERCENT;

export function calculateFanClubRevenueShare(grossCents: number) {
  const normalizedGrossCents = Math.max(0, Math.round(grossCents));
  const platformFeeCents = Math.round(
    normalizedGrossCents * FAN_CLUB_PLATFORM_FEE_PERCENT / 100,
  );

  return {
    grossCents: normalizedGrossCents,
    platformFeeCents,
    talentShareCents: normalizedGrossCents - platformFeeCents,
  };
}
