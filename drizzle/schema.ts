import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean, date, unique } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "artist", "venue"]).default("user").notNull(),
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
  contactName: varchar("contactName", { length: 255 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 50 }),
  websiteUrl: text("websiteUrl"),
  profilePhotoUrl: text("profilePhotoUrl"),
  mediaGallery: json("mediaGallery").$type<{ photos: string[], videos: string[] }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VenueProfile = typeof venueProfiles.$inferSelect;
export type InsertVenueProfile = typeof venueProfiles.$inferInsert;

/**
 * Rider templates - reusable technical and hospitality requirements for artists
 */
export const riderTemplates = mysqlTable("rider_templates", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(),
  templateName: varchar("templateName", { length: 255 }).notNull(),
  technicalRequirements: json("technicalRequirements").$type<{
    stageWidth?: string,
    stageDepth?: string,
    soundSystem?: string,
    lighting?: string,
    backline?: string,
    other?: string
  }>(),
  hospitalityRequirements: json("hospitalityRequirements").$type<{
    dressingRooms?: string,
    catering?: string,
    beverages?: string,
    accommodation?: string,
    other?: string
  }>(),
  financialTerms: json("financialTerms").$type<{
    depositAmount?: string,
    paymentMethod?: string,
    cancellationPolicy?: string,
    other?: string
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RiderTemplate = typeof riderTemplates.$inferSelect;
export type InsertRiderTemplate = typeof riderTemplates.$inferInsert;

/**
 * Availability - tracks which dates artists are available, booked, or unavailable
 */
export const availability = mysqlTable("availability", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(),
  date: date("date").notNull(),
  status: mysqlEnum("status", ["available", "booked", "unavailable"]).notNull().default("available"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueArtistDate: unique().on(table.artistId, table.date),
}));

export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = typeof availability.$inferInsert;

/**
 * Bookings - stores all booking requests and confirmed bookings
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(),
  venueId: int("venueId").notNull(),
  eventDate: date("eventDate").notNull(),
  eventTime: varchar("eventTime", { length: 50 }),
  venueName: varchar("venueName", { length: 255 }).notNull(),
  venueAddress: text("venueAddress"),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).notNull().default("pending"),
  riderData: json("riderData").$type<{
    technical?: object,
    hospitality?: object,
    financial?: object
  }>(),
  totalFee: decimal("totalFee", { precision: 10, scale: 2 }),
  depositAmount: decimal("depositAmount", { precision: 10, scale: 2 }),
  eventDetails: text("eventDetails"),
  // Payment tracking fields
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "deposit_paid", "full_paid", "refunded"]).default("unpaid"),
  depositPaidAt: timestamp("depositPaidAt"),
  fullPaymentPaidAt: timestamp("fullPaymentPaidAt"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeRefundId: varchar("stripeRefundId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Messages - in-platform messaging between artists and venues for specific bookings
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  senderId: int("senderId").notNull(),
  receiverId: int("receiverId").notNull(),
  messageText: text("messageText").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Subscriptions - tracks artist subscription status with Stripe
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  planType: varchar("planType", { length: 50 }).notNull().default("basic"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  status: mysqlEnum("status", ["active", "inactive", "trialing", "canceled", "past_due"]).notNull().default("inactive"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Reviews table - stores venue reviews of artists after completed bookings
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  artistId: int("artistId").notNull(),
  venueId: int("venueId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  reviewText: text("reviewText"),
  artistResponse: text("artistResponse"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Venue Reviews table - stores artist reviews of venues after completed bookings
 */
export const venueReviews = mysqlTable("venueReviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  artistId: int("artistId").notNull(),
  venueId: int("venueId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  reviewText: text("reviewText"),
  venueResponse: text("venueResponse"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VenueReview = typeof venueReviews.$inferSelect;
export type InsertVenueReview = typeof venueReviews.$inferInsert;

/**
 * Favorites table - stores venue bookmarks of artists
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // The venue user who favorited
  artistId: int("artistId").notNull(), // The artist profile being favorited
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;


/**
 * Booking templates table - stores reusable booking request templates for venues
 */
export const bookingTemplates = mysqlTable("booking_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // The venue user who owns this template
  templateName: varchar("templateName", { length: 255 }).notNull(),
  venueName: varchar("venueName", { length: 255 }),
  venueAddress: text("venueAddress"),
  venueCapacity: int("venueCapacity"),
  eventType: varchar("eventType", { length: 255 }),
  budgetMin: int("budgetMin"),
  budgetMax: int("budgetMax"),
  standardRequirements: text("standardRequirements"),
  additionalNotes: text("additionalNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BookingTemplate = typeof bookingTemplates.$inferSelect;
export type InsertBookingTemplate = typeof bookingTemplates.$inferInsert;


/**
 * Profile views table - tracks artist profile page visits for analytics
 */
export const profileViews = mysqlTable("profile_views", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(),
  viewerUserId: int("viewerUserId"), // null for anonymous views
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }), // For deduplication
});

export type ProfileView = typeof profileViews.$inferSelect;
export type InsertProfileView = typeof profileViews.$inferInsert;


/**
 * Booking reminders table - tracks sent reminder emails for bookings
 */
export const bookingReminders = mysqlTable("booking_reminders", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  reminderType: varchar("reminderType", { length: 50 }).notNull(), // '7_days', '3_days', '1_day'
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type BookingReminder = typeof bookingReminders.$inferSelect;
export type InsertBookingReminder = typeof bookingReminders.$inferInsert;


/**
 * Contracts table - stores Ryder contracts and agreements between artists and venues
 */
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull().unique(),
  artistId: int("artistId").notNull(),
  venueId: int("venueId").notNull(),
  contractType: varchar("contractType", { length: 50 }).default("ryder").notNull(),
  contractTitle: varchar("contractTitle", { length: 255 }).notNull(),
  contractContent: text("contractContent").notNull(),
  contractPdfUrl: text("contractPdfUrl"),
  status: mysqlEnum("status", ["draft", "pending_signatures", "signed", "executed", "cancelled"]).default("draft").notNull(),
  artistSignedAt: timestamp("artistSignedAt"),
  venueSignedAt: timestamp("venueSignedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

/**
 * Signatures table - stores digital signatures for contracts
 */
export const signatures = mysqlTable("signatures", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  signerId: int("signerId").notNull(),
  signerRole: varchar("signerRole", { length: 50 }).notNull(),
  signatureData: text("signatureData").notNull(),
  signatureType: varchar("signatureType", { length: 50 }).default("canvas").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  signedAt: timestamp("signedAt").defaultNow().notNull(),
  verificationToken: varchar("verificationToken", { length: 255 }),
  verifiedAt: timestamp("verifiedAt"),
});

export type Signature = typeof signatures.$inferSelect;
export type InsertSignature = typeof signatures.$inferInsert;


/**
 * Referral program - tracks referrals and credits earned
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredUserId: int("referredUserId").notNull(),
  referralCode: varchar("referralCode", { length: 32 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  creditsAwarded: decimal("creditsAwarded", { precision: 10, scale: 2 }).default("0"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * User credits - tracks credits balance for each user
 */
export const userCredits = mysqlTable("user_credits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0"),
  totalEarned: decimal("totalEarned", { precision: 10, scale: 2 }).default("0"),
  totalSpent: decimal("totalSpent", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserCredit = typeof userCredits.$inferSelect;
export type InsertUserCredit = typeof userCredits.$inferInsert;

/**
 * Artist verification - tracks artist verification status and badges
 */
export const artistVerification = mysqlTable("artist_verification", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull().unique(),
  isVerified: boolean("isVerified").default(false),
  verificationBadge: varchar("verificationBadge", { length: 50 }), // "verified", "top_rated", "pro"
  completedBookings: int("completedBookings").default(0),
  backgroundCheckPassed: boolean("backgroundCheckPassed").default(false),
  backgroundCheckDate: timestamp("backgroundCheckDate"),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0"),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ArtistVerification = typeof artistVerification.$inferSelect;
export type InsertArtistVerification = typeof artistVerification.$inferInsert;

/**
 * System booking templates - pre-configured templates for common event types
 */
export const systemBookingTemplates = mysqlTable("system_booking_templates", {
  id: int("id").autoincrement().primaryKey(),
  templateName: varchar("templateName", { length: 255 }).notNull(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  description: text("description"),
  suggestedFeeMin: int("suggestedFeeMin"),
  suggestedFeeMax: int("suggestedFeeMax"),
  typicalDuration: varchar("typicalDuration", { length: 50 }),
  riderTemplate: json("riderTemplate").$type<{
    technical?: object,
    hospitality?: object,
    financial?: object
  }>(),
  commonRequirements: json("commonRequirements").$type<string[]>(),
  setupTime: varchar("setupTime", { length: 50 }),
  soundCheckTime: varchar("soundCheckTime", { length: 50 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemBookingTemplate = typeof systemBookingTemplates.$inferSelect;
export type InsertSystemBookingTemplate = typeof systemBookingTemplates.$inferInsert;

/**
 * User booking template preferences - tracks which templates users prefer
 */
export const userTemplatePreferences = mysqlTable("user_template_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  templateId: int("templateId").notNull(),
  isDefault: boolean("isDefault").default(false),
  customizations: json("customizations").$type<object>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueUserTemplate: unique().on(table.userId, table.templateId),
}));

export type UserTemplatePreference = typeof userTemplatePreferences.$inferSelect;
export type InsertUserTemplatePreference = typeof userTemplatePreferences.$inferInsert;
