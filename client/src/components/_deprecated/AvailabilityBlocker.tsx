import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Calendar, Plus, Trash2, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

interface AvailabilityBlock {
  id: number;
  startDate: string;
  endDate: string;
  reason: string;
  recurring?: {
    pattern: 'daily' | 'weekly' | 'monthly';
    endDate?: string;
    daysOfWeek?: number[];
  };
}

interface AvailabilityBlockerProps {
  artistId: number;
  onBlockCreated?: (block: AvailabilityBlock) => void;
}

export function AvailabilityBlocker({ artistId, onBlockCreated }: AvailabilityBlockerProps) {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleToggleDay = (dayIndex: number) => {
    setSelectedDays(prev =>
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleCreateBlock = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      const newBlock: AvailabilityBlock = {
        id: Math.random(),
        startDate,
        endDate,
        reason,
        recurring: recurring
          ? {
              pattern: recurringPattern,
              endDate: recurringEndDate || undefined,
              daysOfWeek: recurringPattern === 'weekly' ? selectedDays : undefined,
            }
          : undefined,
      };

      setBlocks([...blocks, newBlock]);
      setStartDate('');
      setEndDate('');
      setReason('');
      setRecurring(false);
      setRecurringPattern('weekly');
      setRecurringEndDate('');
      setSelectedDays([]);
      setShowForm(false);
      toast.success('Availability block created');
      onBlockCreated?.(newBlock);
    } catch (error) {
      toast.error('Failed to create availability block');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlock = (blockId: number) => {
    setBlocks(blocks.filter(b => b.id !== blockId));
    toast.success('Availability block deleted');
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  const getRecurringLabel = (block: AvailabilityBlock) => {
    if (!block.recurring) return null;

    const pattern = block.recurring.pattern;
    if (pattern === 'weekly' && block.recurring.daysOfWeek) {
      const days = block.recurring.daysOfWeek.map(d => daysOfWeek[d].slice(0, 3)).join(', ');
      return `Every ${days}`;
    }

    return `Every ${pattern}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Availability Blocks
        </h3>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Block
          </Button>
        )}
      </div>

      {/* Create Block Form */}
      {showForm && (
        <Card className="p-6 border-blue-200 bg-blue-50">
          <h4 className="font-semibold mb-4">Block Your Availability</h4>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Reason */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Reason</label>
            <Textarea
              placeholder="e.g., Personal time, Tour, Rest days..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          {/* Recurring Option */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
              />
              <span className="text-sm font-medium">Make this recurring</span>
            </label>
          </div>

          {/* Recurring Settings */}
          {recurring && (
            <div className="bg-white p-4 rounded-lg mb-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Pattern</label>
                <select
                  value={recurringPattern}
                  onChange={(e) => setRecurringPattern(e.target.value as any)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {recurringPattern === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Days of Week</label>
                  <div className="grid grid-cols-4 gap-2">
                    {daysOfWeek.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => handleToggleDay(index)}
                        className={`p-2 rounded text-sm font-medium transition ${
                          selectedDays.includes(index)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Recurring Until (Optional)</label>
                <Input
                  type="date"
                  value={recurringEndDate}
                  onChange={(e) => setRecurringEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleCreateBlock}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Block'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Blocks List */}
      <div className="space-y-3">
        {blocks.length > 0 ? (
          blocks.map(block => (
            <Card key={block.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold mb-1">{block.reason}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    {formatDateRange(block.startDate, block.endDate)}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {block.recurring && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <RotateCw className="h-3 w-3" />
                        {getRecurringLabel(block)}
                      </Badge>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBlock(block.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No availability blocks. You're available for all bookings.
          </p>
        )}
      </div>

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> When you create availability blocks, venues won't be able to send booking requests for those dates. Blocked dates will also sync with your connected calendars.
        </p>
      </Card>
    </div>
  );
}
