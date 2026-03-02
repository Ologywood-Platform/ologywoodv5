import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

interface EventRecurrenceSetupProps {
  eventId: number;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  existingRecurrence?: {
    frequency: string;
    daysOfWeek?: string[];
    endDate?: string;
  };
}

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly (every 2 weeks)' },
  { value: 'monthly', label: 'Monthly' },
];

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export function EventRecurrenceSetup({
  eventId,
  onSubmit,
  isLoading = false,
  existingRecurrence,
}: EventRecurrenceSetupProps) {
  const [frequency, setFrequency] = useState(existingRecurrence?.frequency || '');
  const [selectedDays, setSelectedDays] = useState<string[]>(
    existingRecurrence?.daysOfWeek || []
  );
  const [endDate, setEndDate] = useState(
    existingRecurrence?.endDate
      ? new Date(existingRecurrence.endDate).toISOString().split('T')[0]
      : ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!frequency) {
      newErrors.frequency = 'Please select a frequency';
    }

    if ((frequency === 'weekly' || frequency === 'biweekly') && selectedDays.length === 0) {
      newErrors.daysOfWeek = 'Please select at least one day';
    }

    if (endDate) {
      const end = new Date(endDate);
      if (end < new Date()) {
        newErrors.endDate = 'End date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors');
      return;
    }

    try {
      await onSubmit({
        frequency,
        daysOfWeek: (frequency === 'weekly' || frequency === 'biweekly') ? selectedDays : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });
      toast.success('Recurrence set successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to set recurrence');
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Up Recurrence</CardTitle>
        <CardDescription>
          Make this event repeat on a schedule
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Frequency Selection */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency *</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className={errors.frequency ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select how often this event repeats" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map(freq => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.frequency && (
              <p className="text-sm text-red-500">{errors.frequency}</p>
            )}
          </div>

          {/* Days of Week (for weekly/biweekly) */}
          {(frequency === 'weekly' || frequency === 'biweekly') && (
            <div className="space-y-3">
              <Label>Days of Week *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.value}
                      checked={selectedDays.includes(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                    />
                    <Label htmlFor={day.value} className="font-normal cursor-pointer">
                      {day.label.slice(0, 3)}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.daysOfWeek && (
                <p className="text-sm text-red-500">{errors.daysOfWeek}</p>
              )}
            </div>
          )}

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date (Optional)</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={errors.endDate ? 'border-red-500' : ''}
            />
            {errors.endDate && (
              <p className="text-sm text-red-500">{errors.endDate}</p>
            )}
            <p className="text-xs text-slate-500">
              Leave empty to repeat indefinitely
            </p>
          </div>

          {/* Summary */}
          {frequency && (
            <div className="bg-slate-50 p-3 rounded-lg text-sm">
              <p className="font-medium text-slate-900">Summary:</p>
              <p className="text-slate-600 mt-1">
                This event will repeat{' '}
                <span className="font-semibold">
                  {FREQUENCIES.find(f => f.value === frequency)?.label.toLowerCase()}
                </span>
                {(frequency === 'weekly' || frequency === 'biweekly') && selectedDays.length > 0 && (
                  <span>
                    {' '}
                    on{' '}
                    <span className="font-semibold">
                      {selectedDays
                        .map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label)
                        .join(', ')}
                    </span>
                  </span>
                )}
                {endDate && (
                  <span>
                    {' '}
                    until{' '}
                    <span className="font-semibold">
                      {new Date(endDate).toLocaleDateString()}
                    </span>
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Set Recurrence
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
