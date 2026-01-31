import { useState } from 'react';
import { InteractiveTutorial } from '@/components/InteractiveTutorial';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Play } from 'lucide-react';

/**
 * Example page showing how the interactive tutorial system works
 * This demonstrates the "Create Your Venue Profile" tutorial
 */
export function VenueProfileTutorialExample() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);

  // Define the tutorial steps
  const venueProfileTutorialSteps = [
    {
      id: 'step-1-welcome',
      title: 'Welcome to Your Venue Profile!',
      description:
        'We\'ll walk you through creating an amazing venue profile that will help you attract artists and bookings. This tutorial takes about 2 minutes.',
      highlights: [],
      action: 'Click "Next" to get started!',
      tips: [
        'You can skip this tutorial anytime by clicking "Skip Tutorial"',
        'Come back to this tutorial later from the Help menu',
      ],
      animation: 'fadeIn' as const,
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
      animation: 'slideIn' as const,
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
      animation: 'slideIn' as const,
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
      animation: 'slideIn' as const,
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
      animation: 'slideIn' as const,
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
      animation: 'fadeIn' as const,
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
      animation: 'fadeIn' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Interactive Tutorial Example</h1>
          <p className="text-gray-600 text-lg">
            See how the in-app tutorial system guides users through creating their venue profile
          </p>
        </div>

        {/* Demo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tutorial Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Tutorial Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-2">✨ Interactive Elements</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Animated highlights on form fields</li>
                  <li>• Smooth scrolling to relevant sections</li>
                  <li>• Step-by-step progress tracking</li>
                  <li>• Pro tips for each step</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">🎯 User Engagement</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Skip option for experienced users</li>
                  <li>• Completion tracking</li>
                  <li>• Encouraging visual feedback</li>
                  <li>• Mobile-friendly design</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>1. Trigger:</strong> Tutorial appears when user first accesses a feature
              </p>
              <p>
                <strong>2. Highlight:</strong> UI elements are highlighted with animated pulses
              </p>
              <p>
                <strong>3. Guide:</strong> Clear instructions and pro tips for each step
              </p>
              <p>
                <strong>4. Track:</strong> Progress bar shows completion status
              </p>
              <p>
                <strong>5. Celebrate:</strong> Completion screen with next steps
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Launch Tutorial Button */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Try the Interactive Tutorial</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Click the button below to see the "Create Your Venue Profile" tutorial in action. 
            This is exactly how users will experience it when they first create their venue profile.
          </p>
          <Button
            size="lg"
            onClick={() => setShowTutorial(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Play className="h-5 w-5 mr-2" />
            Launch Tutorial Demo
          </Button>
        </div>

        {/* Tutorial Completion Status */}
        {tutorialCompleted && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🎉</div>
                <div>
                  <p className="font-semibold text-green-900">Tutorial Completed!</p>
                  <p className="text-sm text-green-700">
                    This is what users see after completing the tutorial. They can now start using the feature with confidence.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tutorial Content Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Tutorial Steps Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {venueProfileTutorialSteps.map((step, idx) => (
              <div key={step.id} className="pb-4 border-b last:border-b-0">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{step.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    {step.action && (
                      <p className="text-sm text-blue-600 mt-2">👉 {step.action}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Implementation Notes */}
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">Implementation Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900 space-y-2">
            <p>
              • The tutorial system is reusable - you can create tutorials for any feature
            </p>
            <p>
              • Tutorials can be triggered on first-time user visits or manually from Help menu
            </p>
            <p>
              • Step highlights use CSS selectors to target form fields and UI elements
            </p>
            <p>
              • Analytics can track tutorial completion rates and which steps users skip
            </p>
            <p>
              • Tutorials are stored in a database so they can be updated without code changes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Render Tutorial */}
      {showTutorial && (
        <InteractiveTutorial
          tutorialId="venue-profile-creation"
          title="Create Your Venue Profile"
          description="Learn how to set up your venue profile and get discovered by artists"
          steps={venueProfileTutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            setTutorialCompleted(true);
          }}
          onSkip={() => {
            setShowTutorial(false);
          }}
        />
      )}
    </div>
  );
}
