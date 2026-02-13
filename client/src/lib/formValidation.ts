import { z } from 'zod';

/**
 * COMPREHENSIVE FORM VALIDATION SCHEMAS
 * Used across all forms in the platform
 */

// ==================== AUTHENTICATION ====================
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['artist', 'venue']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ==================== ARTIST PROFILE ====================
export const artistProfileSchema = z.object({
  artistName: z.string().min(1, 'Artist name is required').max(255),
  bio: z.string().max(1000, 'Bio must be under 1000 characters').optional(),
  genres: z.array(z.string()).min(1, 'Select at least one genre'),
  location: z.string().min(1, 'Location is required'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number').optional().or(z.literal('')),
  feeRangeMin: z.number().min(0, 'Minimum fee must be positive'),
  feeRangeMax: z.number().min(0, 'Maximum fee must be positive'),
  touringPartySize: z.number().min(1, 'Touring party size must be at least 1'),
  socialLinks: z.object({
    instagram: z.string().optional().or(z.literal('')),
    facebook: z.string().optional().or(z.literal('')),
    youtube: z.string().optional().or(z.literal('')),
    spotify: z.string().optional().or(z.literal('')),
    twitter: z.string().optional().or(z.literal('')),
  }).optional(),
});

// ==================== VENUE PROFILE ====================
export const venueProfileSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required').max(255),
  contactName: z.string().min(1, 'Contact name is required').max(255),
  contactPhone: z.string().min(10, 'Invalid phone number'),
  location: z.string().min(1, 'Location is required'),
  bio: z.string().max(1000, 'Bio must be under 1000 characters').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  email: z.string().email('Invalid email address'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  venueType: z.string().min(1, 'Venue type is required'),
  amenities: z.array(z.string()).optional(),
  isListed: z.boolean().default(true),
});

// ==================== BOOKING ====================
export const bookingSchema = z.object({
  artistId: z.number().min(1, 'Artist is required'),
  venueId: z.number().min(1, 'Venue is required'),
  eventDate: z.string().refine((date) => new Date(date) > new Date(), 'Event date must be in the future'),
  eventTime: z.string().min(1, 'Event time is required'),
  eventName: z.string().min(1, 'Event name is required').max(255),
  description: z.string().max(1000, 'Description must be under 1000 characters').optional(),
  estimatedAttendees: z.number().min(1, 'Estimated attendees must be at least 1'),
  budget: z.number().min(0, 'Budget must be positive'),
  notes: z.string().max(1000, 'Notes must be under 1000 characters').optional(),
});

// ==================== RIDER ====================
export const riderSchema = z.object({
  title: z.string().min(1, 'Rider title is required').max(255),
  description: z.string().max(1000).optional(),
  sections: z.array(z.object({
    name: z.string().min(1, 'Section name is required'),
    content: z.string().min(1, 'Section content is required'),
  })).min(1, 'Add at least one section'),
});

// ==================== AVAILABILITY ====================
export const availabilitySchema = z.object({
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  isAvailable: z.boolean(),
}).refine((data) => {
  const [startHour, startMin] = data.startTime.split(':').map(Number);
  const [endHour, endMin] = data.endTime.split(':').map(Number);
  const startTotal = startHour * 60 + startMin;
  const endTotal = endHour * 60 + endMin;
  return startTotal < endTotal;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

// ==================== MESSAGE ====================
export const messageSchema = z.object({
  recipientId: z.number().min(1, 'Recipient is required'),
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message is too long'),
  attachments: z.array(z.string()).optional(),
});

// ==================== SUPPORT TICKET ====================
export const supportTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  category: z.enum(['technical', 'billing', 'general', 'booking', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  attachments: z.array(z.string()).optional(),
});

// ==================== PAYMENT ====================
export const paymentSchema = z.object({
  amount: z.number().min(0.50, 'Minimum amount is $0.50'),
  currency: z.string().default('USD'),
  paymentMethod: z.enum(['card', 'bank_transfer']),
  cardNumber: z.string().regex(/^\d{16}$/, 'Invalid card number').optional(),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, 'Invalid expiry date').optional(),
  cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV').optional(),
});

// ==================== PRIVACY & SECURITY ====================
export const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'hidden']),
  allowMessages: z.boolean(),
  allowBookingRequests: z.boolean(),
  showEmail: z.boolean(),
  showPhone: z.boolean(),
});

export const accountDeletionSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z.boolean().refine((val) => val === true, 'You must confirm account deletion'),
});

// ==================== REVIEW ====================
export const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5),
  title: z.string().min(1, 'Review title is required').max(255),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(1000),
  photos: z.array(z.string()).optional(),
});

// ==================== VALIDATION UTILITIES ====================

export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { valid: boolean; errors: Record<string, string> } {
  try {
    schema.parse(data);
    return { valid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      (error as any).errors?.forEach?.((err: any) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { valid: false, errors };
    }
    return { valid: false, errors: { general: 'Validation failed' } };
  }
}

export function getFieldError(errors: Record<string, string>, fieldName: string): string | undefined {
  return errors[fieldName];
}

export function hasErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}
