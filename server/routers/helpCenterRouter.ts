import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';

/**
 * Help Center Router
 * Provides endpoints for help articles and support documentation
 */

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  keywords: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  views: number;
  helpful: number;
  unhelpful: number;
  createdAt: Date;
  updatedAt: Date;
}

interface HelpCategory {
  id: string;
  name: string;
  description: string;
  articleCount: number;
}

// Comprehensive help articles with all required fields
const HELP_ARTICLES: HelpArticle[] = [
  {
    id: '1',
    title: 'Getting Started with Bookings',
    category: 'bookings',
    summary: 'Learn how to create and manage your first booking on Ologywood.',
    content: `Getting started with bookings is easy:

1. **Browse Artists**: Search for artists by genre, location, or price
2. **View Profiles**: Check their experience, reviews, and rates
3. **Create Booking Request**: Click "Request Booking" on their profile
4. **Fill Details**: Enter event date, time, location, and budget
5. **Submit**: The artist will review and respond within 24-48 hours
6. **Confirm**: Once accepted, you'll both receive a contract to sign
7. **Pay Deposit**: Submit 50% deposit to secure the booking
8. **Finalize**: Pay remaining balance before the event

Tips:
- Plan bookings at least 2-3 weeks in advance
- Review artist riders and confirm you can meet requirements
- Communicate clearly about event details
- Confirm all technical requirements are available`,
    keywords: ['booking', 'artist', 'request', 'event', 'getting started'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    views: 234,
    helpful: 156,
    unhelpful: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Understanding Contracts',
    category: 'contracts',
    summary: 'A comprehensive guide to contract management and what to expect.',
    content: `Understanding contracts on Ologywood:

**What's in a Contract:**
- Event details (date, time, location)
- Artist and venue information
- Performance duration
- Payment terms and amounts
- Cancellation policy
- Rider requirements
- Technical specifications
- Insurance requirements

**Contract Process:**
1. Booking is confirmed by both parties
2. Ologywood generates contract automatically
3. Both parties review all terms
4. Both parties sign electronically
5. Booking is now locked in

**Signing:**
- Click "Sign Contract" in booking details
- Review all terms carefully
- Sign electronically with your name
- Confirm signature
- Contract is binding

**After Signing:**
- You'll receive a PDF copy
- Contract stored in booking history
- Both parties can reference anytime
- Keep a copy for your records

**Important:**
- Read all terms before signing
- Ask questions if anything is unclear
- Don't sign if you can't meet requirements
- Contact support if you have concerns`,
    keywords: ['contract', 'signing', 'agreement', 'terms', 'legal'],
    difficulty: 'intermediate',
    estimatedReadTime: 7,
    views: 412,
    helpful: 289,
    unhelpful: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: 'Payment Processing',
    category: 'payments',
    summary: 'How to process and manage payments for bookings.',
    content: `Understanding payments on Ologywood:

**Payment Timeline:**
1. Booking confirmed → Deposit due (50%)
2. Contract signed → Balance due before event
3. Event completed → Funds processed
4. 2-3 business days → Money in your account

**Payment Methods:**
- Credit/Debit Card
- Bank Transfer
- PayPal (where available)

**Fees:**
- Ologywood charges 5% platform fee
- Payment processing fees vary by method
- No hidden fees

**Invoices:**
- Automatic invoice generated
- Sent to both parties
- Includes all booking details
- Payment terms clearly stated

**Refund Policy:**
- 30+ days before event: Full refund
- 15-30 days before: 50% refund
- Less than 15 days: No refund
- Disputes handled by Ologywood

**Security:**
- All payments encrypted
- PCI-DSS compliant
- Secure payment gateway
- Your financial data protected`,
    keywords: ['payment', 'refund', 'invoice', 'deposit', 'processing'],
    difficulty: 'beginner',
    estimatedReadTime: 6,
    views: 367,
    helpful: 267,
    unhelpful: 19,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    title: 'Artist Profile Setup',
    category: 'getting-started',
    summary: 'Complete guide to setting up your artist profile.',
    content: `Setting up your artist profile:

**Profile Basics:**
1. Artist name and stage name
2. Bio (100-500 characters recommended)
3. Genres you perform
4. Location and service area
5. Years of experience
6. Professional photo

**Rates:**
- Minimum performance fee
- Maximum performance fee
- Venues see your range
- Negotiate specific prices per booking

**Portfolio:**
- Add photos of performances
- Upload videos if available
- Link to social media
- Add Spotify/streaming links

**Availability:**
- Mark dates you're available
- Update calendar regularly
- Mark booked dates
- Set unavailable periods

**Verification:**
- Complete identity verification
- Get verification badge
- Increases booking requests
- Builds trust with venues

**Tips:**
- Use professional photos
- Write compelling bio
- Keep rates competitive
- Respond quickly to inquiries
- Update regularly`,
    keywords: ['profile', 'artist', 'setup', 'verification', 'rates'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    views: 523,
    helpful: 412,
    unhelpful: 31,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    title: 'Venue Profile Setup',
    category: 'getting-started',
    summary: 'Complete guide to setting up your venue profile.',
    content: `Setting up your venue profile:

**Venue Information:**
1. Venue name
2. Venue type (club, bar, restaurant, etc.)
3. Capacity
4. Location and address
5. Contact information
6. Venue description

**Details:**
- Operating hours
- Parking information
- Accessibility features
- Sound system capabilities
- Stage size and setup

**Photos:**
- Venue exterior
- Interior/main room
- Stage area
- Amenities

**Booking Preferences:**
- Genres you book
- Typical budget range
- Booking lead time
- Event frequency

**Verification:**
- Verify business information
- Get verification badge
- Increases artist interest
- Builds credibility

**Tips:**
- Complete all information
- Use high-quality photos
- Be clear about requirements
- Respond to artist inquiries
- Leave reviews after events`,
    keywords: ['venue', 'profile', 'setup', 'booking', 'business'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    views: 298,
    helpful: 201,
    unhelpful: 18,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '6',
    title: 'Managing Rider Requirements',
    category: 'contracts',
    summary: 'Learn about riders and how to manage technical requirements.',
    content: `Understanding and managing riders:

**What is a Rider?**
A rider is a document outlining an artist's requirements for a performance.

**Common Rider Sections:**

**Technical:**
- Sound system specs
- Lighting equipment
- Stage setup
- Power requirements
- WiFi/internet

**Hospitality:**
- Green room setup
- Catering needs
- Parking
- Dressing room
- Guest accommodations

**Personnel:**
- Sound engineer
- Stage manager
- Security
- Lighting tech

**Logistics:**
- Load-in time
- Setup time
- Breakdown time
- Travel arrangements

**Creating Riders (Artists):**
1. Go to Dashboard > Riders
2. Click "Create Template"
3. Add sections
4. Add requirements
5. Mark as required or optional
6. Save

**Reviewing Riders (Venues):**
1. View artist's rider
2. Review all requirements
3. Confirm you can meet them
4. Acknowledge in booking
5. Prepare before event

**Tips:**
- Be specific about needs
- Prioritize essentials
- Communicate early
- Confirm all details
- Update riders as needed`,
    keywords: ['rider', 'requirements', 'technical', 'hospitality', 'contract'],
    difficulty: 'intermediate',
    estimatedReadTime: 8,
    views: 445,
    helpful: 312,
    unhelpful: 28,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '7',
    title: 'Frequently Asked Questions',
    category: 'support',
    summary: 'Answers to the most common questions about Ologywood.',
    content: `Common questions answered:

**Q: How much does Ologywood cost?**
A: Ologywood charges 5% platform fee on bookings. No monthly subscription.

**Q: How long until I get paid?**
A: Payments process immediately, appear in account in 2-3 business days.

**Q: Can I negotiate prices?**
A: Yes! Discuss custom pricing before confirming booking.

**Q: What if a venue cancels?**
A: Refunds per cancellation policy. Disputes handled by support team.

**Q: How do I report a problem?**
A: Use "Report Issue" in booking or contact support.

**Q: Can I change booking details after confirming?**
A: No, but contact other party to negotiate changes.

**Q: How do I get verified?**
A: Complete identity verification in account settings.

**Q: What payment methods accepted?**
A: Credit/Debit cards, bank transfers, PayPal (where available).

**Q: Can I delete my account?**
A: Yes, if no active bookings. Go to Settings > Account > Delete.

**Q: How do I contact support?**
A: Use Help Center or create support ticket for assistance.`,
    keywords: ['faq', 'questions', 'answers', 'help', 'support'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    views: 678,
    helpful: 521,
    unhelpful: 42,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '8',
    title: 'Troubleshooting Common Issues',
    category: 'support',
    summary: 'Solutions to common problems and technical issues.',
    content: `Troubleshooting guide:

**Can't Log In**
- Check email and password
- Try password reset
- Clear browser cache
- Try different browser
- Contact support if persists

**Profile Not Showing**
- Ensure profile complete
- Verify email address
- Wait 24 hours for indexing
- Contact support if still hidden

**Not Receiving Bookings**
- Check availability is current
- Review notification settings
- Update profile with better photos
- Consider lowering rates
- Add more genres

**Payment Not Processing**
- Verify payment method valid
- Check card not expired
- Ensure sufficient funds
- Try different payment method
- Contact support for help

**Contract Won't Sign**
- Refresh page
- Try different browser
- Clear browser cache
- Enable JavaScript
- Contact support if continues

**Want to Cancel Booking**
- Go to booking details
- Click "Request Cancellation"
- Follow cancellation process
- Refund per policy

**Still Having Issues?**
- Check Help Center articles
- Create support ticket
- Contact support team
- Describe problem clearly
- Include booking/account details`,
    keywords: ['troubleshooting', 'problems', 'issues', 'help', 'support'],
    difficulty: 'intermediate',
    estimatedReadTime: 6,
    views: 445,
    helpful: 312,
    unhelpful: 28,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '9',
    title: 'Safety and Security',
    category: 'support',
    summary: 'Learn how to stay safe and secure on Ologywood.',
    content: `Staying safe on Ologywood:

**Protecting Your Account:**
- Use strong, unique password
- Enable two-factor authentication
- Don't share password
- Log out on shared computers
- Update password regularly

**Safe Transactions:**
- Only communicate through Ologywood
- Don't share personal financial info
- Verify payment before performing
- Keep copies of contracts
- Report suspicious activity

**Meeting Safety:**
- Meet in public places when possible
- Tell someone where you're going
- Verify event details match contract
- Arrive early to check setup
- Trust your instincts

**Reporting Issues:**
- Report suspicious users
- Report contract violations
- Report payment fraud
- Report safety concerns
- Contact support immediately

**What We Do:**
- Verify all users
- Monitor for fraud
- Secure all payments
- Protect your data
- Investigate complaints
- Support dispute resolution

**Red Flags:**
- Requests for payment outside platform
- Pressure to meet privately
- Unusual payment requests
- Threats or harassment
- Unclear event details`,
    keywords: ['safety', 'security', 'protection', 'fraud', 'verification'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    views: 356,
    helpful: 267,
    unhelpful: 19,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '10',
    title: 'Pricing Your Services',
    category: 'payments',
    summary: 'Learn how to set competitive pricing for your performances.',
    content: `Setting the right price:

**Factors to Consider:**
- Your experience and reputation
- Event type (wedding, corporate, festival)
- Event duration
- Travel distance and time
- Equipment and personnel needed
- Market rates in your area
- Demand for your services

**Pricing Models:**
- Fixed rate: Flat fee for performance
- Hourly rate: Charge per hour
- Tiered pricing: Different rates by event type
- Deposit + balance: Deposit upfront, balance on event day

**Setting Rates on Ologywood:**
1. Go to Profile > Edit Profile
2. Set minimum and maximum fees
3. Venues see your rate range
4. Negotiate specific prices per booking

**Tips:**
- Research market rates
- Don't undervalue your work
- Consider all costs
- Be competitive but fair
- Adjust rates as needed
- Consider experience level

**Payment Process:**
- Deposit when booking confirmed
- Final payment before event
- Payments through Stripe
- Funds in account 2-3 business days`,
    keywords: ['pricing', 'rates', 'fees', 'payment', 'artist'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    views: 445,
    helpful: 312,
    unhelpful: 28,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '11',
    title: 'Updating Your Profile',
    category: 'account',
    summary: 'Keep your profile current to attract more bookings.',
    content: `Keeping your profile up to date:

**What to Update:**
- Profile photo: Use professional, recent photo
- Bio: Compelling description of experience
- Genres: List all genres you perform
- Location: Accurate for venue discovery
- Rates: Update minimum and maximum fees
- Social links: Instagram, Facebook, YouTube, Spotify
- Portfolio: Photos and videos of performances

**Profile Tips:**
- Use high-quality images
- Write in first person
- Highlight unique qualities
- Include credentials
- Keep information current
- Update availability regularly

**Privacy Settings:**
- Control visible information
- Choose who can contact you
- Manage notifications
- Set communication preferences

**Verification:**
- Complete identity verification
- Get verification badge
- Build trust with venues
- Increase booking requests

**Photos:**
- Professional headshot
- Performance photos
- Venue setup photos
- Equipment photos

**Bio Tips:**
- Start with your name
- Mention experience
- List achievements
- Describe your style
- Include availability`,
    keywords: ['profile', 'update', 'photo', 'bio', 'verification'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    views: 512,
    helpful: 378,
    unhelpful: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '12',
    title: 'Managing Your Availability',
    category: 'account',
    summary: 'Keep your availability calendar accurate to prevent double-bookings.',
    content: `Managing your availability:

**Why Availability Matters:**
- Venues see when you're available
- Prevents double-booking
- Helps venues plan ahead
- Improves booking rate

**Updating Availability:**
1. Go to Dashboard > Availability
2. Click dates to mark
3. Choose status:
   - Available: Can perform
   - Booked: Already have booking
   - Unavailable: Cannot perform
4. Add notes if needed
5. Save changes

**Bulk Updates:**
- Mark multiple dates at once
- Set recurring availability (weekends)
- Copy from previous months

**Tips:**
- Update at least monthly
- Mark dates when you book
- Be realistic about availability
- Update when plans change
- Consider travel time

**Calendar Features:**
- View full month
- Color-coded status
- Notes on each date
- Quick bulk actions
- Mobile-friendly

**Best Practices:**
- Keep calendar current
- Update immediately after booking
- Plan ahead for conflicts
- Block travel days
- Update regularly`,
    keywords: ['availability', 'calendar', 'booking', 'schedule', 'dates'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    views: 267,
    helpful: 189,
    unhelpful: 11,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '13',
    title: 'Contract Signing and Verification',
    category: 'contracts',
    summary: 'Learn how to sign contracts and verify signatures.',
    content: `Contract signing process:

**Before Signing:**
- Read all terms carefully
- Understand payment terms
- Confirm all details
- Ask questions if unclear
- Don't sign if unsure

**Signing Steps:**
1. Go to booking details
2. Click "Sign Contract"
3. Review all terms
4. Enter your name
5. Click "Sign"
6. Confirm signature
7. Contract is binding

**What Happens After:**
- PDF copy sent to both parties
- Contract stored in booking history
- Both parties can reference anytime
- Keep copy for your records
- Contract is legally binding

**Digital Signatures:**
- Legally binding
- Secure and encrypted
- Timestamp recorded
- Audit trail maintained
- Compliant with regulations

**If You Need Changes:**
- Contact other party before signing
- Negotiate changes
- Don't sign if terms wrong
- Contact support if disputes

**Signature Verification:**
- Verify other party signed
- Check timestamp
- Confirm all terms match
- Keep records safe
- Reference if needed`,
    keywords: ['contract', 'signing', 'signature', 'verification', 'legal'],
    difficulty: 'intermediate',
    estimatedReadTime: 6,
    views: 389,
    helpful: 278,
    unhelpful: 21,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '14',
    title: 'Booking Cancellation and Refunds',
    category: 'bookings',
    summary: 'Understand cancellation policies and refund processes.',
    content: `Cancellation and refunds:

**Cancellation Policy:**
- 30+ days before event: Full refund
- 15-30 days before: 50% refund
- Less than 15 days: No refund
- Applies to both parties

**How to Cancel:**
1. Go to booking details
2. Click "Request Cancellation"
3. Select reason
4. Confirm cancellation
5. Process begins

**Refund Timeline:**
- Cancellation processed immediately
- Refund initiated to original payment method
- Appears in account 2-3 business days
- Ologywood fee not refunded

**Disputes:**
- Contact other party first
- Try to resolve together
- If unresolved, contact support
- Provide documentation
- Support team investigates
- Final decision within 5 business days

**Exceptions:**
- Force majeure events
- Safety concerns
- Venue/artist emergency
- Contact support for review
- May qualify for exception

**Prevention:**
- Plan ahead
- Confirm details early
- Communicate clearly
- Update availability
- Confirm before event

**Tips:**
- Review policy before booking
- Understand your obligations
- Communicate early if issues
- Keep all documentation
- Contact support with questions`,
    keywords: ['cancellation', 'refund', 'policy', 'booking', 'dispute'],
    difficulty: 'intermediate',
    estimatedReadTime: 7,
    views: 334,
    helpful: 245,
    unhelpful: 16,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const HELP_CATEGORIES: HelpCategory[] = [
  { id: '1', name: 'getting-started', description: 'New to Ologywood? Start here', articleCount: 2 },
  { id: '2', name: 'bookings', description: 'Creating and managing bookings', articleCount: 2 },
  { id: '3', name: 'contracts', description: 'Riders, contracts, and requirements', articleCount: 3 },
  { id: '4', name: 'payments', description: 'Pricing, payments, and invoices', articleCount: 2 },
  { id: '5', name: 'account', description: 'Profile and account management', articleCount: 2 },
  { id: '6', name: 'support', description: 'FAQs and troubleshooting', articleCount: 2 },
];

export const helpCenterRouter = router({
  /**
   * Get all help articles with optional filtering
   */
  getArticles: publicProcedure
    .input(
      z.object({
        category: z.string().optional().describe('Filter by category'),
        search: z.string().optional().describe('Search articles by title or content'),
        limit: z.number().min(1).max(100).default(20).describe('Max results'),
        offset: z.number().min(0).default(0).describe('Pagination offset'),
      }).passthrough()
    )
    .query(async ({ input }) => {
      let filtered = [...HELP_ARTICLES];

      // Filter by category if provided
      if (input.category) {
        filtered = filtered.filter(a => a.category === input.category);
      }

      // Search if provided
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filtered = filtered.filter(
          a =>
            a.title.toLowerCase().includes(searchLower) ||
            a.summary.toLowerCase().includes(searchLower) ||
            a.content.toLowerCase().includes(searchLower) ||
            a.keywords.some(k => k.toLowerCase().includes(searchLower))
        );
      }

      // Apply pagination
      const paginated = filtered.slice(input.offset, input.offset + input.limit);

      return {
        articles: paginated,
        total: filtered.length,
        hasMore: input.offset + input.limit < filtered.length,
      };
    }),

  /**
   * Get a specific article by ID
   */
  getArticleById: publicProcedure
    .input(z.string().describe('Article ID'))
    .query(async ({ input }) => {
      const article = HELP_ARTICLES.find(a => a.id === input);
      if (!article) {
        throw new Error('Article not found');
      }
      return article;
    }),

  /**
   * Get all help categories
   */
  getCategories: publicProcedure.query(async () => {
    return HELP_CATEGORIES.map(cat => cat.name);
  }),

  /**
   * Get articles by category
   */
  getArticlesByCategory: publicProcedure
    .input(z.string().describe('Category name'))
    .query(async ({ input }) => {
      return HELP_ARTICLES.filter(a => a.category === input);
    }),

  /**
   * Get popular articles
   */
  getPopularArticles: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ input }) => {
      return [...HELP_ARTICLES]
        .sort((a, b) => b.views - a.views)
        .slice(0, input.limit);
    }),

  /**
   * Record user feedback on an article
   */
  recordFeedback: publicProcedure
    .input(
      z.object({
        articleId: z.string(),
        helpful: z.boolean(),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // In a real app, this would save feedback to database
      console.log('Feedback recorded:', input);
      return { success: true, message: 'Thank you for your feedback!' };
    }),
});

export type HelpCenterRouter = typeof helpCenterRouter;
