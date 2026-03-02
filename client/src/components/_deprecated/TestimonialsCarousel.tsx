import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  image: string;
  quote: string;
  rating: number;
  category: 'artist' | 'venue';
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    role: 'Jazz Performer',
    company: 'Jazz Collective',
    image: '🎵',
    quote:
      'Ologywood has transformed how I book venues. I went from struggling to find gigs to having 3-4 bookings per month. The platform is intuitive and the venues are responsive.',
    rating: 5,
    category: 'artist',
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    role: 'Venue Manager',
    company: 'The Blue Room',
    image: '🎭',
    quote:
      'Finding quality artists used to be a nightmare. With Ologywood, I can browse verified performers, check their availability, and book within minutes. Our events are now consistently sold out.',
    rating: 5,
    category: 'venue',
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    role: 'DJ & Producer',
    company: 'Electric Dreams',
    image: '🎧',
    quote:
      'The booking platform is amazing, but what really impressed me is the payment system. I get paid within 48 hours, and the fees are transparent. No surprises.',
    rating: 5,
    category: 'artist',
  },
  {
    id: '4',
    name: 'David Chen',
    role: 'Event Coordinator',
    company: 'Downtown Events',
    image: '🎪',
    quote:
      'Ologywood streamlined our entire booking process. We save hours every week on artist coordination. The customer support team is also incredibly helpful.',
    rating: 5,
    category: 'venue',
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    role: 'Live Music Performer',
    company: 'Acoustic Hearts',
    image: '🎸',
    quote:
      'As an independent artist, I was skeptical about booking platforms. But Ologywood is different. The community is supportive, and I\'ve made genuine connections with venue owners.',
    rating: 5,
    category: 'artist',
  },
];

export const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setAutoPlay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setAutoPlay(false);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 my-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Success Stories</h2>
          <p className="text-gray-600">Hear from artists and venues who've transformed their business with Ologywood</p>
        </div>

        {/* Testimonial Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 min-h-96 flex flex-col justify-between">
          {/* Quote */}
          <div>
            <div className="flex gap-1 mb-4">
              {[...Array(currentTestimonial.rating)].map((_, i) => (
                <Star key={i} size={20} className="fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-xl text-gray-800 italic mb-6">"{currentTestimonial.quote}"</p>
          </div>

          {/* Author */}
          <div className="flex items-center gap-4">
            <div className="text-4xl">{currentTestimonial.image}</div>
            <div>
              <p className="font-semibold text-gray-900">{currentTestimonial.name}</p>
              <p className="text-sm text-gray-600">{currentTestimonial.role}</p>
              <p className="text-xs text-gray-500">{currentTestimonial.company}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={goToPrevious}
            className="bg-white hover:bg-gray-100 text-gray-900 rounded-full p-3 shadow transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Indicators */}
          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setAutoPlay(false);
                }}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-blue-600 w-8' : 'bg-gray-300 w-2'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={goToNext}
            className="bg-white hover:bg-gray-100 text-gray-900 rounded-full p-3 shadow transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Counter */}
        <p className="text-center text-sm text-gray-600 mt-4">
          {currentIndex + 1} of {testimonials.length}
        </p>
      </div>
    </div>
  );
};

export default TestimonialsCarousel;
