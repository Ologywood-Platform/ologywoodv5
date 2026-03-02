import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Calendar, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InstantBookingProps {
  artistId: number;
  artistName: string;
  standardRate?: number;
  availableDates?: Date[];
  onBook?: (bookingData: InstantBookingData) => void;
}

export interface InstantBookingData {
  artistId: number;
  eventDate: Date;
  rate: number;
  type: 'instant';
  timestamp: Date;
}

export function InstantBooking({
  artistId,
  artistName,
  standardRate = 500,
  availableDates = [],
  onBook,
}: InstantBookingProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  const handleInstantBook = async () => {
    if (!selectedDate) {
      toast.error('Please select an event date');
      return;
    }

    setIsLoading(true);

    // Simulate booking
    setTimeout(() => {
      const bookingData: InstantBookingData = {
        artistId,
        eventDate: selectedDate,
        rate: standardRate,
        type: 'instant',
        timestamp: new Date(),
      };

      onBook?.(bookingData);
      setIsBooked(true);
      setIsLoading(false);

      toast.success(`Booking confirmed with ${artistName}!`);
    }, 1500);
  };

  if (isBooked) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900">Booking Confirmed!</h3>
            <p className="text-sm text-green-700 mt-2">
              Your instant booking with {artistName} is confirmed.
            </p>
            <p className="text-xs text-green-600 mt-4">
              Event Date: {selectedDate?.toLocaleDateString()}
            </p>
            <p className="text-xs text-green-600">Rate: ${standardRate}</p>
            <Button
              onClick={() => {
                setIsBooked(false);
                setSelectedDate(null);
              }}
              variant="outline"
              className="mt-4"
            >
              Book Another Event
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-900">Instant Booking</CardTitle>
          <Badge className="ml-auto bg-blue-600">Fast & Easy</Badge>
        </div>
        <p className="text-sm text-blue-700 mt-2">
          Book {artistName} instantly with standard rates—no negotiation needed!
        </p>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Standard Rate Display */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Standard Rate</span>
          </div>
          <span className="text-lg font-bold text-gray-900">${standardRate}</span>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Select Event Date
          </label>
          <input
            type="date"
            value={selectedDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            <Clock className="h-3 w-3 inline mr-1" />
            Booking is confirmed immediately
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-semibold text-blue-900">Why Instant Booking?</p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>✓ No waiting for artist response</li>
            <li>✓ Fixed transparent pricing</li>
            <li>✓ Instant confirmation</li>
            <li>✓ Perfect for last-minute events</li>
          </ul>
        </div>

        {/* Book Button */}
        <Button
          onClick={handleInstantBook}
          disabled={!selectedDate || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Confirming...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Book Instantly
            </>
          )}
        </Button>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center">
          By booking, you agree to our standard terms and conditions.
          <br />
          Full refund available up to 48 hours before event.
        </p>
      </CardContent>
    </Card>
  );
}
