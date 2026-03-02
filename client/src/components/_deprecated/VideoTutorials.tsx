import React, { useState } from 'react';
import { Play, Clock, Eye } from 'lucide-react';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  views: number;
  videoUrl: string;
  thumbnail: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const TUTORIALS: Tutorial[] = [
  {
    id: 'booking-101',
    title: 'Creating Your First Booking',
    description: 'Learn how to search for artists, review their profiles, and create a booking request in just 5 minutes.',
    duration: '5:32',
    views: 1240,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f70d504f0?w=300&h=200&fit=crop',
    category: 'Getting Started',
    difficulty: 'beginner'
  },
  {
    id: 'rider-management',
    title: 'Understanding & Managing Riders',
    description: 'Discover how to create, customize, and negotiate rider requirements for your bookings.',
    duration: '7:45',
    views: 856,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop',
    category: 'Contracts',
    difficulty: 'intermediate'
  },
  {
    id: 'payment-guide',
    title: 'Payment & Deposit Management',
    description: 'Master the payment process including deposits, full payments, and refund handling.',
    duration: '6:18',
    views: 723,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=300&h=200&fit=crop',
    category: 'Payments',
    difficulty: 'beginner'
  }
];

export function VideoTutorials() {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...new Set(TUTORIALS.map(t => t.category))];
  const filteredTutorials = selectedCategory === 'All' 
    ? TUTORIALS 
    : TUTORIALS.filter(t => t.category === selectedCategory);

  return (
    <div className="w-full">
      {/* Video Player Modal */}
      {selectedTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedTutorial.title}</h2>
              <button
                onClick={() => setSelectedTutorial(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="aspect-video bg-black rounded-lg mb-6 overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={selectedTutorial.videoUrl}
                  title={selectedTutorial.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <div className="space-y-4">
                <p className="text-gray-700">{selectedTutorial.description}</p>
                <div className="flex gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedTutorial.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {selectedTutorial.views.toLocaleString()} views
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {selectedTutorial.difficulty}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial List */}
      <div className="space-y-6">
        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Tutorials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutorials.map(tutorial => (
            <div
              key={tutorial.id}
              className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedTutorial(tutorial)}
            >
              <div className="relative overflow-hidden bg-gray-200 h-40">
                <img
                  src={tutorial.thumbnail}
                  alt={tutorial.title}
                  className="w-full h-full object-cover hover:scale-105 transition"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition">
                  <Play className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm mb-2 line-clamp-2">{tutorial.title}</h3>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{tutorial.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {tutorial.duration}
                  </div>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {tutorial.difficulty}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTutorials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No tutorials found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
