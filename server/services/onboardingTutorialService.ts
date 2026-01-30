/**
 * Onboarding Tutorial Service
 * Manages guided walkthroughs for first-time users (artists & venues)
 */

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  action: string;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  highlightElement?: boolean;
  allowSkip?: boolean;
}

export interface TutorialFlow {
  id: string;
  name: string;
  userType: 'artist' | 'venue';
  steps: TutorialStep[];
  estimatedDuration: number; // in minutes
  completionReward?: string;
}

export interface UserTutorialProgress {
  userId: number;
  tutorialId: string;
  currentStep: number;
  completed: boolean;
  completedAt?: Date;
  skipped: boolean;
}

export class OnboardingTutorialService {
  /**
   * Get artist onboarding tutorial flow
   */
  static getArtistTutorial(): TutorialFlow {
    return {
      id: 'artist-onboarding',
      name: 'Artist Profile Setup',
      userType: 'artist',
      estimatedDuration: 8,
      completionReward: 'Complete your profile to unlock premium features',
      steps: [
        {
          id: 'artist-welcome',
          title: 'Welcome to Ologywood!',
          description: 'Let\'s set up your artist profile in 5 easy steps. This will help venues find and book you.',
          action: 'Click "Next" to begin',
          highlightElement: false,
          allowSkip: true,
        },
        {
          id: 'artist-profile-photo',
          title: 'Add Your Profile Photo',
          description: 'Upload a professional photo. This is the first thing venues see about you.',
          action: 'Click the profile photo upload button',
          targetElement: '[data-tutorial="profile-photo"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'artist-bio',
          title: 'Write Your Bio',
          description: 'Tell venues about yourself, your experience, and what makes you unique. Keep it to 500 characters.',
          action: 'Fill in your artist bio',
          targetElement: '[data-tutorial="artist-bio"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'artist-genre',
          title: 'Select Your Genres',
          description: 'Choose the genres you perform. This helps venues find artists matching their event style.',
          action: 'Select at least one genre',
          targetElement: '[data-tutorial="genre-select"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'artist-fees',
          title: 'Set Your Performance Fees',
          description: 'Set your minimum and maximum fees. Venues will see your fee range when searching.',
          action: 'Enter your fee range',
          targetElement: '[data-tutorial="fee-range"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'artist-rider',
          title: 'Create Your Rider Template',
          description: 'Set up your technical and hospitality requirements. This saves time on every booking.',
          action: 'Click "Create Rider" button',
          targetElement: '[data-tutorial="create-rider"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'artist-availability',
          title: 'Set Your Availability',
          description: 'Mark dates when you\'re available to perform. Venues can only book you on available dates.',
          action: 'Click "Manage Availability"',
          targetElement: '[data-tutorial="manage-availability"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'artist-complete',
          title: 'You\'re All Set!',
          description: 'Your profile is complete. Venues can now find and book you. Check your dashboard to see incoming booking requests.',
          action: 'Go to Dashboard',
          highlightElement: false,
          allowSkip: false,
        },
      ],
    };
  }

  /**
   * Get venue onboarding tutorial flow
   */
  static getVenueTutorial(): TutorialFlow {
    return {
      id: 'venue-onboarding',
      name: 'Venue Setup & First Booking',
      userType: 'venue',
      estimatedDuration: 10,
      completionReward: 'Complete setup to start booking artists',
      steps: [
        {
          id: 'venue-welcome',
          title: 'Welcome to Ologywood!',
          description: 'Let\'s set up your venue and book your first artist. This takes about 10 minutes.',
          action: 'Click "Next" to begin',
          highlightElement: false,
          allowSkip: true,
        },
        {
          id: 'venue-info',
          title: 'Add Venue Information',
          description: 'Tell us about your venue - name, location, and capacity. This helps artists understand your venue.',
          action: 'Fill in venue details',
          targetElement: '[data-tutorial="venue-info"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'venue-photo',
          title: 'Upload Venue Photo',
          description: 'Add a photo of your venue. Artists want to see where they\'ll be performing.',
          action: 'Upload venue photo',
          targetElement: '[data-tutorial="venue-photo"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'venue-bio',
          title: 'Write Your Venue Bio',
          description: 'Describe your venue\'s atmosphere, audience, and what kind of events you host.',
          action: 'Write your venue bio',
          targetElement: '[data-tutorial="venue-bio"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'venue-search',
          title: 'Search for Artists',
          description: 'Use the search and filters to find artists that match your event needs.',
          action: 'Go to Artist Search',
          targetElement: '[data-tutorial="artist-search"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'venue-booking',
          title: 'Send a Booking Request',
          description: 'Found an artist you like? Click "Book" to send them a booking request with your event details.',
          action: 'Send booking request',
          targetElement: '[data-tutorial="send-booking"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'venue-negotiation',
          title: 'Negotiate Terms',
          description: 'Artists might counter-offer different fees or dates. You can accept, reject, or counter back.',
          action: 'Review booking requests',
          targetElement: '[data-tutorial="booking-requests"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'venue-payment',
          title: 'Process Payment',
          description: 'Once terms are agreed, pay a deposit or full fee. Multiple payment options available.',
          action: 'Make payment',
          targetElement: '[data-tutorial="payment-section"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'venue-confirmation',
          title: 'Booking Confirmed!',
          description: 'Your booking is confirmed. You can message the artist, review their rider, and manage the event.',
          action: 'View booking details',
          targetElement: '[data-tutorial="booking-details"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'venue-complete',
          title: 'You\'re Ready to Go!',
          description: 'You\'ve successfully booked your first artist. Check your dashboard for upcoming events and artist messages.',
          action: 'Go to Dashboard',
          highlightElement: false,
          allowSkip: false,
        },
      ],
    };
  }

  /**
   * Get booking workflow tutorial
   */
  static getBookingWorkflowTutorial(): TutorialFlow {
    return {
      id: 'booking-workflow',
      name: 'Complete Booking Workflow',
      userType: 'artist',
      estimatedDuration: 5,
      steps: [
        {
          id: 'booking-request',
          title: 'Booking Request Received',
          description: 'A venue is interested in booking you. Review their event details and requirements.',
          action: 'Open booking request',
          targetElement: '[data-tutorial="booking-request"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'booking-review',
          title: 'Review Event Details',
          description: 'Check the event date, time, location, and venue requirements.',
          action: 'Review details',
          targetElement: '[data-tutorial="event-details"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'booking-rider',
          title: 'Review Rider Acknowledgment',
          description: 'The venue has acknowledged your rider requirements. Check if all your needs are met.',
          action: 'Review rider status',
          targetElement: '[data-tutorial="rider-status"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'booking-accept',
          title: 'Accept or Counter',
          description: 'If everything looks good, accept the booking. If not, send a counter-offer.',
          action: 'Accept or counter',
          targetElement: '[data-tutorial="booking-actions"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'booking-payment',
          title: 'Payment Processing',
          description: 'Once accepted, the venue will process payment. You\'ll receive a deposit or full payment.',
          action: 'Track payment',
          targetElement: '[data-tutorial="payment-status"]',
          position: 'bottom',
          highlightElement: true,
        },
      ],
    };
  }

  /**
   * Get payment tutorial
   */
  static getPaymentTutorial(): TutorialFlow {
    return {
      id: 'payment-guide',
      name: 'Payment Options Guide',
      userType: 'venue',
      estimatedDuration: 3,
      steps: [
        {
          id: 'payment-options',
          title: 'Payment Options',
          description: 'Choose how you want to pay: full payment upfront, deposit now + balance later, or installments.',
          action: 'Select payment option',
          targetElement: '[data-tutorial="payment-options"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'payment-deposit',
          title: 'Deposit Payment',
          description: 'Pay 50% now to secure the booking. Pay the rest closer to the event date.',
          action: 'Choose deposit option',
          targetElement: '[data-tutorial="deposit-option"]',
          position: 'bottom',
          highlightElement: true,
        },
        {
          id: 'payment-installments',
          title: 'Installment Plans',
          description: 'Spread payments over 2, 3, 4, or 6 months. Great for budget planning.',
          action: 'Choose installment plan',
          targetElement: '[data-tutorial="installment-option"]',
          position: 'bottom',
          highlightElement: true,
        },
      ],
    };
  }

  /**
   * Get all available tutorials
   */
  static getAllTutorials(): TutorialFlow[] {
    return [
      this.getArtistTutorial(),
      this.getVenueTutorial(),
      this.getBookingWorkflowTutorial(),
      this.getPaymentTutorial(),
    ];
  }

  /**
   * Get tutorial by ID
   */
  static getTutorialById(tutorialId: string): TutorialFlow | undefined {
    return this.getAllTutorials().find((t) => t.id === tutorialId);
  }

  /**
   * Get next tutorial step
   */
  static getNextStep(tutorial: TutorialFlow, currentStepIndex: number): TutorialStep | undefined {
    if (currentStepIndex + 1 < tutorial.steps.length) {
      return tutorial.steps[currentStepIndex + 1];
    }
    return undefined;
  }

  /**
   * Check if tutorial is complete
   */
  static isTutorialComplete(tutorial: TutorialFlow, currentStepIndex: number): boolean {
    return currentStepIndex >= tutorial.steps.length - 1;
  }

  /**
   * Calculate tutorial progress percentage
   */
  static getProgressPercentage(tutorial: TutorialFlow, currentStepIndex: number): number {
    return Math.round(((currentStepIndex + 1) / tutorial.steps.length) * 100);
  }
}

export const onboardingTutorialService = new OnboardingTutorialService();
