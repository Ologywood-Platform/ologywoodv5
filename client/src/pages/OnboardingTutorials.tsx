import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, CheckCircle2, BookOpen } from "lucide-react";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  steps: string[];
  icon: React.ReactNode;
}

const artistTutorials: Tutorial[] = [
  {
    id: "artist-1",
    title: "Complete Your Artist Profile",
    description: "Learn how to create an attractive profile that gets discovered by venues",
    duration: "5 min",
    steps: [
      "Add a professional profile photo",
      "Write a compelling bio about your music",
      "List your genres and experience level",
      "Add links to your music (Spotify, YouTube, etc.)",
      "Set your availability and rates",
    ],
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    id: "artist-2",
    title: "Create Your Rider Template",
    description: "Set up technical and hospitality requirements for your bookings",
    duration: "8 min",
    steps: [
      "Go to Rider Template Builder",
      "Add technical requirements (sound system, lighting, etc.)",
      "Specify hospitality needs (green room, beverages, etc.)",
      "Set payment terms and deposit requirements",
      "Download and share your rider",
    ],
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    id: "artist-3",
    title: "Browse and Book Venues",
    description: "Find venues that match your style and send booking requests",
    duration: "6 min",
    steps: [
      "Use the venue directory to search by location",
      "Filter by venue type and capacity",
      "Review venue details and ratings",
      "Send a booking request with your rates",
      "Negotiate terms and confirm booking",
    ],
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    id: "artist-4",
    title: "Manage Your Bookings",
    description: "Track and manage all your upcoming performances",
    duration: "5 min",
    steps: [
      "View all bookings in your dashboard",
      "Check booking details and venue info",
      "Communicate with venues via messages",
      "Update your availability calendar",
      "Track earnings and payments",
    ],
    icon: <BookOpen className="h-6 w-6" />,
  },
];

const venueTutorials: Tutorial[] = [
  {
    id: "venue-1",
    title: "Set Up Your Venue Profile",
    description: "Create a professional venue listing to attract artists",
    duration: "7 min",
    steps: [
      "Add venue name and location",
      "Upload venue photos and description",
      "Specify venue type and capacity",
      "Set your booking rates and terms",
      "Add contact information and hours",
    ],
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    id: "venue-2",
    title: "Browse and Book Artists",
    description: "Find talented artists that fit your venue",
    duration: "6 min",
    steps: [
      "Search artists by genre and location",
      "Filter by experience level and rates",
      "Review artist profiles and samples",
      "Check availability and send booking request",
      "Review rider requirements and confirm",
    ],
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    id: "venue-3",
    title: "Manage Bookings and Contracts",
    description: "Handle bookings and digital contracts",
    duration: "8 min",
    steps: [
      "View all pending and confirmed bookings",
      "Review artist riders and requirements",
      "Send and sign digital contracts",
      "Manage payment terms and deposits",
      "Track booking history and reviews",
    ],
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    id: "venue-4",
    title: "Track Performance Analytics",
    description: "Monitor your venue's booking trends and performance",
    duration: "5 min",
    steps: [
      "View booking analytics dashboard",
      "Track popular genres and peak times",
      "Monitor artist ratings and reviews",
      "Analyze revenue by event",
      "Export reports for business planning",
    ],
    icon: <BookOpen className="h-6 w-6" />,
  },
];

export default function OnboardingTutorials() {
  const [selectedRole, setSelectedRole] = useState<"artist" | "venue">("artist");
  const [expandedTutorial, setExpandedTutorial] = useState<string | null>(null);
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set());

  const tutorials = selectedRole === "artist" ? artistTutorials : venueTutorials;

  const toggleComplete = (id: string) => {
    const newCompleted = new Set(completedTutorials);
    if (newCompleted.has(id)) {
      newCompleted.delete(id);
    } else {
      newCompleted.add(id);
    }
    setCompletedTutorials(newCompleted);
  };

  const completionPercentage = Math.round((completedTutorials.size / tutorials.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg sm:text-2xl font-bold text-primary">
            <img src="/logo-icon.png" alt="Ologywood" className="h-6 sm:h-8 w-6 sm:w-8 rounded" />
            <span className="hidden sm:inline">Ologywood</span>
            <span className="sm:hidden">OW</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">
            Interactive Tutorials
          </h1>
          <p className="text-muted-foreground">
            Learn how to make the most of Ologywood with guided walkthroughs
          </p>
        </div>

        {/* Role Selection */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setSelectedRole("artist")}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              selectedRole === "artist"
                ? "bg-primary text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            🎤 For Artists
          </button>
          <button
            onClick={() => setSelectedRole("venue")}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              selectedRole === "venue"
                ? "bg-primary text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            🎪 For Venues
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Your Progress</h3>
            <span className="text-2xl font-bold text-primary">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {completedTutorials.size} of {tutorials.length} tutorials completed
          </p>
        </div>

        {/* Tutorials Grid */}
        <div className="space-y-4">
          {tutorials.map((tutorial) => (
            <div
              key={tutorial.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition"
            >
              <button
                onClick={() =>
                  setExpandedTutorial(expandedTutorial === tutorial.id ? null : tutorial.id)
                }
                className="w-full px-6 py-4 flex items-start justify-between gap-4 text-left hover:bg-gray-50 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-primary">{tutorial.icon}</div>
                    <h3 className="font-semibold text-foreground">{tutorial.title}</h3>
                    {completedTutorials.has(tutorial.id) && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-500">⏱ {tutorial.duration}</span>
                    <span className="text-xs text-gray-500">
                      {tutorial.steps.length} steps
                    </span>
                  </div>
                </div>
                <Play className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              </button>

              {expandedTutorial === tutorial.id && (
                <div className="px-6 py-4 border-t bg-gray-50">
                  <h4 className="font-semibold mb-4">Steps:</h4>
                  <ol className="space-y-3">
                    {tutorial.steps.map((step, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <button
                    onClick={() => toggleComplete(tutorial.id)}
                    className={`mt-6 px-4 py-2 rounded-lg font-semibold transition ${
                      completedTutorials.has(tutorial.id)
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-primary text-white hover:bg-primary/90"
                    }`}
                  >
                    {completedTutorials.has(tutorial.id)
                      ? "✓ Completed"
                      : "Mark as Completed"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-primary to-indigo-600 rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="mb-6">
            Complete these tutorials to unlock all features and make the most of Ologywood.
          </p>
          <Link href="/dashboard">
            <Button className="bg-white text-primary hover:bg-gray-100">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
