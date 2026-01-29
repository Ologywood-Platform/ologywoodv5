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
  // Getting Started
  {
    id: '1',
    title: 'Getting Started as an Artist',
    category: 'getting-started',
    summary: 'Learn how to set up your artist profile and start receiving booking requests on Ologywood.',
    content: `Welcome to Ologywood! Here's how to get started as a performing artist:

1. **Create Your Account**: Sign up with your email or social media account
2. **Set Up Your Profile**: Add your artist name, bio, genres, and location
3. **Upload Your Photo**: Add a professional profile photo
4. **Add Your Rates**: Set your minimum and maximum performance fees
5. **Create Rider Templates**: Define your technical and hospitality requirements
6. **Start Receiving Bookings**: Venues will find you and send booking requests

Tips for Success:
- Use a professional photo
- Write a compelling bio highlighting your experience
- Keep your rates competitive
- Respond quickly to booking inquiries
- Maintain accurate availability calendar`,
    keywords: ['artist', 'profile', 'setup', 'getting started', 'onboarding'],
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
    title: 'Getting Started as a Venue',
    category: 'getting-started',
    summary: 'Set up your venue profile and learn how to browse and book artists for your events.',
    content: `Welcome to Ologywood! Here's how to get started as a venue:

1. **Create Your Account**: Sign up with your email or social media account
2. **Set Up Your Venue Profile**: Add your venue name, contact info, and location
3. **Upload Your Venue Photo**: Add a professional venue photo
4. **Browse Artists**: Search and filter artists by genre, location, and price
5. **Send Booking Requests**: Request artists for your events
6. **Manage Bookings**: Track all your bookings in one place

Tips for Success:
- Complete your profile with accurate information
- Respond to artist inquiries promptly
- Plan bookings in advance
- Review artist riders and confirm requirements
- Leave feedback after performances`,
    keywords: ['venue', 'profile', 'booking', 'artists', 'setup'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    views: 189,
    helpful: 142,
    unhelpful: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Bookings
  {
    id: '3',
    title: 'How to Create a Booking Request',
    category: 'bookings',
    summary: 'Step-by-step guide to creating and submitting a booking request to an artist.',
    content: `Creating a booking request is easy:

1. **Find an Artist**: Browse or search for artists on Ologywood
2. **Click "Request Booking"**: Go to the artist's profile
3. **Fill in Event Details**:
   - Event date and time
   - Event location
   - Event type (concert, wedding, corporate, etc.)
   - Expected attendance
   - Event description
4. **Set Your Budget**: Enter your total budget and deposit amount
5. **Add Contact Info**: Provide your contact details
6. **Submit Request**: The artist will review and respond

The artist will respond within 24-48 hours. Once confirmed, you'll both receive a contract to sign.`,
    keywords: ['booking', 'request', 'artist', 'event', 'contract'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    views: 412,
    helpful: 289,
    unhelpful: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    title: 'Managing Your Bookings',
    category: 'bookings',
    summary: 'Understand booking statuses and how to manage your confirmed bookings.',
    content: `Track and manage all your bookings from your dashboard:

**Booking Status Meanings:**
- **Pending**: Awaiting artist response
- **Confirmed**: Artist has accepted, waiting for contract signature
- **Active**: Contract signed, booking is confirmed
- **Completed**: Event has occurred
- **Cancelled**: Booking was cancelled

**What You Can Do:**
- View all booking details
- Update booking information (before confirmation)
- Communicate with the other party
- View and sign contracts
- Process payments
- Leave reviews after completion

**Cancellation Policy:**
- Cancel up to 30 days before event: Full refund
- Cancel 15-30 days before: 50% refund
- Cancel less than 15 days: No refund`,
    keywords: ['booking', 'management', 'status', 'cancellation', 'refund'],
    difficulty: 'beginner',
    estimatedReadTime: 6,
    views: 356,
    helpful: 234,
    unhelpful: 22,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Contracts & Riders
  {
    id: '5',
    title: 'Understanding Rider Requirements',
    category: 'contracts',
    summary: 'Learn what riders are and how to review artist technical and hospitality requirements.',
    content: `A rider is a document that outlines an artist's technical and hospitality requirements for a performance.

**Common Rider Sections:**

**Technical Requirements:**
- Sound system specifications
- Lighting equipment needed
- Stage setup requirements
- Power requirements
- WiFi/internet needs

**Hospitality:**
- Green room requirements
- Catering needs
- Parking arrangements
- Dressing room specifications
- Guest accommodations

**Personnel:**
- Sound engineer
- Stage manager
- Security personnel
- Lighting technician

**Logistics:**
- Load-in time requirements
- Setup time needed
- Breakdown time
- Travel arrangements

**Important Notes:**
- Review the artist's rider before confirming
- Communicate any issues or limitations early
- Some items may be negotiable
- Confirm all requirements are met before the event`,
    keywords: ['rider', 'requirements', 'technical', 'hospitality', 'contract'],
    difficulty: 'intermediate',
    estimatedReadTime: 8,
    views: 523,
    helpful: 412,
    unhelpful: 31,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '6',
    title: 'Creating and Managing Rider Templates',
    category: 'contracts',
    summary: 'Create custom rider templates for different types of performances.',
    content: `As an artist, create custom rider templates for different performance types:

**How to Create a Rider Template:**
1. Go to Dashboard > Riders tab
2. Click "Create New Template"
3. Enter template name and description
4. Add sections (Technical, Hospitality, Personnel, Logistics)
5. Add requirements to each section
6. Mark requirements as "Required" or "Optional"
7. Save your template

**Tips for Effective Riders:**
- Be specific about your needs
- Prioritize essential requirements
- Mark only truly essential items as "Required"
- Include clear descriptions
- Update riders based on venue feedback
- Create different templates for different event types

**Using Your Rider:**
- Your rider is automatically shared with venues when they request a booking
- Venues must acknowledge and confirm they can meet your requirements
- You can modify riders before confirming a booking
- Keep riders updated as your needs change`,
    keywords: ['rider', 'template', 'requirements', 'artist', 'technical'],
    difficulty: 'intermediate',
    estimatedReadTime: 7,
    views: 298,
    helpful: 201,
    unhelpful: 18,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Payments & Pricing
  {
    id: '7',
    title: 'Pricing Your Services',
    category: 'payments',
    summary: 'Learn how to set competitive pricing for your performances.',
    content: `Setting the right price for your performances:

**Factors to Consider:**
- Your experience and reputation
- Event type (wedding, corporate, festival, etc.)
- Event duration
- Travel distance and time
- Equipment and personnel needed
- Market rates in your area
- Demand for your services

**Pricing Models:**
- **Fixed Rate**: Flat fee for the performance
- **Hourly Rate**: Charge per hour of performance
- **Tiered Pricing**: Different rates for different event types
- **Deposit + Balance**: Require deposit upfront, balance on event day

**Setting Your Rates on Ologywood:**
1. Go to Profile > Edit Profile
2. Set your minimum and maximum fees
3. Venues will see your rate range
4. Negotiate specific prices for each booking

**Payment Process:**
- Venue pays deposit when booking is confirmed
- Final payment due before event
- Payments processed through Stripe
- Funds available in your account within 2-3 business days`,
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
    id: '8',
    title: 'How Payments Work',
    category: 'payments',
    summary: 'Understand the payment process and timeline for bookings.',
    content: `Understanding the payment process on Ologywood:

**Payment Timeline:**
1. **Booking Confirmed**: Venue sends booking request
2. **Deposit Due**: 50% deposit due when contract is signed
3. **Event Day**: Final 50% payment due before performance
4. **Payment Processing**: Payments processed immediately
5. **Funds Transfer**: Money appears in your account in 2-3 business days

**Payment Methods:**
- Credit/Debit Card
- Bank Transfer
- PayPal (where available)

**Invoices:**
- Automatic invoice generated for each booking
- Invoice sent to both parties
- Invoice includes all booking details and payment terms

**Refund Policy:**
- Cancellations 30+ days before: Full refund
- Cancellations 15-30 days before: 50% refund
- Cancellations less than 15 days: No refund
- Disputes resolved by Ologywood team

**Fees:**
- Ologywood charges 5% platform fee on all transactions
- Payment processing fees vary by payment method`,
    keywords: ['payment', 'refund', 'invoice', 'deposit', 'processing'],
    difficulty: 'intermediate',
    estimatedReadTime: 6,
    views: 367,
    helpful: 267,
    unhelpful: 19,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Contracts
  {
    id: '9',
    title: 'Signing and Managing Contracts',
    category: 'contracts',
    summary: 'Learn how to review, sign, and manage booking contracts.',
    content: `How to sign and manage booking contracts:

**Contract Process:**
1. **Booking Confirmed**: Both parties agree to booking terms
2. **Contract Generated**: Ologywood generates contract automatically
3. **Review Contract**: Both parties review all terms
4. **Sign Contract**: Both parties sign electronically
5. **Confirmation**: Booking is now locked in

**What's in a Contract:**
- Event details (date, time, location)
- Artist and venue information
- Performance duration
- Payment terms and amounts
- Cancellation policy
- Rider requirements
- Technical specifications
- Insurance requirements

**Signing the Contract:**
- Click "Sign Contract" in your booking details
- Review all terms carefully
- Sign electronically with your name
- Confirm signature
- Contract is now binding

**After Signing:**
- You'll receive a PDF copy
- Contract is stored in your booking history
- Both parties can reference it anytime
- Keep a copy for your records`,
    keywords: ['contract', 'signing', 'agreement', 'terms', 'legal'],
    difficulty: 'intermediate',
    estimatedReadTime: 7,
    views: 289,
    helpful: 198,
    unhelpful: 14,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Account & Profile
  {
    id: '10',
    title: 'Updating Your Profile',
    category: 'account',
    summary: 'Keep your profile current to attract more bookings and opportunities.',
    content: `Keep your profile up to date to attract more bookings:

**What to Update:**
- **Profile Photo**: Use a professional, recent photo
- **Bio**: Write a compelling description of your experience
- **Genres**: List all genres you perform
- **Location**: Accurate location helps venues find you
- **Rates**: Update your minimum and maximum fees
- **Social Links**: Add Instagram, Facebook, YouTube, Spotify
- **Portfolio**: Add photos and videos of your performances

**Profile Tips:**
- Use high-quality images
- Write in first person
- Highlight your unique qualities
- Include your experience and credentials
- Keep information current
- Update availability regularly

**Privacy Settings:**
- Control what information is visible
- Choose who can contact you
- Manage notifications
- Set communication preferences

**Verification:**
- Complete identity verification to build trust
- Get a verification badge on your profile
- Increases booking requests`,
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
    id: '11',
    title: 'Managing Your Availability',
    category: 'account',
    summary: 'Keep your availability calendar accurate to prevent double-bookings.',
    content: `Keep your availability calendar accurate:

**Why Availability Matters:**
- Venues can see when you're available
- Prevents double-booking
- Helps venues plan in advance
- Improves your booking rate

**Updating Your Availability:**
1. Go to Dashboard > Availability tab
2. Click on dates to mark them
3. Choose status:
   - **Available**: You can perform
   - **Booked**: Already have a booking
   - **Unavailable**: Cannot perform
4. Add notes if needed
5. Save changes

**Bulk Updates:**
- Mark multiple dates at once
- Set recurring availability (e.g., weekends only)
- Copy availability from previous months

**Tips:**
- Update availability at least monthly
- Mark dates as soon as you have bookings
- Be realistic about your availability
- Update when plans change
- Consider travel time between events`,
    keywords: ['availability', 'calendar', 'booking', 'schedule', 'dates'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    views: 267,
    helpful: 189,
    unhelpful: 11,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Support & Troubleshooting
  {
    id: '12',
    title: 'Frequently Asked Questions',
    category: 'support',
    summary: 'Find answers to the most common questions about using Ologywood.',
    content: `Common questions about Ologywood:

**Q: How much does Ologywood cost?**
A: Ologywood charges a 5% platform fee on all bookings. No monthly subscription required.

**Q: How long does it take to get paid?**
A: Payments are processed immediately and appear in your account within 2-3 business days.

**Q: Can I negotiate prices with venues?**
A: Yes! You can discuss custom pricing for each booking before confirming.

**Q: What if a venue cancels?**
A: Refunds are processed according to our cancellation policy. Disputes are handled by our support team.

**Q: How do I report a problem?**
A: Use the "Report Issue" button in your booking or contact our support team.

**Q: Can I change my booking details after confirming?**
A: No, but you can contact the other party to negotiate changes before the event.

**Q: How do I get verified?**
A: Complete our identity verification process in your account settings.

**Q: What payment methods do you accept?**
A: Credit/Debit cards, bank transfers, and PayPal (where available).

**Q: How do I delete my account?**
A: Go to Settings > Account > Delete Account. Note: You cannot delete if you have active bookings.`,
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
    id: '13',
    title: 'Troubleshooting Common Issues',
    category: 'support',
    summary: 'Solutions to common problems and technical issues.',
    content: `Solutions to common problems:

**I can't log in**
- Check your email and password
- Try resetting your password
- Clear browser cache and cookies
- Try a different browser
- Contact support if issue persists

**My profile isn't showing up**
- Ensure your profile is complete
- Check that you've verified your email
- Wait 24 hours for indexing
- Contact support if still not visible

**I'm not receiving booking requests**
- Make sure your availability is current
- Check your notification settings
- Update your profile with better photos/description
- Lower your rates if they're too high
- Add more genres to your profile

**Payment isn't processing**
- Verify your payment method is valid
- Check your card isn't expired
- Ensure sufficient funds
- Try a different payment method
- Contact support for help

**Contract won't sign**
- Refresh the page
- Try a different browser
- Clear browser cache
- Ensure JavaScript is enabled
- Contact support if issue continues

**I want to cancel a booking**
- Go to booking details
- Click "Request Cancellation"
- Follow the cancellation process
- Refund processed according to policy`,
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
    id: '14',
    title: 'Safety and Security',
    category: 'support',
    summary: 'Learn how to stay safe and secure on the Ologywood platform.',
    content: `Staying safe on Ologywood:

**Protecting Your Account:**
- Use a strong, unique password
- Enable two-factor authentication
- Don't share your password
- Log out on shared computers
- Update your password regularly

**Safe Transactions:**
- Only communicate through Ologywood
- Don't share personal financial info
- Verify payment before performing
- Keep copies of all contracts
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
- Support dispute resolution`,
    keywords: ['safety', 'security', 'protection', 'fraud', 'verification'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    views: 356,
    helpful: 267,
    unhelpful: 19,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const HELP_CATEGORIES: HelpCategory[] = [
  { id: '1', name: 'Getting Started', description: 'New to Ologywood? Start here', articleCount: 2 },
  { id: '2', name: 'Bookings', description: 'Creating and managing bookings', articleCount: 2 },
  { id: '3', name: 'Contracts', description: 'Riders, contracts, and requirements', articleCount: 3 },
  { id: '4', name: 'Payments', description: 'Pricing, payments, and invoices', articleCount: 2 },
  { id: '5', name: 'Account', description: 'Profile and account management', articleCount: 2 },
  { id: '6', name: 'Support', description: 'FAQs and troubleshooting', articleCount: 3 },
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
      })
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
   * Search articles
   */
  searchArticles: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).describe('Search query'),
        limit: z.number().min(1).max(50).default(10).describe('Max results'),
      })
    )
    .query(async ({ input }) => {
      const queryLower = input.query.toLowerCase();
      const results = HELP_ARTICLES.filter(
        a =>
          a.title.toLowerCase().includes(queryLower) ||
          a.content.toLowerCase().includes(queryLower) ||
          a.keywords.some(k => k.toLowerCase().includes(queryLower))
      ).slice(0, input.limit);

      return results;
    }),

  /**
   * Get all help categories
   */
  getCategories: publicProcedure
    .query(async () => {
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
      // Return articles sorted by views
      return [...HELP_ARTICLES]
        .sort((a, b) => b.views - a.views)
        .slice(0, input.limit);
    }),

  /**
   * Get recently updated articles
   */
  getRecentArticles: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ input }) => {
      // Return articles sorted by update date
      return [...HELP_ARTICLES]
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, input.limit);
    }),

  /**
   * Record user feedback on an article
   */
  recordFeedback: publicProcedure
    .input(z.object({
      articleId: z.string(),
      helpful: z.boolean(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // In a real app, this would save feedback to database
      console.log('Feedback recorded:', input);
      return { success: true, message: 'Thank you for your feedback!' };
    }),
});
export type HelpCenterRouter = typeof helpCenterRouter;
