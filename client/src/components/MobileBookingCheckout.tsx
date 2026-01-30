import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface BookingStep {
  id: number;
  title: string;
  description: string;
}

interface MobileBookingCheckoutProps {
  onComplete?: (bookingData: any) => void;
  onCancel?: () => void;
}

export function MobileBookingCheckout({ onComplete, onCancel }: MobileBookingCheckoutProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    artistId: '',
    eventDate: '',
    eventTime: '',
    eventLocation: '',
    eventType: '',
    budget: '',
    notes: '',
  });

  const steps: BookingStep[] = [
    { id: 1, title: 'Artist', description: 'Select an artist' },
    { id: 2, title: 'Event Details', description: 'Date, time & location' },
    { id: 3, title: 'Budget', description: 'Set your budget' },
    { id: 4, title: 'Review', description: 'Confirm booking' },
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(bookingData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Select an Artist</h3>
            <p className="text-sm text-gray-600">Choose from featured artists or search</p>
            <select
              name="artistId"
              value={bookingData.artistId}
              onChange={handleInputChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-base"
            >
              <option value="">Select an artist...</option>
              <option value="1">DJ Luna</option>
              <option value="2">The Groove Band</option>
              <option value="3">Sarah's String Quartet</option>
            </select>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
              <input
                type="date"
                name="eventDate"
                value={bookingData.eventDate}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Time</label>
              <input
                type="time"
                name="eventTime"
                value={bookingData.eventTime}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                name="eventLocation"
                placeholder="Enter event location"
                value={bookingData.eventLocation}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-base"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Budget</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                name="eventType"
                value={bookingData.eventType}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-base"
              >
                <option value="">Select event type...</option>
                <option value="wedding">Wedding</option>
                <option value="corporate">Corporate Event</option>
                <option value="private">Private Party</option>
                <option value="festival">Festival</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget ($)</label>
              <input
                type="number"
                name="budget"
                placeholder="Enter your budget"
                value={bookingData.budget}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
              <textarea
                name="notes"
                placeholder="Any special requests or notes..."
                value={bookingData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-base"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Review Your Booking</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Artist:</span>
                <span className="font-semibold text-gray-900">{bookingData.artistId || 'Not selected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold text-gray-900">{bookingData.eventDate || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-semibold text-gray-900">{bookingData.eventTime || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-semibold text-gray-900">{bookingData.eventLocation || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Budget:</span>
                <span className="font-semibold text-gray-900">${bookingData.budget || '0'}</span>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              By confirming, you agree to our booking terms and conditions.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 md:hidden">
      <div className="w-full bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Book an Artist</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex gap-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  step.id <= currentStep ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Indicator */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Step {currentStep} of {steps.length}</p>
              <p className="text-sm font-semibold text-gray-900">{steps[currentStep - 1].title}</p>
            </div>
            <div className="text-2xl font-bold text-purple-600">{currentStep}/{steps.length}</div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4 flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>

          {currentStep === steps.length ? (
            <button
              onClick={handleComplete}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              <Check className="h-5 w-5" />
              Complete
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
