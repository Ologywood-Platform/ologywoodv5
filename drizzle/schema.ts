import { int, mysqlTable, varchar, timestamp, text, mysqlEnum, boolean, decimal, json, index, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // OAuth ID
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }), // 'oauth', 'google', 'github', etc.
  role: mysqlEnum("role", ["user", "admin", "artist", "venue"]).default("user").notNull(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerificationToken: varchar("emailVerificationToken", { length: 255 }),
  emailVerificationSentAt: timestamp("emailVerificationSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;


/**
 * Artist profile table - stores detailed information for performing artists
 */
export const artistProfiles = mysqlTable("artist_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  artistName: varchar("artistName", { length: 255 }).notNull(),
  genre: json("genre").$type<string[]>(),
  bio: text("bio"),
  location: varchar("location", { length: 255 }),
  feeRangeMin: int("feeRangeMin"),
  feeRangeMax: int("feeRangeMax"),
  touringPartySize: int("touringPartySize").default(1),
  profilePhotoUrl: text("profilePhotoUrl"),
  mediaGallery: json("mediaGallery").$type<{ photos: string[], videos: string[] }>(),
  websiteUrl: text("websiteUrl"),
  socialLinks: json("socialLinks").$type<{ instagram?: string, facebook?: string, youtube?: string, spotify?: string, twitter?: string }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ArtistProfile = typeof artistProfiles.$inferSelect;
export type InsertArtistProfile = typeof artistProfiles.$inferInsert;

/**
 * Venue profile table - stores information for venues/event organizers
 */
export const venueProfiles = mysqlTable("venue_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  organizationName: varchar("organizationName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  location: varchar("location", { length: 255 }),
  bio: text("bio"),
  // Directory listing fields
  isListed: boolean("isListed").default(true).notNull(), // Free listing on directory
  website: text("website"),
  email: varchar("email", { length: 320 }).unique(),
  capacity: int("capacity"), // Max attendees
  venueType: varchar("venueType", { length: 100 }), // e.g., "Club", "Theater", "Hall", "Outdoor"
  amenities: json("amenities").$type<string[]>(), // e.g., ["PA System", "Stage", "Parking", "Bar"]
  profilePhotoUrl: text("profilePhotoUrl"),
  mediaGallery: json("mediaGallery").$type<{ photos: string[], videos: string[] }>(),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default(0),
  reviewCount: int("reviewCount").default(0),
  listingViews: int("listingViews").default(0), // Track directory views
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerificationToken: varchar("emailVerificationToken", { length: 255 }),
  emailVerificationSentAt: timestamp("emailVerificationSentAt"),
  profileCompletionScore: int("profileCompletionScore").default(0).notNull(),
  profileCompletionUpdatedAt: timestamp("profileCompletionUpdatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

export type VenueProfile = typeof venueProfiles.$inferSelect;
export type InsertVenueProfile = typeof venueProfiles.$inferInsert;

/**
 * Rider templates - reusable technical and hospitality requirements for artists
 * Simplified schema using JSON for flexible storage
 */
export const riderTemplates = mysqlTable("rider_templates", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId"),
  templateName: varchar("templateName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type RiderTemplate = typeof riderTemplates.$inferSelect & { templateData?: Record<string, any> };
export type InsertRiderTemplate = typeof riderTemplates.$inferInsert & { templateData?: Record<string, any> };

/**
 * Availability - tracks which dates artists are available, booked, or unavailable
 */
export const availability = mysqlTable("availability", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  status: mysqlEnum("status", ["available", "booked", "unavailable"]).default("available").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = typeof availability.$inferInsert;

/**
 * Bookings - tracks booking requests between venues and artists
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  venueId: int("venueId").notNull(),
  artistId: int("artistId").notNull(),
  eventDate: timestamp("eventDate").notNull(),
  eventTime: varchar("eventTime", { length: 5 }), // HH:MM format
  eventDetails: text("eventDetails"),
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled"]).default("pending").notNull(),
  totalFee: decimal("totalFee", { precision: 10, scale: 2 }),
  depositAmount: decimal("depositAmount", { precision: 10, scale: 2 }),
  depositPaidAt: timestamp("depositPaidAt"),

  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "deposit_paid", "fully_paid", "refunded"]).default("unpaid").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeRefundId: varchar("stripeRefundId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Messages - in-platform messaging for booking conversations
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId").notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  lastReadAt: timestamp("lastReadAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Reviews - artist reviews from venues
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull().unique(),
  artistId: int("artistId").notNull(),
  venueId: int("venueId").notNull(),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  artistResponse: text("artistResponse"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Venue Reviews - artist reviews of venues
 */
export const venueReviews = mysqlTable("venue_reviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull().unique(),
  venueId: int("venueId").notNull(),
  artistId: int("artistId").notNull(),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  venueResponse: text("venueResponse"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VenueReview = typeof venueReviews.$inferSelect;
export type InsertVenueReview = typeof venueReviews.$inferInsert;

/**
 * Profile Views - track artist profile visits
 */
export const profileViews = mysqlTable("profile_views", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});

export type ProfileView = typeof profileViews.$inferSelect;
export type InsertProfileView = typeof profileViews.$inferInsert;

/**
 * Favorites - venue's favorite artists
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  venueId: int("venueId").notNull(),
  artistId: int("artistId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Booking Templates - reusable booking request templates
 */
export const bookingTemplates = mysqlTable("booking_templates", {
  id: int("id").autoincrement().primaryKey(),
  venueId: int("venueId").notNull(),
  templateName: varchar("templateName", { length: 255 }).notNull(),
  eventDetails: text("eventDetails"),
  totalFee: decimal("totalFee", { precision: 10, scale: 2 }),
  depositAmount: decimal("depositAmount", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BookingTemplate = typeof bookingTemplates.$inferSelect;
export type InsertBookingTemplate = typeof bookingTemplates.$inferInsert;

/**
 * Booking Reminders - track sent reminders
 */
export const bookingReminders = mysqlTable("booking_reminders", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  reminderType: mysqlEnum("reminderType", ["7_days", "3_days", "1_day"]).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type BookingReminder = typeof bookingReminders.$inferSelect;
export type InsertBookingReminder = typeof bookingReminders.$inferInsert;

/**
 * Contracts - digital contracts for bookings
 */
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull().unique(),
  artistId: int("artistId").notNull(),
  venueId: int("venueId").notNull(),
  contractData: json("contractData").$type<Record<string, any>>(),
  pdfUrl: text("pdfUrl"),
  status: mysqlEnum("status", ["pending", "signed_by_artist", "signed_by_venue", "fully_signed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

/**
 * Signatures - digital signatures on contracts
 */
export const signatures = mysqlTable("signatures", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  userId: int("userId").notNull(),
  signatureData: text("signatureData").notNull(), // Base64 encoded signature
  signedAt: timestamp("signedAt").defaultNow().notNull(),
});

export type Signature = typeof signatures.$inferSelect;
export type InsertSignature = typeof signatures.$inferInsert;

/**
 * Referrals - track referral program
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredId: int("referredId"),
  referralCode: varchar("referralCode", { length: 20 }).unique().notNull(),
  status: mysqlEnum("status", ["pending", "completed", "rewarded"]).default("pending").notNull(),
  rewardAmount: decimal("rewardAmount", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Verification Badges - track artist verification status
 */
export const verificationBadges = mysqlTable("verification_badges", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull().unique(),
  completedBookings: int("completedBookings").default(0),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default(0),
  hasProfilePhoto: boolean("hasProfilePhoto").default(false),
  hasBio: boolean("hasBio").default(false),
  hasRiderTemplate: boolean("hasRiderTemplate").default(false),
  verificationStatus: mysqlEnum("verificationStatus", ["bronze", "silver", "gold", "platinum"]).default("bronze").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VerificationBadge = typeof verificationBadges.$inferSelect;
export type InsertVerificationBadge = typeof verificationBadges.$inferInsert;


/**
 * Follows - track user follows for artists and venues
 */
export const follows = mysqlTable("follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(), // User who is following
  followingId: int("followingId").notNull(), // Artist or Venue being followed
  followingType: mysqlEnum("followingType", ["artist", "venue"]).notNull(), // Type of entity being followed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;


/**
 * Email Preferences - allows users to control email subscription frequency and content categories
 */
export const emailPreferences = mysqlTable("email_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  // Email frequency: 'daily', 'weekly', 'never'
  frequency: mysqlEnum("frequency", ["daily", "weekly", "never"]).default("weekly").notNull(),
  // Content categories user wants to receive
  bookingUpdates: boolean("bookingUpdates").default(true).notNull(),
  newOpportunities: boolean("newOpportunities").default(true).notNull(),
  platformNews: boolean("platformNews").default(false).notNull(),
  weeklyDigest: boolean("weeklyDigest").default(true).notNull(),
  reminders: boolean("reminders").default(true).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailPreference = typeof emailPreferences.$inferSelect;
export type InsertEmailPreference = typeof emailPreferences.$inferInsert;


/**
 * Subscriptions - tracks Stripe subscription information for users
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  status: varchar("status", { length: 50 }).default("active").notNull(), // active, canceled, past_due, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;


/**
 * Notification Preferences - tracks user notification settings
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  // Email notifications
  bookingNotifications: boolean("bookingNotifications").default(true).notNull(),
  messageNotifications: boolean("messageNotifications").default(true).notNull(),
  reviewNotifications: boolean("reviewNotifications").default(true).notNull(),
  riderNotifications: boolean("riderNotifications").default(true).notNull(),
  // Notification channels
  emailNotifications: boolean("emailNotifications").default(true).notNull(),
  pushNotifications: boolean("pushNotifications").default(true).notNull(),
  reminderNotifications: boolean("reminderNotifications").default(true).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * Notifications - tracks in-app notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["booking", "message", "payment", "contract", "review"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  actionUrl: text("actionUrl"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;


/**
 * Artist Payouts - tracks payout requests and payments to artists
 */
export const artistPayouts = mysqlTable("artist_payouts", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled"]).default("pending").notNull(),
  payoutMethod: mysqlEnum("payoutMethod", ["bank_transfer", "stripe_connect", "manual"]).default("bank_transfer").notNull(),
  stripeTransferId: varchar("stripeTransferId", { length: 255 }),
  bankAccountId: int("bankAccountId"),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ArtistPayout = typeof artistPayouts.$inferSelect;
export type InsertArtistPayout = typeof artistPayouts.$inferInsert;

/**
 * Stripe Connect Accounts - stores Stripe Connect account info for artists
 */
export const stripeConnectAccounts = mysqlTable("stripe_connect_accounts", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull().unique(),
  stripeAccountId: varchar("stripeAccountId", { length: 255 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "active", "inactive"]).default("pending").notNull(),
  chargesEnabled: boolean("chargesEnabled").default(false).notNull(),
  payoutsEnabled: boolean("payoutsEnabled").default(false).notNull(),
  bankAccountVerified: boolean("bankAccountVerified").default(false).notNull(),
  verificationStatus: varchar("verificationStatus", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StripeConnectAccount = typeof stripeConnectAccounts.$inferSelect;
export type InsertStripeConnectAccount = typeof stripeConnectAccounts.$inferInsert;

/**
 * Artist Earnings - tracks earnings per booking for quick calculations
 */
export const artistEarnings = mysqlTable("artist_earnings", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(),
  bookingId: int("bookingId").notNull().unique(),
  grossAmount: decimal("grossAmount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }).notNull(),
  netAmount: decimal("netAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "paid_out"]).default("pending").notNull(),
  payoutId: int("payoutId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ArtistEarning = typeof artistEarnings.$inferSelect;
export type InsertArtistEarning = typeof artistEarnings.$inferInsert;

/**
 * Invoices - tracks generated invoices for bookings
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull().unique(),
  artistId: int("artistId").notNull(),
  venueId: int("venueId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).unique().notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default(0),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }).default(0),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "viewed", "paid", "overdue", "cancelled"]).default("draft").notNull(),
  pdfUrl: text("pdfUrl"),
  sentAt: timestamp("sentAt"),
  viewedAt: timestamp("viewedAt"),
  paidAt: timestamp("paidAt"),
  dueDate: date("dueDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
