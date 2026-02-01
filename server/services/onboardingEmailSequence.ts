export const onboardingEmailSequence = {
  async sendWelcomeEmail(userEmail: string, userName: string, userType: 'artist' | 'venue') {
    console.log(`[Onboarding] Welcome email sent to ${userEmail}`);
  },
  async sendFeatureIntroEmail(userEmail: string, userName: string, userType: 'artist' | 'venue') {
    console.log(`[Onboarding] Feature intro email sent to ${userEmail}`);
  },
  async sendTipsEmail(userEmail: string, userName: string, userType: 'artist' | 'venue') {
    console.log(`[Onboarding] Tips email sent to ${userEmail}`);
  },
  async sendUpgradeOfferEmail(userEmail: string, userName: string, userType: 'artist' | 'venue') {
    console.log(`[Onboarding] Upgrade offer email sent to ${userEmail}`);
  },
  async sendReferralEmail(userEmail: string, userName: string) {
    console.log(`[Onboarding] Referral email sent to ${userEmail}`);
  },
};
