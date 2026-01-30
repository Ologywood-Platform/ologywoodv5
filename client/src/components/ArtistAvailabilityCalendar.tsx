import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface AvailabilityWindow {
  id: string;
  startDate: Date;
  endDate: Date;
  status: 'available' | 'blocked' | 'tentative';
  notes?: string;
}

interface ArtistAvailabilityCalendarProps {
  artistId?: number;
  availabilityWindows?: AvailabilityWindow[];
  onUpdate?: (windows: AvailabilityWindow[]) => void;
  isEditable?: boolean;
}

export function ArtistAvailabilityCalendar({
  artistId,
  availabilityWindows = [],
  onUpdate,
  isEditable = false,
}: ArtistAvailabilityCalendarProps) {
  const [windows, setWindows] = useState<AvailabilityWindow[]>(availabilityWindows);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    status: 'available' as const,
    notes: '',
  });

  const handleAddWindow = () => {
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (startDate > endDate) {
      toast.error('Start date must be before end date');
      return;
    }

    const newWindow: AvailabilityWindow = {
      id: Date.now().toString(),
      startDate,
      endDate,
      status: formData.status,
      notes: formData.notes,
    };

    const updatedWindows = [...windows, newWindow];
    setWindows(updatedWindows);
    onUpdate?.(updatedWindows);

    setFormData({
      startDate: '',
      endDate: '',
      status: 'available',
      notes: '',
    });
    setShowForm(false);

    toast.success('Availability window added');
  };

  const handleRemoveWindow = (id: string) => {
    const updatedWindows = windows.filter(w => w.id !== id);
    setWindows(updatedWindows);
    onUpdate?.(updatedWindows);
    toast.success('Availability window removed');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'tentative':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return '✓ Available';
      case 'blocked':
        return '✗ Blocked';
      case 'tentative':
        return '? Tentative';
      default:
        return status;
    }
  };

  const formatDateRange = (start: Date, end: Date) => {
    const startStr = new Date(start).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const endStr = new Date(end).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${startStr} - ${endStr}`;
  };

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-purple-900">Availability Calendar</CardTitle>
          </div>
          {isEditable && (
            <Button
              onClick={() => setShowForm(!showForm)}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Window
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Add Window Form */}
        {showForm && isEditable && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'available' | 'blocked' | 'tentative',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="available">Available</option>
                <option value="blocked">Blocked</option>
                <option value="tentative">Tentative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g., Tour dates, festival, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddWindow}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Add
              </Button>
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Availability Windows List */}
        {windows.length > 0 ? (
          <div className="space-y-3">
            {windows.map(window => (
              <div
                key={window.id}
                className={`p-4 border rounded-lg ${getStatusColor(window.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="font-semibold">
                        {formatDateRange(window.startDate, window.endDate)}
                      </span>
                      <Badge variant="outline" className={getStatusColor(window.status)}>
                        {getStatusLabel(window.status)}
                      </Badge>
                    </div>
                    {window.notes && (
                      <p className="text-sm opacity-75 mt-1">{window.notes}</p>
                    )}
                  </div>
                  {isEditable && (
                    <button
                      onClick={() => handleRemoveWindow(window.id)}
                      className="ml-2 p-1 hover:bg-black/10 rounded transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {isEditable
                ? 'No availability windows set. Add one to get started!'
                : 'No availability information available'}
            </p>
          </div>
        )}

        {/* Quick Stats */}
        {windows.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-gray-600">Available</p>
              <p className="text-lg font-bold text-green-600">
                {windows.filter(w => w.status === 'available').length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Blocked</p>
              <p className="text-lg font-bold text-red-600">
                {windows.filter(w => w.status === 'blocked').length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Tentative</p>
              <p className="text-lg font-bold text-yellow-600">
                {windows.filter(w => w.status === 'tentative').length}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
