import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Camera, Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadGuideProps {
  guideType?: 'profile' | 'performance' | 'promotional';
  onClose?: () => void;
  isModal?: boolean;
}

export function ImageUploadGuide({
  guideType = 'profile',
  onClose,
  isModal = false
}: ImageUploadGuideProps) {
  const [activeTab, setActiveTab] = useState<'tips' | 'examples' | 'specs'>('tips');

  const guides = {
    profile: {
      title: 'Profile Photo Guidelines',
      description: 'Your profile photo is the first impression potential bookers have of you. Make it count!',
      tips: [
        { icon: '📸', text: 'Use a clear, professional headshot' },
        { icon: '💡', text: 'Ensure good lighting - natural light works best' },
        { icon: '🎨', text: 'Keep the background simple and uncluttered' },
        { icon: '👕', text: 'Wear clothing that represents your style/genre' },
        { icon: '😊', text: 'Make sure your face is clearly visible' },
        { icon: '✨', text: 'Avoid filters or heavy editing' },
        { icon: '📐', text: 'Use a high-resolution image (at least 400x400px)' },
        { icon: '👀', text: 'Smile naturally and make eye contact with camera' }
      ],
      bestPractices: [
        'Square format (1:1 aspect ratio) works best',
        'Center your face in the frame',
        'Leave some headroom above your head',
        'Avoid busy backgrounds that distract from you',
        'Update your photo at least annually',
        'Use consistent branding across platforms'
      ],
      examples: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
      ]
    },
    performance: {
      title: 'Performance Photo Guidelines',
      description: 'Showcase your talent with high-quality performance photos that capture the energy of your act.',
      tips: [
        { icon: '🎭', text: 'Capture action shots during performances' },
        { icon: '👥', text: 'Include audience interaction if possible' },
        { icon: '🎸', text: 'Show your equipment/instruments in action' },
        { icon: '💡', text: 'Use professional lighting when available' },
        { icon: '🎬', text: 'Include variety - solo shots, band shots, crowd shots' },
        { icon: '🌟', text: 'Avoid photos that are too dark or blurry' },
        { icon: '📍', text: 'Include photos from different venues/events' },
        { icon: '✨', text: 'Show your personality and stage presence' }
      ],
      bestPractices: [
        'Landscape orientation (16:9) works well for gallery',
        'Include 3-5 different performance photos',
        'Update gallery quarterly with new content',
        'Include photos from different event types',
        'Get permission from venues before posting photos',
        'Maintain consistent color grading across photos'
      ],
      examples: [
        'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=400&fit=crop'
      ]
    },
    promotional: {
      title: 'Promotional Photo Guidelines',
      description: 'Create eye-catching promotional photos that attract bookers and fans.',
      tips: [
        { icon: '📸', text: 'Use professional photography when possible' },
        { icon: '🏷️', text: 'Include your artist name or logo' },
        { icon: '🎨', text: 'Use consistent branding and colors' },
        { icon: '⭐', text: 'Showcase your unique style/aesthetic' },
        { icon: '📝', text: 'Include text overlays sparingly' },
        { icon: '🔤', text: 'Ensure text is readable and not cluttered' },
        { icon: '⚡', text: 'Use high contrast for visibility' },
        { icon: '🎯', text: 'Include call-to-action elements' }
      ],
      bestPractices: [
        'Use consistent dimensions across all promotional photos',
        'Keep file sizes optimized for web (under 500KB)',
        'Include your contact information or booking link',
        'Use brand colors consistently',
        'Test visibility on mobile devices',
        'Include social media handles'
      ],
      examples: [
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=600&h=400&fit=crop'
      ]
    }
  };

  const guide = guides[guideType];

  const specs = {
    profile: {
      format: 'JPEG, PNG, or WebP',
      dimensions: '400x400px minimum (square)',
      aspectRatio: '1:1',
      fileSize: 'Under 5MB',
      colorSpace: 'sRGB'
    },
    performance: {
      format: 'JPEG, PNG, or WebP',
      dimensions: '1280x720px minimum',
      aspectRatio: '16:9',
      fileSize: 'Under 5MB',
      colorSpace: 'sRGB'
    },
    promotional: {
      format: 'JPEG, PNG, or WebP',
      dimensions: '1200x630px minimum',
      aspectRatio: '16:9 or 1:1',
      fileSize: 'Under 5MB',
      colorSpace: 'sRGB'
    }
  };

  const currentSpecs = specs[guideType];

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Camera className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{guide.title}</h2>
            <p className="text-gray-600 mt-1">{guide.description}</p>
          </div>
        </div>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['tips', 'examples', 'specs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === tab
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tips Tab */}
      {activeTab === 'tips' && (
        <div className="space-y-6">
          {/* Quick Tips */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Quick Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {guide.tips.map((tip, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl flex-shrink-0">{tip.icon}</span>
                  <p className="text-sm text-gray-700">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Best Practices */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Best Practices</h3>
            <div className="space-y-2">
              {guide.bestPractices.map((practice, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">{practice}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Examples Tab */}
      {activeTab === 'examples' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Example Photos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {guide.examples.map((url, idx) => (
              <div
                key={idx}
                className="rounded-lg overflow-hidden bg-gray-100 aspect-video"
              >
                <img
                  src={url}
                  alt={`Example ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specs Tab */}
      {activeTab === 'specs' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Technical Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(currentSpecs).map(([key, value]) => (
              <div key={key} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 capitalize mb-1">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-lg font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* File Format Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">File Format Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>JPEG:</strong> Best for photos, smaller file size</li>
                  <li>• <strong>PNG:</strong> Best for images with transparency</li>
                  <li>• <strong>WebP:</strong> Modern format, best compression</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-amber-900 mb-1">Important</h4>
          <p className="text-sm text-amber-800">
            Make sure you have the right to use and distribute any photos you upload. 
            Respect copyright and get permission from photographers and other people in photos.
          </p>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
