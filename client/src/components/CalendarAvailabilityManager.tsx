import React, { useState } from 'react';
import { Calendar, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

interface AvailabilityWindow {
  id: string;
  startDate: Date;
  endDate: Date;
  isAvailable: boolean;
  notes?: string;
}

interface CalendarAvailabilityManagerProps {
  onAddAvailability: (startDate: Date, endDate: Date, notes?: string) => void;
  onBlockTime: (startDate: Date, endDate: Date, reason?: string) => void;
  onDeleteWindow: (id: string) => void;
  availabilityWindows: AvailabilityWindow[];
}

export const CalendarAvailabilityManager: React.FC<CalendarAvailabilityManagerProps> = ({
  onAddAvailability,
  onBlockTime,
  onDeleteWindow,
  availabilityWindows,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    notes: '',
    type: 'available',
  });

  const handleAddWindow = () => {
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (formData.type === 'available') {
        onAddAvailability(startDate, endDate, formData.notes);
      } else {
        onBlockTime(startDate, endDate, formData.notes);
      }

      setFormData({ startDate: '', endDate: '', notes: '', type: 'available' });
      setShowAddForm(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar size={32} className="text-blue-600" />
          Availability Management
        </h1>
        <p className="text-gray-600 mt-2">Manage your availability and block time when needed</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
        <div>
          <p className="text-sm text-blue-900 font-medium">Calendar Integration</p>
          <p className="text-sm text-blue-800 mt-1">
            Connect your Google Calendar or Outlook to automatically sync your availability.
          </p>
        </div>
      </div>

      {/* Add Availability Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Availability or Block Time
        </button>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">
            {formData.type === 'available' ? 'Add Availability' : 'Block Time'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available for Booking</option>
                <option value="blocked">Blocked Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g., Tour, vacation, maintenance"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAddWindow}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Save
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Availability Windows List */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Availability</h2>

        {availabilityWindows.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Calendar className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-600">No availability windows set yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availabilityWindows.map((window) => (
              <div
                key={window.id}
                className={`border rounded-lg p-4 flex justify-between items-start ${
                  window.isAvailable
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {window.isAvailable ? (
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                  ) : (
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
                  )}
                  <div>
                    <p className={`font-bold ${window.isAvailable ? 'text-green-900' : 'text-red-900'}`}>
                      {window.isAvailable ? 'Available' : 'Blocked'}
                    </p>
                    <p className={`text-sm ${window.isAvailable ? 'text-green-800' : 'text-red-800'}`}>
                      {new Date(window.startDate).toLocaleDateString()} -{' '}
                      {new Date(window.endDate).toLocaleDateString()}
                    </p>
                    {window.notes && (
                      <p className={`text-sm mt-1 ${window.isAvailable ? 'text-green-700' : 'text-red-700'}`}>
                        {window.notes}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteWindow(window.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendar Integration */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h2 className="font-bold text-gray-900 mb-4">Sync with Calendar</h2>
        <div className="space-y-3">
          <button className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700">
            Connect Google Calendar
          </button>
          <button className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700">
            Connect Outlook Calendar
          </button>
          <button className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700">
            Import iCal File
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-900">
          <strong>💡 Tip:</strong> Set your availability in advance to help venues find you. Block time for
          tours, vacations, or maintenance work.
        </p>
      </div>
    </div>
  );
};

export default CalendarAvailabilityManager;
