import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Calendar, DollarSign, Star, TrendingUp } from 'lucide-react';

interface AnalyticsCardsProps {
  monthlyBookings: number;
  totalEarnings: number;
  averageRating: number;
  reviewCount: number;
  /** Optional: show a trend indicator for monthly bookings */
  previousMonthBookings?: number;
}

export default function DashboardAnalyticsCards({
  monthlyBookings,
  totalEarnings,
  averageRating,
  reviewCount,
  previousMonthBookings,
}: AnalyticsCardsProps) {
  // Calculate trend
  const trend = previousMonthBookings !== undefined && previousMonthBookings > 0
    ? Math.round(((monthlyBookings - previousMonthBookings) / previousMonthBookings) * 100)
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Monthly Bookings */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-slate-900 dark:text-gray-100">
                    {monthlyBookings}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">This Month</p>
                </div>
                {trend !== null && (
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                    {Math.abs(trend)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>Number of bookings created this month</TooltipContent>
      </Tooltip>

      {/* Total Earnings */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-gray-100">
                    ${totalEarnings > 0 ? totalEarnings.toLocaleString() : '0'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Total Earnings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>Total revenue from confirmed and completed bookings</TooltipContent>
      </Tooltip>

      {/* Average Review Score */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Star className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-gray-100">
                    {averageRating > 0 ? averageRating.toFixed(1) : '—'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {reviewCount > 0 ? `${reviewCount} review${reviewCount !== 1 ? 's' : ''}` : 'No reviews yet'}
                  </p>
                </div>
                {averageRating > 0 && (
                  <div className="flex gap-0.5 ml-auto">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= Math.round(averageRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          {averageRating > 0
            ? `Average rating from ${reviewCount} review${reviewCount !== 1 ? 's' : ''}`
            : 'Complete bookings to start receiving reviews'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
