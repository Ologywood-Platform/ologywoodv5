import React from 'react';
import { Check, Clock, AlertCircle, DollarSign, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface BookingStatus {
  stage: 'pending' | 'confirmed' | 'completed' | 'paid' | 'cancelled';
  timestamp?: Date;
  notes?: string;
}

interface BookingStatusTimelineProps {
  status: BookingStatus;
  bookingDate?: Date;
  paymentDate?: Date;
  eventDate?: Date;
  onStatusChange?: (newStatus: BookingStatus) => void;
}

const TIMELINE_STAGES = [
  {
    id: 'pending',
    label: 'Pending',
    description: 'Booking request submitted',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-700',
    borderColor: 'border-yellow-300',
  },
  {
    id: 'confirmed',
    label: 'Confirmed',
    description: 'Artist accepted booking',
    icon: Check,
    color: 'bg-blue-100 text-blue-700',
    borderColor: 'border-blue-300',
  },
  {
    id: 'completed',
    label: 'Completed',
    description: 'Event performed',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-700',
    borderColor: 'border-green-300',
  },
  {
    id: 'paid',
    label: 'Paid',
    description: 'Payment processed',
    icon: DollarSign,
    color: 'bg-purple-100 text-purple-700',
    borderColor: 'border-purple-300',
  },
];

export function BookingStatusTimeline({
  status,
  bookingDate,
  paymentDate,
  eventDate,
  onStatusChange,
}: BookingStatusTimelineProps) {
  const currentStageIndex = TIMELINE_STAGES.findIndex(s => s.id === status.stage);

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Booking Status</h3>
        <p className="text-sm text-gray-600 mt-1">Track your booking progress</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-12 bottom-0 w-1 bg-gradient-to-b from-gray-300 to-gray-200" />

        {/* Timeline stages */}
        <div className="space-y-6">
          {TIMELINE_STAGES.map((stage, index) => {
            const isCompleted = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.id} className="relative pl-20">
                {/* Timeline dot */}
                <div
                  className={`absolute left-0 top-0 w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all ${
                    isCompleted
                      ? `${stage.color} ${stage.borderColor}`
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-offset-2 ring-blue-300' : ''}`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* Stage info */}
                <div className="pt-1">
                  <div className="flex items-center gap-3">
                    <h4 className={`font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                      {stage.label}
                    </h4>
                    {isCurrent && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        Current
                      </Badge>
                    )}
                    {isCompleted && index < currentStageIndex && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Complete
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                    {stage.description}
                  </p>

                  {/* Dates */}
                  {index === 0 && bookingDate && (
                    <p className="text-xs text-gray-500 mt-2">
                      📅 {formatDate(bookingDate)}
                    </p>
                  )}
                  {index === 2 && eventDate && (
                    <p className="text-xs text-gray-500 mt-2">
                      🎤 {formatDate(eventDate)}
                    </p>
                  )}
                  {index === 3 && paymentDate && (
                    <p className="text-xs text-gray-500 mt-2">
                      💳 {formatDate(paymentDate)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status notes */}
      {status.notes && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">{status.notes}</p>
        </div>
      )}

      {/* Action buttons */}
      {status.stage === 'pending' && onStatusChange && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={() =>
              onStatusChange({
                ...status,
                stage: 'confirmed',
                timestamp: new Date(),
              })
            }
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Accept Booking
          </button>
          <button
            onClick={() =>
              onStatusChange({
                ...status,
                stage: 'cancelled',
                timestamp: new Date(),
              })
            }
            className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
          >
            Decline
          </button>
        </div>
      )}

      {status.stage === 'confirmed' && onStatusChange && (
        <div className="mt-6">
          <button
            onClick={() =>
              onStatusChange({
                ...status,
                stage: 'completed',
                timestamp: new Date(),
              })
            }
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Mark as Completed
          </button>
        </div>
      )}

      {status.stage === 'completed' && onStatusChange && (
        <div className="mt-6">
          <button
            onClick={() =>
              onStatusChange({
                ...status,
                stage: 'paid',
                timestamp: new Date(),
              })
            }
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Confirm Payment
          </button>
        </div>
      )}

      {status.stage === 'paid' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-sm font-semibold text-green-800">✓ Booking Complete</p>
          <p className="text-xs text-green-700 mt-1">Thank you for using Ologywood!</p>
        </div>
      )}
    </div>
  );
}
