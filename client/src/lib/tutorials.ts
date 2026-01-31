/**
 * Tutorial definitions for all key platform features
 * Each tutorial is a reusable configuration that can be triggered at different points
 */

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  highlights?: string[];
  action?: string;
  tips?: string[];
  animation?: 'slideIn' | 'fadeIn' | 'pulse';
}

export interface TutorialConfig {
  id: string;
  title: string;
  description: string;
  category: 'onboarding' | 'feature' | 'advanced';
  estimatedTime: number; // in minutes
  steps: TutorialStep[];
  triggerOn?: 'firstVisit' | 'manual' | 'both';
}

export const TUTORIALS: Record<string, TutorialConfig> = {
  // Onboarding Tutorial
  venueProfileCreation: {
    id: 'venue-profile-creation',
    title: 'Create Your Venue Profile',
    description: 'Learn how to set up your venue profile and get discovered by artists',
    category: 'onboarding',
    estimatedTime: 3,
    triggerOn: 'firstVisit',
    steps: [
      {
        id: 'step-1-welcome',
        title: 'Welcome to Your Venue Profile!',
        description:
          "We'll walk you through creating an amazing venue profile that will help you attract artists and bookings. This tutorial takes about 3 minutes.",
        highlights: [],
        action: 'Click "Next" to get started!',
        tips: [
          'You can skip this tutorial anytime by clicking "Skip Tutorial"',
          'Come back to this tutorial later from the Help menu',
        ],
        animation: 'fadeIn',
      },
      {
        id: 'step-2-basic-info',
        title: 'Step 1: Basic Information',
        description:
          'Start by filling in your venue\'s basic details. This is the foundation of your profile and helps artists find you.',
        highlights: ['#organizationName', '#location', '#contactPhone'],
        action: 'Fill in your venue name, location, and contact phone number',
        tips: [
          'Use your official venue name for credibility',
          'Include the city and state in your location',
          'A phone number helps artists reach you quickly',
        ],
        animation: 'slideIn',
      },
      {
        id: 'step-3-contact',
        title: 'Step 2: Contact & Website',
        description:
          'Add your website and email so artists can learn more about your venue and reach out with questions.',
        highlights: ['#websiteUrl', '#email'],
        action: 'Enter your website URL and booking email address',
        tips: [
          'Make sure your website is up-to-date and mobile-friendly',
          'Use a dedicated booking email for easy tracking',
          'Both fields are optional but highly recommended',
        ],
        animation: 'slideIn',
      },
      {
        id: 'step-4-directory',
        title: 'Step 3: Directory Listing',
        description:
          'Make your venue discoverable! Tell artists about your venue type, capacity, and what makes it special.',
        highlights: ['#venueType', '#capacity', '#amenities', '#bio'],
        action: 'Select your venue type, enter capacity, choose amenities, and write a description',
        tips: [
          'Choose amenities that matter to artists (PA System, Stage, Lighting, etc.)',
          'Write a compelling bio that showcases your venue\'s unique atmosphere',
          'Accurate capacity helps artists plan better performances',
          'More details = more inquiries from interested artists',
        ],
        animation: 'slideIn',
      },
      {
        id: 'step-5-photos',
        title: 'Step 4: Add Photos',
        description:
          'A picture is worth a thousand words! Upload a high-quality photo of your venue to make it stand out.',
        highlights: ['#profilePhoto'],
        action: 'Upload a professional photo of your venue',
        tips: [
          'Use a photo that shows the stage, lighting, and atmosphere',
          'Make sure the image is well-lit and in focus',
          'Landscape orientation works best',
          'You can add more photos later from your profile settings',
        ],
        animation: 'slideIn',
      },
      {
        id: 'step-6-directory-visibility',
        title: 'Your Venue is Now Listed!',
        description:
          'Congratulations! Your venue is now visible in the Ologywood directory. Artists can find you, view your details, and send booking requests.',
        highlights: [],
        action: 'View your venue profile in the directory',
        tips: [
          'Your profile will appear in search results and filters',
          'You\'ll receive notifications when artists view your profile',
          'Check your analytics dashboard to see how many artists are interested',
          'Update your profile regularly to stay at the top of search results',
        ],
        animation: 'fadeIn',
      },
      {
        id: 'step-7-next-steps',
        title: 'What\'s Next?',
        description:
          'Now that your profile is live, here are some recommended next steps to maximize your bookings.',
        highlights: [],
        action: 'Explore these features to grow your venue',
        tips: [
          '📊 Check your Analytics Dashboard to track profile views and inquiries',
          '📱 Share your venue on social media to get more visibility',
          '⭐ Encourage artists to leave reviews after their performances',
          '💬 Respond quickly to booking inquiries to increase conversion rates',
          '🎯 Update your amenities and bio regularly to stay relevant',
        ],
        animation: 'fadeIn',
      },
    ],
  },

  // Browse Artists Tutorial
  browseArtists: {
    id: 'browse-artists',
    title: 'Find the Perfect Artist',
    description: 'Learn how to search and filter artists to find the perfect performer for your event',
    category: 'feature',
    estimatedTime: 2,
    triggerOn: 'manual',
    steps: [
      {
        id: 'browse-1-search',
        title: 'Search by Name or Genre',
        description:
          'Use the search bar to find artists by name, genre, or location. Start typing to see matching results.',
        highlights: ['#artistSearch'],
        action: 'Try searching for a genre like "Jazz" or "Rock"',
        tips: [
          'Search is case-insensitive',
          'You can search by artist name, genre, or location',
          'Results update as you type',
        ],
        animation: 'slideIn',
      },
      {
        id: 'browse-2-filters',
        title: 'Use Filters to Narrow Down',
        description:
          'Apply filters to find artists that match your specific needs. Filter by genre, experience level, rate range, and more.',
        highlights: ['#genreFilter', '#experienceFilter', '#rateFilter'],
        action: 'Select filters that match your event requirements',
        tips: [
          'You can combine multiple filters',
          'Filters update results in real-time',
          'Clear filters anytime to see all artists',
        ],
        animation: 'slideIn',
      },
      {
        id: 'browse-3-view-profile',
        title: 'View Artist Profiles',
        description:
          'Click on an artist to view their full profile, including photos, videos, rates, availability, and reviews.',
        highlights: ['.artist-card'],
        action: 'Click on an artist card to see their full profile',
        tips: [
          'Check their availability calendar',
          'Read reviews from other venues',
          'Watch their performance videos if available',
          'Note their rates and booking terms',
        ],
        animation: 'slideIn',
      },
      {
        id: 'browse-4-send-request',
        title: 'Send a Booking Request',
        description:
          'When you find an artist you like, send them a booking request with your event details. They\'ll review and respond within 24-48 hours.',
        highlights: ['#sendBookingButton'],
        action: 'Click "Send Booking Request" to initiate contact',
        tips: [
          'Include event details like date, time, and venue type',
          'Mention your budget range if possible',
          'Artists appreciate personalized messages',
          'You can track all requests in your Bookings dashboard',
        ],
        animation: 'slideIn',
      },
      {
        id: 'browse-5-success',
        title: 'Great! You\'re All Set',
        description:
          'Your booking request has been sent! The artist will review your event details and respond soon. You\'ll receive a notification when they reply.',
        highlights: [],
        action: 'Check your Bookings dashboard to track the status',
        tips: [
          '✅ You can send multiple booking requests',
          '⏰ Most artists respond within 24-48 hours',
          '📧 You\'ll get email notifications for responses',
          '💬 You can message artists directly to discuss details',
        ],
        animation: 'fadeIn',
      },
    ],
  },

  // Send Booking Request Tutorial
  sendBookingRequest: {
    id: 'send-booking-request',
    title: 'Send a Booking Request',
    description: 'Learn how to request an artist for your event',
    category: 'feature',
    estimatedTime: 2,
    triggerOn: 'manual',
    steps: [
      {
        id: 'booking-1-details',
        title: 'Enter Event Details',
        description:
          'Provide information about your event so the artist can understand your needs and availability.',
        highlights: ['#eventDate', '#eventTime', '#eventType', '#eventDescription'],
        action: 'Fill in your event date, time, type, and description',
        tips: [
          'Be specific about the event type (wedding, corporate, club, etc.)',
          'Provide a detailed description of what you\'re looking for',
          'Include any special requirements or requests',
        ],
        animation: 'slideIn',
      },
      {
        id: 'booking-2-budget',
        title: 'Set Your Budget',
        description:
          'Specify your budget range. This helps artists determine if they\'re available and interested in your event.',
        highlights: ['#budgetMin', '#budgetMax'],
        action: 'Enter your budget range',
        tips: [
          'Be realistic with your budget',
          'Artists can negotiate if your budget is flexible',
          'Higher budgets attract more experienced artists',
        ],
        animation: 'slideIn',
      },
      {
        id: 'booking-3-requirements',
        title: 'Specify Technical Requirements',
        description:
          'Let the artist know what equipment and setup you can provide. This helps them prepare properly.',
        highlights: ['#technicalRequirements'],
        action: 'Select the equipment and setup available at your venue',
        tips: [
          'Include PA system, stage size, lighting, etc.',
          'Be honest about limitations',
          'Artists will ask for clarification if needed',
        ],
        animation: 'slideIn',
      },
      {
        id: 'booking-4-message',
        title: 'Add a Personal Message',
        description:
          'Write a personalized message to the artist. This increases the chance they\'ll accept your booking request.',
        highlights: ['#personalMessage'],
        action: 'Write a friendly message explaining why you\'d like to book them',
        tips: [
          'Mention specific things you like about their work',
          'Be professional and respectful',
          'Keep it concise but personable',
        ],
        animation: 'slideIn',
      },
      {
        id: 'booking-5-submit',
        title: 'Submit Your Request',
        description:
          'Review everything and submit your booking request. The artist will receive a notification and review your event.',
        highlights: ['#submitButton'],
        action: 'Click "Submit Booking Request"',
        tips: [
          'You can edit the request if the artist asks for changes',
          'You\'ll see the status in your Bookings dashboard',
          'Be prepared to negotiate if needed',
        ],
        animation: 'slideIn',
      },
    ],
  },

  // Share on Social Media Tutorial
  shareOnSocialMedia: {
    id: 'share-social-media',
    title: 'Share Your Profile on Social Media',
    description: 'Learn how to promote your venue on social media platforms',
    category: 'feature',
    estimatedTime: 2,
    triggerOn: 'manual',
    steps: [
      {
        id: 'share-1-button',
        title: 'Find the Share Button',
        description:
          'Look for the Share button on your venue profile. It\'s usually located near the top or in the action menu.',
        highlights: ['#shareButton'],
        action: 'Click the Share button on your venue profile',
        tips: [
          'The Share button is available on both artist and venue profiles',
          'You can share anytime to promote your profile',
        ],
        animation: 'slideIn',
      },
      {
        id: 'share-2-platforms',
        title: 'Choose Your Platform',
        description:
          'Select which social media platform you want to share to. We support Facebook, Twitter, LinkedIn, WhatsApp, and Email.',
        highlights: ['.share-menu'],
        action: 'Select a social media platform',
        tips: [
          'Facebook is great for reaching local audiences',
          'LinkedIn works well for corporate events',
          'WhatsApp is perfect for direct sharing with contacts',
        ],
        animation: 'slideIn',
      },
      {
        id: 'share-3-preview',
        title: 'Preview Your Share',
        description:
          'Before sharing, you\'ll see a preview of how your profile will look on the social platform. Make sure it looks good!',
        highlights: [],
        action: 'Review the preview of your shared profile',
        tips: [
          'The preview shows your profile photo, name, and description',
          'Different platforms format the preview differently',
        ],
        animation: 'slideIn',
      },
      {
        id: 'share-4-share',
        title: 'Share to Your Audience',
        description:
          'Click the final share button to post your profile to your social media. Your followers will see it in their feed!',
        highlights: [],
        action: 'Complete the share on your chosen platform',
        tips: [
          'You can add a custom message before sharing',
          'Share regularly to increase visibility',
          'Encourage your followers to book you or visit your venue',
        ],
        animation: 'slideIn',
      },
      {
        id: 'share-5-success',
        title: 'Your Profile is Shared!',
        description:
          'Great! Your profile is now being promoted on social media. Watch your analytics dashboard to see who\'s viewing your profile from social shares.',
        highlights: [],
        action: 'Check your analytics dashboard for social traffic',
        tips: [
          '📊 Track social media referrals in your analytics',
          '📈 Share regularly to maintain visibility',
          '💬 Engage with comments and messages from interested parties',
        ],
        animation: 'fadeIn',
      },
    ],
  },

  // Analytics Dashboard Tutorial
  viewAnalyticsDashboard: {
    id: 'view-analytics-dashboard',
    title: 'Understand Your Analytics Dashboard',
    description: 'Learn how to track your profile performance and booking metrics',
    category: 'feature',
    estimatedTime: 3,
    triggerOn: 'manual',
    steps: [
      {
        id: 'analytics-1-overview',
        title: 'Dashboard Overview',
        description:
          'Your analytics dashboard shows key metrics about your profile performance, inquiries, and bookings at a glance.',
        highlights: ['#analyticsOverview'],
        action: 'Review the key metrics displayed',
        tips: [
          'Profile Views: How many people visited your profile',
          'Inquiries: How many booking requests you received',
          'Bookings: How many bookings you confirmed',
          'Average Rating: Your profile rating from reviews',
        ],
        animation: 'slideIn',
      },
      {
        id: 'analytics-2-trends',
        title: 'View Trends Over Time',
        description:
          'The trend charts show how your profile performance has changed over days, weeks, or months. Use this to identify patterns.',
        highlights: ['#trendsChart'],
        action: 'Examine the trend charts for views and inquiries',
        tips: [
          'Look for spikes in activity to see what\'s working',
          'Compare trends week-to-week to measure growth',
          'Seasonal patterns can help you plan marketing',
        ],
        animation: 'slideIn',
      },
      {
        id: 'analytics-3-reviews',
        title: 'Review Your Ratings',
        description:
          'See detailed breakdowns of your ratings by category. This helps you understand what you\'re doing well and where to improve.',
        highlights: ['#reviewsSection'],
        action: 'Check your rating breakdown by category',
        tips: [
          'Higher ratings in specific categories attract more bookings',
          'Focus on improving lower-rated categories',
          'Respond to reviews to show you care about feedback',
        ],
        animation: 'slideIn',
      },
      {
        id: 'analytics-4-traffic',
        title: 'Track Traffic Sources',
        description:
          'See where your profile views are coming from. This helps you understand which marketing channels are most effective.',
        highlights: ['#trafficSources'],
        action: 'Review your traffic sources breakdown',
        tips: [
          'Direct: People who found you through search',
          'Social: People who clicked your social media shares',
          'Referral: People referred by other profiles',
          'Focus on the channels that bring the most traffic',
        ],
        animation: 'slideIn',
      },
      {
        id: 'analytics-5-inquiries',
        title: 'Manage Your Inquiries',
        description:
          'See all booking inquiries and track their status. Respond quickly to increase your booking conversion rate.',
        highlights: ['#inquiriesTable'],
        action: 'Review your recent inquiries',
        tips: [
          'Respond within 24 hours for best results',
          'Track which inquiries convert to bookings',
          'Look for patterns in successful bookings',
        ],
        animation: 'slideIn',
      },
      {
        id: 'analytics-6-pro-tips',
        title: 'Pro Tips for Success',
        description:
          'Use these insights to grow your bookings and improve your profile performance.',
        highlights: [],
        action: 'Implement these strategies to boost your bookings',
        tips: [
          '🎯 Update your profile regularly to stay fresh',
          '📱 Share on social media to drive traffic',
          '⭐ Encourage satisfied clients to leave reviews',
          '💬 Respond quickly to inquiries',
          '📊 Monitor your analytics weekly to spot trends',
        ],
        animation: 'fadeIn',
      },
    ],
  },
};

/**
 * Get a tutorial by ID
 */
export function getTutorial(tutorialId: string): TutorialConfig | undefined {
  return TUTORIALS[tutorialId];
}

/**
 * Get all tutorials for a category
 */
export function getTutorialsByCategory(
  category: 'onboarding' | 'feature' | 'advanced'
): TutorialConfig[] {
  return Object.values(TUTORIALS).filter(t => t.category === category);
}

/**
 * Get all tutorials that should trigger on first visit
 */
export function getFirstVisitTutorials(): TutorialConfig[] {
  return Object.values(TUTORIALS).filter(t => t.triggerOn === 'firstVisit' || t.triggerOn === 'both');
}

/**
 * Get all available tutorials
 */
export function getAllTutorials(): TutorialConfig[] {
  return Object.values(TUTORIALS);
}
