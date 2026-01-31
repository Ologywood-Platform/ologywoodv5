// Referral Program Service
// Manages referral tracking, credit distribution, and incentive rewards

export interface ReferralReward {
  referrerId: string;
  refereeId: string;
  creditAmount: number;
  status: 'pending' | 'completed' | 'expired';
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

export const referralProgramService = {
  // Generate unique referral code for user
  generateReferralCode(userId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId.substring(0, 4)}-${timestamp}-${random}`.toUpperCase();
  },

  // Track referral when new user signs up with code
  async trackReferral(referralCode: string, newUserId: string) {
    // TODO: Save referral tracking to database
    // This would record:
    // - referralCode (who referred)
    // - newUserId (who was referred)
    // - timestamp
    // - status (pending until profile complete)
    
    console.log(`[Referral] New user ${newUserId} signed up with code ${referralCode}`);
  },

  // Award credits when referral is completed
  async completeReferral(referralCode: string, newUserId: string, referrerCredit: number = 10, refereeCredit: number = 10) {
    // TODO: Update referral status to 'completed'
    // TODO: Add credits to referrer's account
    // TODO: Add credits to referee's account
    // TODO: Send notification emails to both parties
    
    console.log(`[Referral] Referral completed: ${referrerCredit} credits to referrer, ${refereeCredit} credits to referee`);
  },

  // Get user's referral stats
  async getUserReferralStats(userId: string) {
    return {
      referralCode: this.generateReferralCode(userId),
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalCreditsEarned: 0,
      referralLink: `https://ologywood.com/signup?ref=${this.generateReferralCode(userId)}`,
    };
  },

  // Get referral leaderboard
  async getReferralLeaderboard(limit: number = 10) {
    return [
      {
        rank: 1,
        userId: 'user-123',
        userName: 'Sarah Martinez',
        totalReferrals: 15,
        totalCreditsEarned: 150,
      },
      {
        rank: 2,
        userId: 'user-456',
        userName: 'James Chen',
        totalReferrals: 12,
        totalCreditsEarned: 120,
      },
      {
        rank: 3,
        userId: 'user-789',
        userName: 'Michael Thompson',
        totalReferrals: 8,
        totalCreditsEarned: 80,
      },
    ];
  },

  // Apply referral credits to subscription
  async applyReferralCredits(userId: string, subscriptionId: string, creditAmount: number) {
    // TODO: Calculate discount from credits
    // TODO: Apply discount to subscription
    // TODO: Mark credits as used
    
    const discountAmount = creditAmount; // 1 credit = $1 discount
    console.log(`[Referral] Applied ${discountAmount} credits to subscription ${subscriptionId}`);
    
    return {
      originalPrice: 29,
      creditsApplied: creditAmount,
      finalPrice: Math.max(0, 29 - creditAmount),
    };
  },

  // Send referral share email
  async sendReferralShareEmail(userEmail: string, userName: string, referralCode: string) {
    const referralLink = `https://ologywood.com/signup?ref=${referralCode}`;
    
    const emailContent = `
      <h2>Share Ologywood and Earn Rewards!</h2>
      <p>Hi ${userName},</p>
      <p>Help your friends discover Ologywood and earn $10 in credits for each successful referral.</p>
      
      <h3>Your Referral Link</h3>
      <p><a href="${referralLink}">${referralLink}</a></p>
      
      <h3>How It Works</h3>
      <ol>
        <li>Share your referral link with friends</li>
        <li>When they sign up and complete their profile, you both get $10 credits</li>
        <li>Use credits toward your Professional subscription</li>
      </ol>
      
      <h3>Share on Social Media</h3>
      <ul>
        <li><a href="https://twitter.com/intent/tweet?text=Check%20out%20Ologywood%20-%20the%20easiest%20way%20to%20book%20artists!%20${encodeURIComponent(referralLink)}">Share on Twitter</a></li>
        <li><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}">Share on Facebook</a></li>
        <li><a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}">Share on LinkedIn</a></li>
      </ul>
      
      <p>Best regards,<br>The Ologywood Team</p>
    `;
    
    // TODO: Send email via emailService
    console.log(`[Referral] Share email sent to ${userEmail}`);
  },

  // Check if referral code is valid
  async validateReferralCode(referralCode: string): Promise<boolean> {
    // TODO: Check if code exists and is not expired
    return true;
  },

  // Get referral history for user
  async getReferralHistory(userId: string) {
    return {
      referralsGiven: [
        {
          refereeId: 'user-999',
          refereeName: 'John Doe',
          status: 'completed',
          creditsEarned: 10,
          completedAt: new Date('2026-01-25'),
        },
      ],
      referralsReceived: [
        {
          referrerId: 'user-111',
          referrerName: 'Jane Smith',
          status: 'completed',
          creditsReceived: 10,
          completedAt: new Date('2026-01-20'),
        },
      ],
    };
  },
};
