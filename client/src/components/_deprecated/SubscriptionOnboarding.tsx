import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ChevronRight, Zap, Users, BarChart3, Clock } from "lucide-react";
import { toast } from "sonner";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  cta: string;
  action: () => void;
}

export default function SubscriptionOnboarding() {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [trialActivated, setTrialActivated] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to Ologywood Pro",
      description: "Unlock powerful features to manage your artist bookings more efficiently",
      icon: <Zap className="h-12 w-12 text-purple-600" />,
      features: [
        "Unlimited rider templates",
        "Advanced analytics dashboard",
        "Priority support 24/7",
        "Full API access",
      ],
      cta: "Start 14-Day Free Trial",
      action: () => {
        setTrialActivated(true);
        toast.success("14-day Premium trial activated!");
        setCurrentStep(1);
      },
    },
    {
      id: "riders",
      title: "Unlimited Rider Templates",
      description: "Create as many custom rider templates as you need for different venues and events",
      icon: <FileText className="h-12 w-12 text-blue-600" />,
      features: [
        "Create unlimited riders",
        "Save templates for reuse",
        "Version control & history",
        "Share with venues instantly",
      ],
      cta: "Create Your First Rider",
      action: () => {
        toast.success("Navigating to rider creation...");
        setCurrentStep(2);
      },
    },
    {
      id: "analytics",
      title: "Advanced Analytics",
      description: "Track your booking performance with detailed insights and metrics",
      icon: <BarChart3 className="h-12 w-12 text-green-600" />,
      features: [
        "Real-time booking metrics",
        "Rider acceptance rates",
        "Negotiation timelines",
        "Revenue tracking",
      ],
      cta: "View Analytics Dashboard",
      action: () => {
        toast.success("Navigating to analytics...");
        setCurrentStep(3);
      },
    },
    {
      id: "team",
      title: "Team Collaboration",
      description: "Invite team members and manage bookings together with role-based access",
      icon: <Users className="h-12 w-12 text-orange-600" />,
      features: [
        "Unlimited team members",
        "Custom role permissions",
        "Activity tracking",
        "Shared calendars",
      ],
      cta: "Invite Team Members",
      action: () => {
        toast.success("Navigating to team settings...");
        setCurrentStep(4);
      },
    },
    {
      id: "support",
      title: "Priority 24/7 Support",
      description: "Get dedicated support whenever you need it with guaranteed response times",
      icon: <Clock className="h-12 w-12 text-red-600" />,
      features: [
        "24/7 phone support",
        "1-hour response guarantee",
        "Dedicated account manager",
        "Custom integrations help",
      ],
      cta: "Explore Premium Features",
      action: () => {
        toast.success("Trial activated! Enjoy all premium features.");
        setIsOpen(false);
      },
    },
  ];

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Step {currentStep + 1} of {steps.length}</Badge>
              {trialActivated && <Badge className="bg-green-600">Trial Active</Badge>}
            </div>
            <CardTitle className="text-2xl">{step.title}</CardTitle>
            <CardDescription className="mt-2">{step.description}</CardDescription>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="h-2 bg-purple-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Icon and Features */}
          <div className="flex gap-8 items-start">
            <div className="flex-shrink-0">{step.icon}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-3">Key Features:</h3>
              <ul className="space-y-2">
                {step.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-slate-700">
                    <div className="h-2 w-2 bg-purple-600 rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Trial Info */}
          {trialActivated && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>✓ 14-day Premium trial activated!</strong> You now have access to all premium features. Your trial expires on{" "}
                {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 justify-between pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep > 0) {
                  setCurrentStep(currentStep - 1);
                } else {
                  setIsOpen(false);
                }
              }}
            >
              {currentStep === 0 ? "Skip Tour" : "Previous"}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  step.action();
                  if (currentStep < steps.length - 1) {
                    setCurrentStep(currentStep + 1);
                  }
                }}
              >
                {step.cta}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Icon component for riders
function FileText(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="13" x2="12" y2="17" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}
