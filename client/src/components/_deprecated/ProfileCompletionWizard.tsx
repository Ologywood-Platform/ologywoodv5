import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Lightbulb,
  Award,
  Lock,
  Unlock,
  Camera,
  Music,
  MapPin,
  FileText,
  DollarSign,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileField {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  importance: 'critical' | 'important' | 'optional';
  suggestion?: string;
  link?: string;
}

export function ProfileCompletionWizard() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedFields, setCompletedFields] = useState<string[]>([]);
  const [showWizard, setShowWizard] = useState(true);

  const isArtist = user?.role === 'artist';

  const artistFields: ProfileField[] = [
    {
      id: 'profile-photo',
      label: 'Profile Photo',
      description: 'Add a professional photo to your profile',
      icon: <Camera className="h-5 w-5" />,
      completed: false,
      importance: 'critical',
      suggestion: 'High-quality headshots increase booking requests by 40%',
      link: '/settings?tab=media'
    },
    {
      id: 'bio',
      label: 'Artist Bio',
      description: 'Write a compelling bio about yourself',
      icon: <FileText className="h-5 w-5" />,
      completed: false,
      importance: 'critical',
      suggestion: 'Include your experience, awards, and unique style',
      link: '/settings?tab=profile'
    },
    {
      id: 'genres',
      label: 'Music Genres',
      description: 'Select your music genres',
      icon: <Music className="h-5 w-5" />,
      completed: false,
      importance: 'critical',
      suggestion: 'Artists with 3+ genres get 2x more booking requests',
      link: '/settings?tab=profile'
    },
    {
      id: 'location',
      label: 'Location',
      description: 'Set your primary location',
      icon: <MapPin className="h-5 w-5" />,
      completed: false,
      importance: 'important',
      suggestion: 'Venues search by location - this is crucial',
      link: '/settings?tab=profile'
    },
    {
      id: 'rates',
      label: 'Performance Rates',
      description: 'Set your booking rates',
      icon: <DollarSign className="h-5 w-5" />,
      completed: false,
      importance: 'important',
      suggestion: 'Transparent pricing attracts serious venues',
      link: '/settings?tab=profile'
    },
    {
      id: 'gallery',
      label: 'Media Gallery',
      description: 'Upload performance photos and videos',
      icon: <Camera className="h-5 w-5" />,
      completed: false,
      importance: 'important',
      suggestion: 'Galleries with 5+ photos get 3x more views',
      link: '/settings?tab=media'
    },
    {
      id: 'availability',
      label: 'Availability Calendar',
      description: 'Set your performance availability',
      icon: <Calendar className="h-5 w-5" />,
      completed: false,
      importance: 'important',
      suggestion: 'Keep your calendar updated for better matches',
      link: '/availability'
    },
    {
      id: 'riders',
      label: 'Technical Riders',
      description: 'Create your technical requirements',
      icon: <FileText className="h-5 w-5" />,
      completed: false,
      importance: 'optional',
      suggestion: 'Professional riders show you\'re serious',
      link: '/saved-riders'
    }
  ];

  const venueFields: ProfileField[] = [
    {
      id: 'venue-photo',
      label: 'Venue Photos',
      description: 'Add photos of your venue',
      icon: <Camera className="h-5 w-5" />,
      completed: false,
      importance: 'critical',
      suggestion: 'Quality photos attract top artists',
      link: '/settings?tab=media'
    },
    {
      id: 'venue-bio',
      label: 'Venue Description',
      description: 'Describe your venue and atmosphere',
      icon: <FileText className="h-5 w-5" />,
      completed: false,
      importance: 'critical',
      suggestion: 'Include capacity, amenities, and vibe',
      link: '/settings?tab=profile'
    },
    {
      id: 'location',
      label: 'Location & Address',
      description: 'Set your venue location',
      icon: <MapPin className="h-5 w-5" />,
      completed: false,
      importance: 'critical',
      suggestion: 'Artists filter by location first',
      link: '/settings?tab=profile'
    },
    {
      id: 'capacity',
      label: 'Capacity & Setup',
      description: 'Specify your venue capacity',
      icon: <Award className="h-5 w-5" />,
      completed: false,
      importance: 'important',
      suggestion: 'Helps match artists to your venue size',
      link: '/settings?tab=profile'
    },
    {
      id: 'rates',
      label: 'Budget Range',
      description: 'Set your typical booking budget',
      icon: <DollarSign className="h-5 w-5" />,
      completed: false,
      importance: 'important',
      suggestion: 'Transparent budgets attract qualified artists',
      link: '/settings?tab=profile'
    },
    {
      id: 'amenities',
      label: 'Amenities & Equipment',
      description: 'List available equipment and amenities',
      icon: <Music className="h-5 w-5" />,
      completed: false,
      importance: 'important',
      suggestion: 'Sound system, lighting, parking info matters',
      link: '/settings?tab=profile'
    },
    {
      id: 'reviews',
      label: 'Venue Reviews',
      description: 'Get reviewed by artists you book',
      icon: <Star className="h-5 w-5" />,
      completed: false,
      importance: 'optional',
      suggestion: 'Reviews build trust with new artists',
      link: '/reviews'
    }
  ];

  const fields = isArtist ? artistFields : venueFields;
  const completedCount = completedFields.length;
  const totalCount = fields.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  const criticalFields = fields.filter(f => f.importance === 'critical');
  const criticalCompleted = criticalFields.filter(f => completedFields.includes(f.id)).length;

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'important': return 'bg-yellow-100 text-yellow-800';
      case 'optional': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImportanceLabel = (importance: string) => {
    switch (importance) {
      case 'critical': return 'Critical';
      case 'important': return 'Important';
      case 'optional': return 'Optional';
      default: return 'Info';
    }
  };

  if (!showWizard) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <Card className="shadow-xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Complete Your Profile</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {completionPercentage}% Complete • {completedCount}/{totalCount} fields
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWizard(false)}
            >
              ✕
            </Button>
          </div>
          <Progress value={completionPercentage} className="mt-3 h-2" />
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Critical Fields Status */}
          {criticalFields.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-900">
                {criticalCompleted}/{criticalFields.length} critical fields completed
              </p>
              <p className="text-xs text-red-700 mt-1">
                Complete all critical fields to unlock full visibility
              </p>
            </div>
          )}

          {/* Current Step */}
          {currentStep < fields.length && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">
                    {fields[currentStep].label}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {fields[currentStep].suggestion}
                  </p>
                  <a href={fields[currentStep].link} className="no-underline">
                    <Button size="sm" className="mt-2">
                      Complete Now <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Rewards */}
          {completionPercentage === 100 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-bold text-green-900">Profile Complete!</p>
              <p className="text-sm text-green-700 mt-1">
                You're now visible to all {isArtist ? 'venues' : 'artists'}
              </p>
            </div>
          )}

          {/* Next Steps */}
          {completionPercentage < 100 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">NEXT STEPS</p>
              <div className="space-y-2">
                {fields.slice(currentStep, Math.min(currentStep + 2, fields.length)).map((field, idx) => (
                  <div key={field.id} className="flex items-start gap-2 text-sm">
                    <div className={cn(
                      'flex-shrink-0 mt-0.5',
                      completedFields.includes(field.id) ? 'text-green-600' : 'text-muted-foreground'
                    )}>
                      {completedFields.includes(field.id) ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={completedFields.includes(field.id) ? 'line-through text-muted-foreground' : ''}>
                        {field.label}
                      </p>
                      <Badge className={`mt-1 ${getImportanceColor(field.importance)}`}>
                        {getImportanceLabel(field.importance)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowWizard(false)}
            >
              Dismiss
            </Button>
            {completionPercentage < 100 && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  if (fields[currentStep].link) {
                    window.location.href = fields[currentStep].link;
                  }
                }}
              >
                Get Started
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Import Calendar icon
import { Calendar } from 'lucide-react';
