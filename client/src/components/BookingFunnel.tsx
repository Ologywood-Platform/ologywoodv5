import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, MessageSquare, CheckCircle, Award, TrendingUp, Loader2 } from 'lucide-react';

interface BookingFunnelProps {
  venueId: number;
}

export default function BookingFunnel({ venueId }: BookingFunnelProps) {
  const [days, setDays] = useState<'7' | '30' | '90'>('30');

  const { data, isLoading } = trpc.venue.getBookingFunnel.useQuery({ days }, {
    enabled: venueId > 0,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-gray-500">Loading funnel data...</span>
        </CardContent>
      </Card>
    );
  }

  const funnel = data || {
    profileViews: 0,
    bookingRequests: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    conversionRates: { viewToRequest: 0, requestToConfirmed: 0, overall: 0 },
  };

  // Calculate widths for the funnel visualization
  const maxValue = Math.max(funnel.profileViews, funnel.bookingRequests, funnel.confirmedBookings, 1);
  const getWidth = (value: number) => Math.max(20, (value / maxValue) * 100);

  const stages = [
    {
      label: 'Profile Views',
      value: funnel.profileViews,
      icon: Eye,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600',
    },
    {
      label: 'Booking Requests',
      value: funnel.bookingRequests,
      icon: MessageSquare,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600',
    },
    {
      label: 'Confirmed',
      value: funnel.confirmedBookings,
      icon: CheckCircle,
      color: 'bg-green-500',
      lightColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600',
    },
    {
      label: 'Completed',
      value: funnel.completedBookings,
      icon: Award,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-100 dark:bg-amber-900/30',
      textColor: 'text-amber-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Booking Funnel
            </CardTitle>
            <CardDescription className="mt-1">
              Track conversion from profile views to confirmed bookings
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['7', '30', '90'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                  days === d
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Funnel Visualization */}
        <div className="space-y-3 mb-6">
          {stages.map((stage, i) => (
            <div key={stage.label} className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${stage.lightColor}`}>
                <stage.icon className={`h-4 w-4 ${stage.textColor}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stage.label}</span>
                  <span className="text-sm font-bold">{stage.value}</span>
                </div>
                <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                    style={{ width: `${getWidth(stage.value)}%` }}
                  >
                    {stage.value > 0 && getWidth(stage.value) > 30 && (
                      <span className="text-xs font-medium text-white">{stage.value}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Conversion Rates */}
        <div className="border-t dark:border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Conversion Rates</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-lg font-bold text-blue-600">{funnel.conversionRates.viewToRequest}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Views → Requests</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-lg font-bold text-purple-600">{funnel.conversionRates.requestToConfirmed}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Requests → Confirmed</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-lg font-bold text-green-600">{funnel.conversionRates.overall}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Overall Conversion</p>
            </div>
          </div>
        </div>

        {/* Tips */}
        {funnel.profileViews > 0 && funnel.conversionRates.overall < 10 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <strong>Tip:</strong> Your overall conversion rate is {funnel.conversionRates.overall}%.
              {funnel.conversionRates.viewToRequest < 10
                ? ' Try adding more photos and detailed amenity info to convert more profile viewers into booking requests.'
                : ' Respond to booking requests quickly to improve your confirmation rate.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
