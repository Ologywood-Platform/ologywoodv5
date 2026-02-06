import React, { useState } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

export const BookingAnalyticsExport: React.FC = () => {
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isExporting, setIsExporting] = useState(false);

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading } =
    trpc.bookingAnalyticsExport.getAnalytics.useQuery(
      {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
      { enabled: !!startDate && !!endDate }
    );

  // Export mutations
  const { mutate: exportCSV } = trpc.bookingAnalyticsExport.exportCSV.useMutation({
    onSuccess: (data) => {
      // Create blob and download
      const element = document.createElement('a');
      const file = new Blob([data.data], { type: 'text/csv' });
      element.href = URL.createObjectURL(file);
      element.download = data.filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setIsExporting(false);
    },
  });

  const { mutate: exportPDF } = trpc.bookingAnalyticsExport.exportPDF.useMutation({
    onSuccess: (data) => {
      // Create blob and download
      const element = document.createElement('a');
      const file = new Blob([data.data], { type: 'text/html' });
      element.href = URL.createObjectURL(file);
      element.download = data.filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setIsExporting(false);
    },
  });

  const handleExportCSV = () => {
    setIsExporting(true);
    exportCSV({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    exportPDF({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Export Booking Analytics</h3>

      {/* Date Range Selection */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Analytics Summary */}
      {analyticsData && !analyticsLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Bookings</p>
            <p className="text-2xl font-bold text-blue-600">{analyticsData.totalBookings}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">{analyticsData.confirmedBookings}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-purple-600">{analyticsData.completedBookings}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-yellow-600">
              ${analyticsData.totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Export Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleExportCSV}
          disabled={isExporting || analyticsLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export as CSV'}
        </Button>
        <Button
          onClick={handleExportPDF}
          disabled={isExporting || analyticsLoading}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
        >
          <FileText className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export as PDF'}
        </Button>
      </div>

      {/* Booking List */}
      {analyticsData && analyticsData.bookings.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-gray-900 mb-3">Recent Bookings</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Venue</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Date</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Status</th>
                  <th className="px-4 py-2 text-right text-gray-700 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2">{booking.venueName}</td>
                    <td className="px-4 py-2">
                      {new Date(booking.eventDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          booking.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {booking.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      ${booking.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {analyticsLoading && (
        <div className="text-center py-4 text-gray-600">Loading analytics...</div>
      )}
    </div>
  );
};

export default BookingAnalyticsExport;
