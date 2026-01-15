import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';

interface SupportTicketFormProps {
  onSubmit?: (data: TicketFormData) => Promise<void>;
  onCancel?: () => void;
}

export interface TicketFormData {
  subject: string;
  description: string;
  category: 'rider' | 'booking' | 'payment' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  attachmentUrl?: string;
}

const CATEGORIES = [
  { value: 'rider', label: 'Rider Template Issue', icon: '📋' },
  { value: 'booking', label: 'Booking Problem', icon: '📅' },
  { value: 'payment', label: 'Payment Issue', icon: '💳' },
  { value: 'technical', label: 'Technical Bug', icon: '🐛' },
  { value: 'other', label: 'Other', icon: '❓' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low - Can wait', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium - Normal priority', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High - Needs attention', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent - Event affected', color: 'bg-red-100 text-red-800' },
];

export function SupportTicketForm({ onSubmit, onCancel }: SupportTicketFormProps) {
  const [formData, setFormData] = useState<TicketFormData>({
    subject: '',
    description: '',
    category: 'other',
    priority: 'medium',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: keyof TicketFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      }

      setSubmitted(true);
      toast.success('Support ticket created successfully!');

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          subject: '',
          description: '',
          category: 'other',
          priority: 'medium',
        });
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to create support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-8 pb-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ticket Created Successfully!</h3>
          <p className="text-muted-foreground mb-4">
            We've received your support request. Our team will respond within 24 hours.
          </p>
          <p className="text-sm text-muted-foreground">
            Ticket ID: <span className="font-mono font-semibold">#TSK{Math.floor(Math.random() * 100000)}</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Support Ticket</CardTitle>
        <CardDescription>
          Describe your issue and we'll help you as soon as possible
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Category *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleChange('category', cat.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.category === cat.value
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-sm font-medium">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Brief description of your issue"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.subject.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Please provide detailed information about your issue. Include:
- What were you trying to do?
- What happened instead?
- When did this occur?
- Any error messages?"
              rows={6}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.description.length}/2000 characters
            </p>
          </div>

          {/* Priority */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Priority</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITIES.map(pri => (
                <button
                  key={pri.value}
                  type="button"
                  onClick={() => handleChange('priority', pri.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.priority === pri.value
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Badge className={pri.color}>{pri.label}</Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Tips for faster resolution:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Be specific about what you were doing when the issue occurred</li>
                <li>Include any error messages or screenshots</li>
                <li>Mention if this is affecting a specific booking or event</li>
                <li>For urgent issues, select "Urgent" priority</li>
              </ul>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Creating Ticket...
                </>
              ) : (
                'Create Support Ticket'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
