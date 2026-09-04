import { int, mysqlTable, varchar, timestamp, text, mysqlEnum, boolean, decimal, json, index, date, unique } from "drizzle-orm/mysql-core";

/**
 * Operating hours schedule type for venues.
 * Each day has open/close times or is marked as closed.
 */
export type DaySchedule = {
  open: string; // HH:MM format (24h)
  close: string; // HH:MM format (24h)
  closed: boolean;
};

export type OperatingHoursSchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // OAuth ID
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }), // 'oauth', 'google', 'github', etc.
  role: mysqlEnum("role", ["user", "admin", "artist", "venue", "fan", "blogger"]).default("user").notNull(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerificationToken: varchar("emailVerificationToken", { length: 255 }),
  emailVerificationSentAt: timestamp("emailVerificationSentAt"),
  passwordHash: varchar("passwordHash", { length: 255 }), // For email/password auth (nullable for OAuth users)
  oauthProvider: varchar("oauthProvider", { length: 32 }), // 'google', 'spotify', etc.
  oauthProviderId: varchar("oauthProviderId", { length: 255 }), // Provider-specific user ID
  avatarUrl: varchar("avatarUrl", { length: 512 }), // Profile picture from OAuth provider
  customAvatarUrl: varchar("customAvatarUrl", { length: 512 }), // User-uploaded profile picture (overrides OAuth avatar)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  roleIdx: index("idx_users_role").on(table.role),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User Subscriptions - tracks subscription tier and status
 */
export const userSubscriptions = mysqlTable("user_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  tier: mysqlEnum("tier", ["free", "starter", "professional", "enterprise"]).default("free").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  status: mysqlEnum("status", ["active", "cancelled", "past_due", "trialing", "paused"]).default("active").notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelledAt: timestamp("cancelledAt"),
  pausedAt: timestamp("pausedAt"),
  pauseExpiresAt: timestamp("pauseExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

/**
 * Booking Usage - tracks monthly booking count for FREE tier enforcement
 */
export const bookingUsage = mysqlTable("booking_usage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  bookingCount: int("bookingCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userMonthIdx: index("idx_booking_usage_user_month").on(table.userId, table.month),
}));

export type BookingUsage = typeof bookingUsage.$inferSelect;
export type InsertBookingUsage = typeof bookingUsage.$inferInsert;


/**
 * Artist profile table - stores detailed information for performing artists
 */
export const artistProfiles = mysqlTable("artist_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  artistName: varchar("artistName", { length: 255 }).notNull(),
  talentType: varchar("talentType", { length: 20 }).default("artist"), // 'artist' | 'visual_artist' | 'athlete' | 'creator' | 'entertainer' | 'filmmaker' | 'influencer'
  sportCategory: varchar("sportCategory", { length: 100 }), // e.g., Basketball, Football, Soccer
  sportPosition: varchar("sportPosition", { length: 100 }), // e.g., Point Guard, Quarterback
  sportTeam: varchar("sportTeam", { length: 255 }), // e.g., Duke Blue Devils, LA Lakers
  athleteStats: json("athleteStats").$type<{ label: string; value: string }[]>(), // Key stats like PPG, RBI, etc.
  athleteAchievements: json("athleteAchievements").$type<{ title: string; year?: string; description?: string }[]>(), // Awards, records, honors
  nilDeals: json("nilDeals").$type<{ brand: string; description?: string; logoUrl?: string; active?: boolean }[]>(), // NIL brand partnerships
  genre: json("genre").$type<string[]>(),
  bio: text("bio"),
  location: varchar("location", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).default("US"),
  feeRangeMin: int("feeRangeMin"),
  feeRangeMax: int("feeRangeMax"),
  touringPartySize: int("touringPartySize").default(1),
  profilePhotoUrl: text("profilePhotoUrl"),
  performanceVideoUrl: text("performanceVideoUrl"),
  performanceVideoThumbnail: text("performanceVideoThumbnail"),
  performanceVideoStatus: mysqlEnum("performanceVideoStatus", ["pending", "approved", "rejected", "flagged", "taken_down"]),
  performanceVideoFlagCount: int("performanceVideoFlagCount").default(0).notNull(),
  performanceVideoDuration: int("performanceVideoDuration"),
  performanceVideoUploadedAt: timestamp("performanceVideoUploadedAt"),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "pro"]).default("free").notNull(),
  mediaGallery: json("mediaGallery").$type<{ photos: string[], videos: string[] }>(),
  websiteUrl: text("websiteUrl"),
  socialLinks: json("socialLinks").$type<{ instagram?: string, facebook?: string, youtube?: string, spotify?: string, twitter?: string }>(),
  tipLinks: json("tipLinks").$type<{ cashapp?: string, venmo?: string, paypal?: string, zelle?: string }>(),
  crmSupporter: boolean("crmSupporter").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  artistNameIdx: index("idx_artist_profiles_name").on(table.artistName),
  locationIdx: index("idx_artist_profiles_location").on(table.location),
  cityIdx: index("idx_artist_profiles_city").on(table.city),
  stateIdx: index("idx_artist_profiles_state").on(table.state),
  feeRangeIdx: index("idx_artist_profiles_fee").on(table.feeRangeMin, table.feeRangeMax),
}));

export type ArtistProfile = typeof artistProfiles.$inferSelect;
export type InsertArtistProfile = typeof artistProfiles.$inferInsert;

/**
 * Sandbox Posts - one replaceable, creator-controlled public update per talent profile.
 * A replacement deletes the current row and inserts a new row; there is no history table.
 */
export const sandboxPosts = mysqlTable("sandbox_posts", {
  id: int("id").autoincrement().primaryKey(),
  artistProfileId: int("artistProfileId").notNull(),
  artistUserId: int("artistUserId").notNull(),
  content: text("content").notNull(),
  mediaType: mysqlEnum("mediaType", ["image", "video"]),
  mediaUrl: text("mediaUrl"),
  mediaKey: text("mediaKey"),
  mediaMimeType: varchar("mediaMimeType", { length: 100 }),
  mediaFileName: varchar("mediaFileName", { length: 255 }),
  mediaSizeBytes: int("mediaSizeBytes"),
  mediaDurationSeconds: int("mediaDurationSeconds"),
  mediaThumbnailUrl: text("mediaThumbnailUrl"),
  mediaThumbnailKey: text("mediaThumbnailKey"),
  status: mysqlEnum("status", ["active", "hidden"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  profileUnique: unique("uniq_sandbox_posts_profile").on(table.artistProfileId),
  ownerUnique: unique("uniq_sandbox_posts_owner").on(table.artistUserId),
  publicIdx: index("idx_sandbox_posts_public").on(table.artistProfileId, table.status),
}));

export type SandboxPost = typeof sandboxPosts.$inferSelect;
export type InsertSandboxPost = typeof sandboxPosts.$inferInsert;

/**
 * Video moderation queue - admin review of artist performance videos
 */
export const videoModerationQueue = mysqlTable("video_moderation_queue", {
  id: int("id").autoincrement().primaryKey(),
  artistProfileId: int("artistProfileId").notNull(),
  artistUserId: int("artistUserId").notNull(),
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  durationSeconds: int("durationSeconds"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  artistIdx: index("idx_video_mod_artist").on(table.artistProfileId),
  statusIdx: index("idx_video_mod_status").on(table.status),
}));

export type VideoModerationQueue = typeof videoModerationQueue.$inferSelect;
export type InsertVideoModerationQueue = typeof videoModerationQueue.$inferInsert;

/**
 * Video flags - community reports on performance videos
 */
export const videoFlags = mysqlTable("video_flags", {
  id: int("id").autoincrement().primaryKey(),
  artistProfileId: int("artistProfileId").notNull(),
  flaggedByUserId: int("flaggedByUserId").notNull(),
  reason: mysqlEnum("reason", ["inappropriate", "copyright", "spam", "other"]).notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  artistIdx: index("idx_video_flags_artist").on(table.artistProfileId),
  userIdx: index("idx_video_flags_user").on(table.flaggedByUserId),
  uniqueFlag: index("idx_video_flags_unique").on(table.artistProfileId, table.flaggedByUserId),
}));

export type VideoFlag = typeof videoFlags.$inferSelect;
export type InsertVideoFlag = typeof videoFlags.$inferInsert;

/**
 * Venue profile table - stores information for venues/event organizers
 */
export const venueProfiles = mysqlTable("venue_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  organizationName: varchar("organizationName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  mediaGallery: json("mediaGallery").$type<Record<string, any>>(),
  profilePhotoUrl: text("profilePhotoUrl"),
  location: varchar("location", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).default("US"),
  bio: text("bio"),
  isListed: boolean("isListed").default(true).notNull(),
  website: text("website"),
  email: varchar("email", { length: 320 }).unique(),
  capacity: int("capacity"),
  venueType: varchar("venueType", { length: 100 }),
  amenities: json("amenities").$type<Record<string, any>>(),
  operatingHours: json("operatingHours").$type<OperatingHoursSchedule>(),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: int("reviewCount").default(0),
  listingViews: int("listingViews").default(0),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerificationToken: varchar("emailVerificationToken", { length: 255 }),
  emailVerificationSentAt: timestamp("emailVerificationSentAt"),
  profileCompletionScore: int("profileCompletionScore").default(0).notNull(),
  profileCompletionUpdatedAt: timestamp("profileCompletionUpdatedAt").defaultNow().notNull()
});

export type VenueProfile = typeof venueProfiles.$inferSelect;
export type InsertVenueProfile = typeof venueProfiles.$inferInsert;

/**
 * Rider templates - reusable technical and hospitality requirements for artists
 * Simplified schema using JSON for flexible storage
 */
export const riderTemplates = mysqlTable("rider_templates", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId"), // indexed below
  templateName: varchar("templateName", { length: 255 }),
  templateData: json("templateData").$type<Record<string, any>>(),
  templateType: varchar("templateType", { length: 50 }).default("custom"),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  artistIdx: index("idx_rider_templates_artist").on(table.artistId),
}));

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
}, (table) => ({
  artistDateIdx: index("idx_availability_artist_date").on(table.artistId, table.date),
  statusIdx: index("idx_availability_status").on(table.status),
}));

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
  stripeDepositPaymentIntentId: varchar("stripeDepositPaymentIntentId", { length: 255 }),
  stripeFinalPaymentIntentId: varchar("stripeFinalPaymentIntentId", { length: 255 }),
  stripeRefundId: varchar("stripeRefundId", { length: 255 }),
  finalPaidAt: timestamp("finalPaidAt"),
  cancelledAt: timestamp("cancelledAt"),
  cancelledBy: varchar("cancelledBy", { length: 20 }),
  cancellationReason: text("cancellationReason"),
  
  // Booking type for athlete-specific bookings
  bookingType: varchar("bookingType", { length: 50 }), // appearance, autograph_signing, speaking, camp_clinic, brand_endorsement, performance, other
  
  // Client booking fields
  eventType: varchar("eventType", { length: 50 }), // wedding, corporate, birthday, church, festival, house_party, restaurant, other
  bookingSource: varchar("bookingSource", { length: 30 }).default("venue_dashboard"), // venue_dashboard, client_booking
  venueName: varchar("venueName", { length: 255 }), // For client bookings where booker provides venue name
  venueAddress: text("venueAddress"), // Full address for client bookings
  clientName: varchar("clientName", { length: 255 }), // Name of the person booking (for client bookings)
  clientEmail: varchar("clientEmail", { length: 320 }), // Contact email for client bookings
  clientPhone: varchar("clientPhone", { length: 20 }), // Optional phone for client bookings

  // Payment terms — supports flat guarantee, door split, or guarantee-vs-percentage
  paymentTermsType: mysqlEnum("paymentTermsType", ["flat_guarantee", "door_split", "guarantee_vs_percentage"]).default("flat_guarantee"),
  doorSplitArtistPercent: int("doorSplitArtistPercent"), // e.g. 80 means artist gets 80% of door
  guaranteeAmount: decimal("guaranteeAmount", { precision: 10, scale: 2 }), // Minimum guarantee for guarantee_vs_percentage
  doorRevenue: decimal("doorRevenue", { precision: 10, scale: 2 }), // Actual door revenue (filled post-show)
  attendance: int("attendance"), // Actual attendance count (filled post-show)
  settlementAmount: decimal("settlementAmount", { precision: 10, scale: 2 }), // Final calculated payout
  settlementNotes: text("settlementNotes"), // Notes about the settlement
  settledAt: timestamp("settledAt"), // When settlement was completed

  // Counter offer fields
  counterOfferAmount: decimal("counterOfferAmount", { precision: 10, scale: 2 }),
  counterOfferMessage: text("counterOfferMessage"),
  counterOfferAt: timestamp("counterOfferAt"),
  counterOfferBy: varchar("counterOfferBy", { length: 20 }), // 'artist' or 'venue'

  // Rider template linked to this booking
  riderTemplateId: int("riderTemplateId"),
  riderStatus: varchar("riderStatus", { length: 50 }).default("pending"),
  riderAcknowledgedAt: timestamp("riderAcknowledgedAt"),
  riderAcknowledgedBy: int("riderAcknowledgedBy"), // venueId who acknowledged
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  venueIdx: index("idx_bookings_venue").on(table.venueId),
  artistIdx: index("idx_bookings_artist").on(table.artistId),
  statusIdx: index("idx_bookings_status").on(table.status),
  eventDateIdx: index("idx_bookings_event_date").on(table.eventDate),
  venueStatusIdx: index("idx_bookings_venue_status").on(table.venueId, table.status),
  artistStatusIdx: index("idx_bookings_artist_status").on(table.artistId, table.status),
  paymentStatusIdx: index("idx_bookings_payment_status").on(table.paymentStatus),
}));

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
  messageType: varchar("messageType", { length: 50 }).default('text').notNull(),
  metadata: json("metadata"),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  lastReadAt: timestamp("lastReadAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  bookingIdx: index("idx_messages_booking").on(table.bookingId),
  senderIdx: index("idx_messages_sender").on(table.senderId),
  recipientIdx: index("idx_messages_recipient").on(table.recipientId),
  recipientUnreadIdx: index("idx_messages_recipient_unread").on(table.recipientId, table.isRead),
}));

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Reviews - artist reviews from venues
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").unique(),
  artistId: int("artistId").notNull(),
  venueId: int("venueId"),
  reviewerUserId: int("reviewerUserId"), // user ID of the reviewer (for profile-based reviews)
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  artistResponse: text("artistResponse"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  artistIdx: index("idx_reviews_artist").on(table.artistId),
  venueIdx: index("idx_reviews_venue").on(table.venueId),
  artistRatingIdx: index("idx_reviews_artist_rating").on(table.artistId, table.rating),
  reviewerUserIdx: index("idx_reviews_reviewer_user").on(table.reviewerUserId),
}));

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
  rating: int("rating").notNull(), // 1-5 overall
  professionalismRating: int("professionalismRating"), // 1-5
  soundQualityRating: int("soundQualityRating"), // 1-5
  greenRoomRating: int("greenRoomRating"), // 1-5
  paymentTimelinessRating: int("paymentTimelinessRating"), // 1-5
  comment: text("comment"),
  venueResponse: text("venueResponse"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  venueIdx: index("idx_venue_reviews_venue").on(table.venueId),
  artistIdx: index("idx_venue_reviews_artist").on(table.artistId),
}));

export type VenueReview = typeof venueReviews.$inferSelect;
export type InsertVenueReview = typeof venueReviews.$inferInsert;

/**
 * Artist Reviews - venues rate artists after completed bookings
 */
export const artistReviews = mysqlTable("artist_reviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull().unique(),
  venueId: int("venueId").notNull(),
  artistId: int("artistId").notNull(),
  rating: int("rating").notNull(), // 1-5 overall
  reliabilityRating: int("reliabilityRating"), // 1-5
  stagePresenceRating: int("stagePresenceRating"), // 1-5
  crowdEngagementRating: int("crowdEngagementRating"), // 1-5
  professionalismRating: int("professionalismRating"), // 1-5
  comment: text("comment"),
  artistResponse: text("artistResponse"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  venueIdx: index("idx_artist_reviews_venue").on(table.venueId),
  artistIdx: index("idx_artist_reviews_artist").on(table.artistId),
}));

export type ArtistReview = typeof artistReviews.$inferSelect;
export type InsertArtistReview = typeof artistReviews.$inferInsert;

/**
 * Profile Views - track artist profile visits
 */
export const profileViews = mysqlTable("profile_views", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
}, (table) => ({
  artistIdx: index("idx_profile_views_artist").on(table.artistId),
  viewedAtIdx: index("idx_profile_views_date").on(table.viewedAt),
}));

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
}, (table) => ({
  venueIdx: index("idx_favorites_venue").on(table.venueId),
  artistIdx: index("idx_favorites_artist").on(table.artistId),
  venueArtistIdx: index("idx_favorites_venue_artist").on(table.venueId, table.artistId),
}));

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Artist Follows - tracks which artists follow other artists
 */
export const artistFollows = mysqlTable("artist_follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(), // User ID of the artist who is following
  followingId: int("followingId").notNull(), // User ID of the artist being followed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArtistFollow = typeof artistFollows.$inferSelect;
export type InsertArtistFollow = typeof artistFollows.$inferInsert;

/**
 * Booking Templates - reusable booking request templates
 */
export const bookingTemplates = mysqlTable("booking_templates", {
  id: int("id").autoincrement().primaryKey(),
  venueId: int("venueId").notNull(), // indexed below
  templateName: varchar("templateName", { length: 255 }).notNull(),
  eventDetails: text("eventDetails"),
  totalFee: decimal("totalFee", { precision: 10, scale: 2 }),
  depositAmount: decimal("depositAmount", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  venueIdx: index("idx_booking_templates_venue").on(table.venueId),
}));

export type BookingTemplate = typeof bookingTemplates.$inferSelect;
export type InsertBookingTemplate = typeof bookingTemplates.$inferInsert;

/**
 * Booking Reminders - track sent reminders
 */
export const bookingReminders = mysqlTable("booking_reminders", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(), // indexed below
  reminderType: mysqlEnum("reminderType", ["7_days", "3_days", "1_day"]).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
}, (table) => ({
  bookingIdx: index("idx_booking_reminders_booking").on(table.bookingId),
}));

export type BookingReminder = typeof bookingReminders.$inferSelect;
export type InsertBookingReminder = typeof bookingReminders.$inferInsert;

/**
 * Contracts - digital contracts for bookings
 */
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull().unique(),
  artistId: int("artistId").notNull(), // indexed below
  venueId: int("venueId").notNull(), // indexed below
  contractData: json("contractData").$type<Record<string, any>>(),
  pdfUrl: text("pdfUrl"),
  riderTemplateId: int("riderTemplateId"),
  status: mysqlEnum("status", ["pending", "signed_by_artist", "signed_by_venue", "fully_signed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  artistIdx: index("idx_contracts_artist").on(table.artistId),
  venueIdx: index("idx_contracts_venue").on(table.venueId),
  statusIdx: index("idx_contracts_status").on(table.status),
}));

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

/**
 * Signatures - digital signatures on contracts
 */
export const signatures = mysqlTable("signatures", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(), // indexed below
  userId: int("userId").notNull(),
  signerRole: mysqlEnum("signerRole", ["artist", "venue"]),
  signerName: varchar("signerName", { length: 255 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  signatureData: text("signatureData").notNull(), // Base64 encoded signature image or typed name
  signedAt: timestamp("signedAt").defaultNow().notNull(),
}, (table) => ({
  contractIdx: index("idx_signatures_contract").on(table.contractId),
  userIdx: index("idx_signatures_user").on(table.userId),
}));

export type Signature = typeof signatures.$inferSelect;
export type InsertSignature = typeof signatures.$inferInsert;

/**
 * Referrals - track referral program
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredId: int("referredId"),
  referralCode: varchar("referralCode", { length: 32 }).unique().notNull(),
  status: mysqlEnum("status", ["pending", "completed", "rewarded"]).default("pending").notNull(),
  rewardAmount: decimal("rewardAmount", { precision: 10, scale: 2 }),
  convertedAt: timestamp("convertedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  referrerIdx: index("idx_referrals_referrer").on(table.referrerId),
  referredIdx: index("idx_referrals_referred").on(table.referredId),
}));

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Verification Badges - track artist verification status
 */
export const verificationBadges = mysqlTable("verification_badges", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull().unique(),
  completedBookings: int("completedBookings").default(0),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default('0'),
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
}, (table) => ({
  followerIdx: index("idx_follows_follower").on(table.followerId),
  followingIdx: index("idx_follows_following").on(table.followingId, table.followingType),
}));

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
  // Unsubscribe tracking for CAN-SPAM/GDPR compliance
  unsubscribeToken: varchar("unsubscribeToken", { length: 255 }).unique(),
  unsubscribedAt: timestamp("unsubscribedAt"),
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
}, (table) => ({
  userIdx: index("idx_notifications_user").on(table.userId),
  userUnreadIdx: index("idx_notifications_user_unread").on(table.userId, table.isRead),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;


/**
 * Artist Payouts - tracks payout requests and payments to artists
 */
export const artistPayouts = mysqlTable("artist_payouts", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(), // indexed below
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
}, (table) => ({
  artistIdx: index("idx_artist_payouts_artist").on(table.artistId),
  statusIdx: index("idx_artist_payouts_status").on(table.status),
}));
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
  artistId: int("artistId").notNull(), // indexed below
  bookingId: int("bookingId").notNull().unique(),
  grossAmount: decimal("grossAmount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }).notNull(),
  netAmount: decimal("netAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "paid_out"]).default("pending").notNull(),
  payoutId: int("payoutId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  artistIdx: index("idx_artist_earnings_artist").on(table.artistId),
  statusIdx: index("idx_artist_earnings_status").on(table.status),
}));
export type ArtistEarning = typeof artistEarnings.$inferSelect;
export type InsertArtistEarning = typeof artistEarnings.$inferInsert;

/**
 * Invoices - tracks generated invoices for bookings
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull().unique(),
  artistId: int("artistId").notNull(), // indexed below
  venueId: int("venueId").notNull(), // indexed below
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).unique().notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default('0'),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }).default('0'),
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
}, (table) => ({
  artistIdx: index("idx_invoices_artist").on(table.artistId),
  venueIdx: index("idx_invoices_venue").on(table.venueId),
  statusIdx: index("idx_invoices_status").on(table.status),
}));
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;



/**
 * Events - public event postings for artists' availability and bookings
 * Artists can post events they're available for, venues can discover and book
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(), // indexed below
  venueId: int("venueId"), // Venue that created/owns this event (null for artist-posted events)
  eventTitle: varchar("eventTitle", { length: 255 }).notNull(),
  eventType: mysqlEnum("eventType", ["arts_culture", "bar_gig", "concert", "corporate", "festival", "other", "private_party", "wedding"]).notNull(),
  eventDate: date("eventDate").notNull(),
  eventTime: varchar("eventTime", { length: 5 }), // HH:MM format
  eventEndTime: varchar("eventEndTime", { length: 5 }), // HH:MM format
  location: varchar("location", { length: 255 }),
  capacity: int("capacity"), // Expected audience size
  audienceType: varchar("audienceType", { length: 100 }), // 'corporate', 'wedding', 'general_public', 'private'
  rate: decimal("rate", { precision: 10, scale: 2 }), // Event rate in USD
  description: text("description"),
  coverImageUrl: text("coverImageUrl"), // Event flyer or promo image
  ticketLink: text("ticketLink"), // External ticket purchase URL
  eventSource: mysqlEnum("eventSource", ["artist_post", "venue_booking"]).default("venue_booking").notNull(), // Distinguish artist-posted events from venue bookings
  isPublic: boolean("isPublic").default(false).notNull(), // false = private booking only, true = public calendar
  status: mysqlEnum("status", ["available", "booked", "completed", "cancelled"]).default("available").notNull(),
  bookingId: int("bookingId"), // Link to booking if booked
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  artistIdx: index("idx_events_artist").on(table.artistId),
  venueIdx: index("idx_events_venue").on(table.venueId),
  eventDateIdx: index("idx_events_date").on(table.eventDate),
  statusIdx: index("idx_events_status").on(table.status),
  publicIdx: index("idx_events_public").on(table.isPublic, table.status),
}));

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Event Recurrence - for recurring events (weekly gigs, monthly residencies, etc.)
 */
export const eventRecurrence = mysqlTable("event_recurrence", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "biweekly", "monthly"]).notNull(),
  daysOfWeek: varchar("daysOfWeek", { length: 50 }), // 'MON,WED,FRI' for weekly
  endDate: date("endDate"), // When recurrence ends
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  eventIdx: index("idx_event_recurrence_event").on(table.eventId),
}));

export type EventRecurrence = typeof eventRecurrence.$inferSelect;
export type InsertEventRecurrence = typeof eventRecurrence.$inferInsert;

/**
 * Event History - tracks past events with attendance and details
 * Used for artist portfolio and event recap
 */
export const eventHistory = mysqlTable("event_history", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId"),
  bookingId: int("bookingId"), // Link to booking
  artistId: int("artistId").notNull(),
  venueId: int("venueId"),
  eventDate: date("eventDate").notNull(),
  attendeeCount: int("attendeeCount"), // Actual attendance
  notes: text("notes"), // Event recap/summary
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  artistIdx: index("idx_event_history_artist").on(table.artistId),
  eventDateIdx: index("idx_event_history_date").on(table.eventDate),
}));

export type EventHistory = typeof eventHistory.$inferSelect;
export type InsertEventHistory = typeof eventHistory.$inferInsert;

/**
 * Event Photos - media from events (post-event photos/videos)
 */
export const eventPhotos = mysqlTable("event_photos", {
  id: int("id").autoincrement().primaryKey(),
  eventHistoryId: int("eventHistoryId").notNull(),
  photoUrl: text("photoUrl").notNull(),
  caption: text("caption"),
  uploadedBy: int("uploadedBy"), // User ID who uploaded
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  eventHistoryIdx: index("idx_event_photos_history").on(table.eventHistoryId),
}));

export type EventPhoto = typeof eventPhotos.$inferSelect;
export type InsertEventPhoto = typeof eventPhotos.$inferInsert;

/**
 * Saved Events - allows venues to save events for later booking
 */
export const savedEvents = mysqlTable("saved_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Venue user saving the event
  eventId: int("eventId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userEventIdx: index("idx_saved_events_user_event").on(table.userId, table.eventId),
}));

export type SavedEvent = typeof savedEvents.$inferSelect;
export type InsertSavedEvent = typeof savedEvents.$inferInsert;


/**
 * Email Logs - tracks all outgoing emails for delivery verification
 */
export const emailLogs = mysqlTable("email_logs", {
  id: int("id").autoincrement().primaryKey(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(), // indexed below
  recipientName: varchar("recipientName", { length: 255 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  emailType: varchar("emailType", { length: 64 }).notNull(), // 'booking_request', 'booking_confirmation', etc.
  bookingId: int("bookingId"), // Link to booking if applicable
  userId: int("userId"), // Recipient user ID if applicable
  status: mysqlEnum("status", ["sent", "failed", "bounced", "opened", "clicked"]).default("sent").notNull(),
  messageId: varchar("messageId", { length: 255 }), // SendGrid message ID for tracking
  failureReason: text("failureReason"), // Error message if failed
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  deliveredAt: timestamp("deliveredAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  recipientIdx: index("idx_email_logs_recipient").on(table.recipientEmail),
  userIdx: index("idx_email_logs_user").on(table.userId),
  bookingIdx: index("idx_email_logs_booking").on(table.bookingId),
  statusIdx: index("idx_email_logs_status").on(table.status),
}));

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;


/**
 * Artist Updates - tracks email blasts sent by artists to their fans
 * Paid-tier artists can compose and send custom updates to their follower list.
 * Rate limited to 1 update per day per artist.
 */
export const artistUpdates = mysqlTable("artist_updates", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  recipientCount: int("recipientCount").default(0).notNull(),
  sentCount: int("sentCount").default(0).notNull(),
  failedCount: int("failedCount").default(0).notNull(),
  status: mysqlEnum("status", ["sending", "sent", "failed"]).default("sending").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  artistIdx: index("idx_artist_updates_artist").on(table.artistId),
  sentAtIdx: index("idx_artist_updates_sent_at").on(table.sentAt),
}));

export type ArtistUpdate = typeof artistUpdates.$inferSelect;
export type InsertArtistUpdate = typeof artistUpdates.$inferInsert;


/**
 * Artist Releases — single track uploads for direct-to-fan sales (White Label Release)
 * Gated behind paid subscription tiers (Starter: 2 active, Professional: unlimited)
 * Platform takes 1% revenue share on each sale.
 */
export const artistReleases = mysqlTable("artist_releases", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  genre: varchar("genre", { length: 100 }),

  // Audio files stored in S3
  audioFileKey: varchar("audioFileKey", { length: 512 }).notNull(),
  previewFileKey: varchar("previewFileKey", { length: 512 }),
  coverArtKey: varchar("coverArtKey", { length: 512 }).notNull(),

  // Audio metadata
  durationSeconds: int("durationSeconds").notNull(),
  fileFormat: varchar("fileFormat", { length: 10 }).notNull(),
  fileSizeBytes: int("fileSizeBytes").notNull(),

  // Pricing
  priceInCents: int("priceInCents").notNull(),
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  allowPayWhatYouWant: boolean("allowPayWhatYouWant").default(false).notNull(),

  // Status
  status: mysqlEnum("status", ["draft", "published", "taken_down", "archived"])
    .default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),

  // Rights certification
  rightsCertified: boolean("rightsCertified").default(false).notNull(),
  rightsCertifiedAt: timestamp("rightsCertifiedAt"),

  // Optional creator-provided AI-use disclosure. Disabled means unknown / not disclosed,
  // not a platform claim that AI was absent.
  aiUseDisclosureEnabled: boolean("aiUseDisclosureEnabled").default(false).notNull(),
  aiUseLevel: varchar("aiUseLevel", { length: 40 }),
  aiUseComponents: json("aiUseComponents").$type<string[]>(),
  aiUseTools: varchar("aiUseTools", { length: 300 }),
  aiUseNotes: varchar("aiUseNotes", { length: 1000 }),

  // Counters (denormalized for performance — avoids JOIN on every profile view)
  totalSales: int("totalSales").default(0).notNull(),
  totalRevenueCents: int("totalRevenueCents").default(0).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  artistIdx: index("idx_releases_artist").on(table.artistId),
  statusIdx: index("idx_releases_status").on(table.status),
  publishedIdx: index("idx_releases_published").on(table.publishedAt),
  artistStatusIdx: index("idx_releases_artist_status").on(table.artistId, table.status),
}));

export type ArtistRelease = typeof artistReleases.$inferSelect;
export type InsertArtistRelease = typeof artistReleases.$inferInsert;

/**
 * Release Purchases — tracks each single sale
 * Stores Stripe IDs + amount fields (justified for sales dashboard without API calls).
 * All other payment details fetched from Stripe on demand.
 */
export const releasePurchases = mysqlTable("release_purchases", {
  id: int("id").autoincrement().primaryKey(),
  releaseId: int("releaseId").notNull(),
  buyerEmail: varchar("buyerEmail", { length: 320 }).notNull(),
  buyerName: varchar("buyerName", { length: 255 }),
  buyerUserId: int("buyerUserId"),

  // Stripe references
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }).notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),

  // Amount (stored for reporting without API calls)
  amountPaidCents: int("amountPaidCents").notNull(),
  platformFeeCents: int("platformFeeCents").notNull(),
  artistNetCents: int("artistNetCents").notNull(),

  // Download tracking
  downloadCount: int("downloadCount").default(0).notNull(),
  maxDownloads: int("maxDownloads").default(5).notNull(),
  lastDownloadedAt: timestamp("lastDownloadedAt"),

  // Library management — soft-hide from player without deleting purchase record
  hiddenFromLibrary: boolean("hiddenFromLibrary").default(false).notNull(),

  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
}, (table) => ({
  releaseIdx: index("idx_purchases_release").on(table.releaseId),
  buyerEmailIdx: index("idx_purchases_buyer_email").on(table.buyerEmail),
  buyerUserIdx: index("idx_purchases_buyer_user").on(table.buyerUserId),
  sessionIdx: index("idx_purchases_session").on(table.stripeCheckoutSessionId),
}));

export type ReleasePurchase = typeof releasePurchases.$inferSelect;
export type InsertReleasePurchase = typeof releasePurchases.$inferInsert;

/**
 * Blog Posts — platform blog for announcements, guides, and news.
 */
export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  excerpt: varchar("excerpt", { length: 1000 }).notNull(),
  content: text("content").notNull(),
  coverImageUrl: varchar("coverImageUrl", { length: 1000 }),
  authorId: int("authorId").notNull(),
  authorName: varchar("authorName", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["announcement", "guide", "news", "update", "tutorial"]).default("announcement").notNull(),
  tags: json("tags").$type<string[]>().default([]),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  slugIdx: index("idx_blog_slug").on(table.slug),
  statusIdx: index("idx_blog_status").on(table.status),
  publishedAtIdx: index("idx_blog_published_at").on(table.publishedAt),
  categoryIdx: index("idx_blog_category").on(table.category),
  authorIdx: index("idx_blog_author").on(table.authorId),
}));
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;


/**
 * Password Reset Tokens - stores time-limited tokens for forgot-password flow
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index("idx_prt_token").on(table.token),
  userIdx: index("idx_prt_user").on(table.userId),
}));
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;


/**
 * Track Reviews — purchase-gated reviews for singles/releases.
 * Only users who purchased a release can leave one review (1-5 stars + short text).
 */
export const trackReviews = mysqlTable("track_reviews", {
  id: int("id").autoincrement().primaryKey(),
  releaseId: int("releaseId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(), // 1-5
  reviewText: varchar("reviewText", { length: 280 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  releaseIdx: index("idx_track_reviews_release").on(table.releaseId),
  userIdx: index("idx_track_reviews_user").on(table.userId),
  uniqueReview: unique("uniq_user_release_review").on(table.userId, table.releaseId),
}));
export type TrackReview = typeof trackReviews.$inferSelect;
export type InsertTrackReview = typeof trackReviews.$inferInsert;

/**
 * Unsubscribe Feedback — captures why users unsubscribe from emails.
 * Lightweight: one reason chip + optional free-text comment.
 */
export const unsubscribeFeedback = mysqlTable("unsubscribe_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),                                   // nullable for unauthenticated users
  email: varchar("email", { length: 320 }),                // captured from URL param or session
  reason: varchar("reason", { length: 100 }).notNull(),    // e.g. "too_many_emails", "not_relevant"
  comment: varchar("comment", { length: 500 }),            // optional free-text
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_unsub_feedback_user").on(table.userId),
  reasonIdx: index("idx_unsub_feedback_reason").on(table.reason),
}));
export type UnsubscribeFeedback = typeof unsubscribeFeedback.$inferSelect;
export type InsertUnsubscribeFeedback = typeof unsubscribeFeedback.$inferInsert;


/**
 * Booking Disputes — allows artists or venues to report issues with bookings.
 * Admin reviews and resolves disputes.
 */
export const bookingDisputes = mysqlTable("booking_disputes", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  reporterId: int("reporterId").notNull(),       // user who filed the dispute
  respondentId: int("respondentId").notNull(),    // the other party
  type: mysqlEnum("type", [
    "payment_issue",
    "no_show",
    "contract_violation",
    "quality_issue",
    "cancellation_dispute",
    "harassment",
    "other",
  ]).notNull(),
  description: text("description").notNull(),
  evidenceUrls: text("evidenceUrls"),             // JSON array of S3 URLs
  status: mysqlEnum("status", [
    "open",
    "under_review",
    "resolved",
    "dismissed",
  ]).default("open").notNull(),
  resolution: text("resolution"),                 // admin's resolution notes
  adminNotes: text("adminNotes"),                 // internal admin notes
  resolvedById: int("resolvedById"),              // admin who resolved it
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  bookingIdx: index("idx_disputes_booking").on(table.bookingId),
  reporterIdx: index("idx_disputes_reporter").on(table.reporterId),
  statusIdx: index("idx_disputes_status").on(table.status),
}));
export type BookingDispute = typeof bookingDisputes.$inferSelect;
export type InsertBookingDispute = typeof bookingDisputes.$inferInsert;


/**
 * Role Change Audit Log - tracks all role changes with full accountability
 */
export const roleChangeAuditLog = mysqlTable("role_change_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  targetUserId: int("targetUserId").notNull(),        // user whose role was changed
  targetEmail: varchar("targetEmail", { length: 320 }),
  targetName: text("targetName"),
  previousRole: varchar("previousRole", { length: 32 }).notNull(),
  newRole: varchar("newRole", { length: 32 }).notNull(),
  changedById: int("changedById").notNull(),           // admin who made the change
  changedByEmail: varchar("changedByEmail", { length: 320 }),
  changedByName: text("changedByName"),
  reason: text("reason"),                              // optional reason for the change
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  targetUserIdx: index("idx_audit_target_user").on(table.targetUserId),
  changedByIdx: index("idx_audit_changed_by").on(table.changedById),
  createdAtIdx: index("idx_audit_created_at").on(table.createdAt),
}));
export type RoleChangeAuditEntry = typeof roleChangeAuditLog.$inferSelect;
export type InsertRoleChangeAuditEntry = typeof roleChangeAuditLog.$inferInsert;


/**
 * Admin Activity Log - tracks all admin actions for platform accountability
 */
export const adminActivityLog = mysqlTable("admin_activity_log", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("admin_id").notNull(),
  adminEmail: varchar("admin_email", { length: 320 }).notNull(),
  adminName: varchar("admin_name", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(), // e.g. 'role_change', 'booking_update', 'payout_processed', 'blog_published', 'user_suspended', 'dispute_resolved'
  category: mysqlEnum("category", ["users", "bookings", "payouts", "blog", "disputes", "releases", "settings"]).notNull(),
  targetType: varchar("target_type", { length: 50 }), // 'user', 'booking', 'blog_post', 'payout', 'dispute', 'release'
  targetId: varchar("target_id", { length: 100 }), // ID of the affected entity
  targetLabel: varchar("target_label", { length: 255 }), // Human-readable label (e.g. user email, post title)
  details: text("details"), // JSON string with action-specific details
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  adminIdx: index("idx_admin_activity_admin").on(table.adminId),
  categoryIdx: index("idx_admin_activity_category").on(table.category),
  actionIdx: index("idx_admin_activity_action").on(table.action),
  createdAtIdx: index("idx_admin_activity_created").on(table.createdAt),
}));


/**
 * Ticket Tiers - defines ticket types and pricing for events
 * Each event can have multiple tiers (e.g., General Admission, VIP, Early Bird)
 */
export const ticketTiers = mysqlTable("ticket_tiers", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "General Admission", "VIP", "Early Bird"
  description: text("description"),
  price: int("price").notNull(), // Price in cents (e.g., 2500 = $25.00)
  quantity: int("quantity").notNull(), // Total tickets available for this tier
  quantitySold: int("quantitySold").default(0).notNull(), // Tickets sold so far
  maxPerOrder: int("maxPerOrder").default(10).notNull(), // Max tickets per single order
  salesStartDate: timestamp("salesStartDate"), // When tickets go on sale (null = immediately)
  salesEndDate: timestamp("salesEndDate"), // When sales end (null = event date)
  sortOrder: int("sortOrder").default(0).notNull(), // Display order
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  eventIdx: index("idx_ticket_tiers_event").on(table.eventId),
  activeIdx: index("idx_ticket_tiers_active").on(table.eventId, table.isActive),
}));

export type TicketTier = typeof ticketTiers.$inferSelect;
export type InsertTicketTier = typeof ticketTiers.$inferInsert;

/**
 * Ticket Orders - tracks ticket purchases via Stripe
 * Each order can contain multiple tickets across different tiers
 */
export const ticketOrders = mysqlTable("ticket_orders", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  buyerUserId: int("buyerUserId"), // Nullable for guest checkout
  buyerEmail: varchar("buyerEmail", { length: 320 }).notNull(),
  buyerName: varchar("buyerName", { length: 255 }),
  buyerPhone: varchar("buyerPhone", { length: 20 }),
  status: mysqlEnum("status", ["pending", "completed", "cancelled", "refunded"]).default("pending").notNull(),
  totalAmount: int("totalAmount").notNull(), // Total in cents
  platformFee: int("platformFee").notNull(), // Platform fee in cents ($0.99 per ticket)
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  orderNumber: varchar("orderNumber", { length: 20 }).unique().notNull(), // Human-readable order number
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  eventIdx: index("idx_ticket_orders_event").on(table.eventId),
  buyerIdx: index("idx_ticket_orders_buyer").on(table.buyerUserId),
  statusIdx: index("idx_ticket_orders_status").on(table.status),
  stripeSessionIdx: index("idx_ticket_orders_stripe").on(table.stripeCheckoutSessionId),
  orderNumberIdx: index("idx_ticket_orders_number").on(table.orderNumber),
}));

export type TicketOrder = typeof ticketOrders.$inferSelect;
export type InsertTicketOrder = typeof ticketOrders.$inferInsert;

/**
 * Ticket Items - individual tickets within an order
 * Each item represents one ticket with a unique QR code for validation
 */
export const ticketItems = mysqlTable("ticket_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  tierId: int("tierId").notNull(),
  eventId: int("eventId").notNull(),
  ticketCode: varchar("ticketCode", { length: 36 }).unique().notNull(), // UUID for QR code
  attendeeName: varchar("attendeeName", { length: 255 }),
  attendeeEmail: varchar("attendeeEmail", { length: 320 }),
  status: mysqlEnum("status", ["valid", "used", "cancelled", "refunded"]).default("valid").notNull(),
  checkedInAt: timestamp("checkedInAt"), // When the ticket was scanned/used
  checkedInBy: int("checkedInBy"), // User who scanned the ticket
  price: int("price").notNull(), // Price paid in cents (snapshot at purchase time)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  orderIdx: index("idx_ticket_items_order").on(table.orderId),
  tierIdx: index("idx_ticket_items_tier").on(table.tierId),
  eventIdx: index("idx_ticket_items_event").on(table.eventId),
  codeIdx: index("idx_ticket_items_code").on(table.ticketCode),
  statusIdx: index("idx_ticket_items_status").on(table.status),
}));

export type TicketItem = typeof ticketItems.$inferSelect;
export type InsertTicketItem = typeof ticketItems.$inferInsert;


/**
 * Ticket Promo Codes - event-specific discount codes
 * Event creators can create promo codes to offer discounts on tickets
 */
export const ticketPromoCodes = mysqlTable("ticket_promo_codes", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  code: varchar("code", { length: 50 }).notNull(), // e.g., "EARLYBIRD20"
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).notNull(), // percentage or fixed amount
  discountValue: int("discountValue").notNull(), // Percentage (e.g., 20 = 20%) or cents (e.g., 500 = $5.00)
  maxUses: int("maxUses"), // null = unlimited
  currentUses: int("currentUses").default(0).notNull(),
  minTickets: int("minTickets").default(1).notNull(), // Minimum tickets in order to apply
  expiresAt: timestamp("expiresAt"), // null = no expiry
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  eventIdx: index("idx_promo_codes_event").on(table.eventId),
  codeIdx: index("idx_promo_codes_code").on(table.eventId, table.code),
}));

export type TicketPromoCode = typeof ticketPromoCodes.$inferSelect;
export type InsertTicketPromoCode = typeof ticketPromoCodes.$inferInsert;

/**
 * Ticket Transfers - track ticket gifting/transfers between users
 */
export const ticketTransfers = mysqlTable("ticket_transfers", {
  id: int("id").autoincrement().primaryKey(),
  ticketItemId: int("ticketItemId").notNull(),
  fromEmail: varchar("fromEmail", { length: 320 }).notNull(),
  toEmail: varchar("toEmail", { length: 320 }).notNull(),
  toName: varchar("toName", { length: 255 }),
  status: mysqlEnum("status", ["pending", "accepted", "cancelled"]).default("pending").notNull(),
  transferCode: varchar("transferCode", { length: 36 }).unique().notNull(), // UUID for acceptance link
  message: text("message"), // Optional personal message from sender
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
}, (table) => ({
  ticketIdx: index("idx_transfers_ticket").on(table.ticketItemId),
  toEmailIdx: index("idx_transfers_to_email").on(table.toEmail),
  codeIdx: index("idx_transfers_code").on(table.transferCode),
}));

export type TicketTransfer = typeof ticketTransfers.$inferSelect;
export type InsertTicketTransfer = typeof ticketTransfers.$inferInsert;


/**
 * Tour Availability - tracks artist touring preferences and availability
 * Artists can signal they're available for touring, specify target regions,
 * date windows, travel radius, and tour types they're interested in.
 */
export const tourAvailability = mysqlTable("tour_availability", {
  id: int("id").autoincrement().primaryKey(),
  artistProfileId: int("artistProfileId").notNull().unique(),
  isAvailable: boolean("isAvailable").default(false).notNull(),
  /** Target regions/states where the artist wants to tour (JSON array of strings) */
  targetRegions: json("targetRegions").$type<string[]>(),
  /** Home base city for radius calculations */
  homeBase: varchar("homeBase", { length: 255 }),
  /** Travel radius preference */
  travelRadius: mysqlEnum("travelRadius", ["local", "regional", "national", "international"]).default("regional"),
  /** Tour types the artist is open to */
  tourTypes: json("tourTypes").$type<string[]>(),
  /** Available date windows for touring */
  dateWindows: json("dateWindows").$type<{ start: string; end: string }[]>(),
  /** Optional note about touring preferences */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  artistIdx: index("idx_tour_avail_artist").on(table.artistProfileId),
  availableIdx: index("idx_tour_avail_available").on(table.isAvailable),
}));

export type TourAvailability = typeof tourAvailability.$inferSelect;
export type InsertTourAvailability = typeof tourAvailability.$inferInsert;


/**
 * Venue Contracts - contracts uploaded/created by venues for artists to sign
 * Complements the existing rider contracts (artist → venue) with venue agreements (venue → artist)
 */
export const venueContracts = mysqlTable("venue_contracts", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  venueId: int("venueId").notNull(),
  artistId: int("artistId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  /** 'uploaded_pdf' = venue uploaded a PDF, 'platform_generated' = created via platform form */
  contractType: mysqlEnum("contractType", ["uploaded_pdf", "platform_generated"]).default("platform_generated").notNull(),
  /** S3 URL for uploaded PDF contracts */
  fileUrl: text("fileUrl"),
  /** JSON data for platform-generated contracts (terms, clauses, etc.) */
  contractData: json("contractData").$type<Record<string, any>>(),
  /** Contract status tracking */
  status: mysqlEnum("status", ["draft", "sent", "viewed", "signed_by_venue", "signed_by_artist", "fully_signed", "declined"]).default("draft").notNull(),
  /** When the contract was sent to the artist */
  sentAt: timestamp("sentAt"),
  /** When the artist first viewed the contract */
  viewedAt: timestamp("viewedAt"),
  /** Optional expiration deadline for artist to sign */
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  bookingIdx: index("idx_venue_contracts_booking").on(table.bookingId),
  venueIdx: index("idx_venue_contracts_venue").on(table.venueId),
  artistIdx: index("idx_venue_contracts_artist").on(table.artistId),
  statusIdx: index("idx_venue_contracts_status").on(table.status),
}));

export type VenueContract = typeof venueContracts.$inferSelect;
export type InsertVenueContract = typeof venueContracts.$inferInsert;

/**
 * Venue Contract Signatures - e-signatures on venue contracts
 */
export const venueContractSignatures = mysqlTable("venue_contract_signatures", {
  id: int("id").autoincrement().primaryKey(),
  venueContractId: int("venueContractId").notNull(),
  userId: int("userId").notNull(),
  signerRole: mysqlEnum("signerRole", ["artist", "venue"]),
  signerName: varchar("signerName", { length: 255 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  signatureData: text("signatureData").notNull(),
  signedAt: timestamp("signedAt").defaultNow().notNull(),
}, (table) => ({
  contractIdx: index("idx_venue_contract_sigs_contract").on(table.venueContractId),
  userIdx: index("idx_venue_contract_sigs_user").on(table.userId),
}));

export type VenueContractSignature = typeof venueContractSignatures.$inferSelect;
export type InsertVenueContractSignature = typeof venueContractSignatures.$inferInsert;


/**
 * Referral Credits - account credits earned by referrers
 */
export const referralCredits = mysqlTable("referral_credits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["earned", "redeemed", "expired"]).notNull(),
  referralId: int("referralId"),
  description: varchar("description", { length: 255 }),
  expiresAt: timestamp("expiresAt"),
  expirationWarned: boolean("expirationWarned").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_referral_credits_user").on(table.userId),
  expiresIdx: index("idx_referral_credits_expires").on(table.expiresAt),
}));

export type ReferralCredit = typeof referralCredits.$inferSelect;
export type InsertReferralCredit = typeof referralCredits.$inferInsert;

/**
 * Saved Artists — venues can save/favorite artists for quick rebooking
 */
export const savedArtists = mysqlTable("saved_artists", {
  id: int("id").autoincrement().primaryKey(),
  venueId: int("venueId").notNull(), // venue profile ID
  artistId: int("artistId").notNull(), // artist profile ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  venueIdx: index("idx_saved_artists_venue").on(table.venueId),
  artistIdx: index("idx_saved_artists_artist").on(table.artistId),
  uniquePair: index("idx_saved_artists_unique").on(table.venueId, table.artistId),
}));

export type SavedArtist = typeof savedArtists.$inferSelect;
export type InsertSavedArtist = typeof savedArtists.$inferInsert;

/**
 * Rider Revisions - tracks proposed changes to rider contract fields.
 * Venues can propose changes before signing; artists approve or reject.
 */
export const riderRevisions = mysqlTable("rider_revisions", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  contractId: int("contractId").notNull(),
  proposedByUserId: int("proposedByUserId").notNull(),
  proposedByRole: varchar("proposedByRole", { length: 20 }).notNull(), // "artist" | "venue"
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  // Store changes as JSON: { fieldId: { oldValue, newValue, label } }
  changes: json("changes").notNull(),
  rejectionReason: text("rejectionReason"),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  bookingIdx: index("idx_rider_revisions_booking").on(table.bookingId),
  contractIdx: index("idx_rider_revisions_contract").on(table.contractId),
  statusIdx: index("idx_rider_revisions_status").on(table.status),
}));

export type RiderRevision = typeof riderRevisions.$inferSelect;
export type InsertRiderRevision = typeof riderRevisions.$inferInsert;

/**
 * Venue Blocked Dates - tracks dates when a venue is unavailable for bookings.
 * Venues can mark specific dates as blocked to prevent booking requests.
 */
export const venueBlockedDates = mysqlTable("venue_blocked_dates", {
  id: int("id").autoincrement().primaryKey(),
  venueId: int("venueId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  reason: varchar("reason", { length: 255 }), // Optional reason (e.g., "Private event", "Maintenance", "Holiday")
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  venueDateIdx: index("idx_venue_blocked_dates_venue_date").on(table.venueId, table.date),
}));

export type VenueBlockedDate = typeof venueBlockedDates.$inferSelect;
export type InsertVenueBlockedDate = typeof venueBlockedDates.$inferInsert;

/**
 * Venue Recurring Blocks - weekly recurring blocked days (e.g., "closed every Monday")
 */
export const venueRecurringBlocks = mysqlTable("venue_recurring_blocks", {
  id: int("id").autoincrement().primaryKey(),
  venueId: int("venueId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
  reason: varchar("reason", { length: 255 }), // e.g., "Closed", "Staff day off", "Maintenance"
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  venueIdx: index("idx_venue_recurring_blocks_venue").on(table.venueId),
}));

export type VenueRecurringBlock = typeof venueRecurringBlocks.$inferSelect;
export type InsertVenueRecurringBlock = typeof venueRecurringBlocks.$inferInsert;


/**
 * Venue Profile Views - tracks when someone views a venue's public profile
 */
export const venueProfileViews = mysqlTable("venue_profile_views", {
  id: int("id").autoincrement().primaryKey(),
  venueId: int("venueId").notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
}, (table) => ({
  venueIdx: index("idx_venue_profile_views_venue").on(table.venueId),
  viewedAtIdx: index("idx_venue_profile_views_date").on(table.viewedAt),
}));

export type VenueProfileView = typeof venueProfileViews.$inferSelect;
export type InsertVenueProfileView = typeof venueProfileViews.$inferInsert;


/**
 * Merch Items - artists sell merch, venues sell shop items/offers.
 * Images stored in S3. Items can use native OlogyWood checkout or an optional external store link.
 * Tier-gated: Pro = 6 items, Premium = 15 items, Free = 0.
 */
export const merchItems = mysqlTable("merch_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  userType: mysqlEnum("userType", ["artist", "venue"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  sellingMethod: mysqlEnum("sellingMethod", ["ologywood", "external"]).default("external").notNull(),
  priceDisplay: varchar("priceDisplay", { length: 50 }).notNull(), // Public display label; generated from price for native items
  priceInCents: int("priceInCents"), // Required for OlogyWood checkout items
  externalUrl: varchar("externalUrl", { length: 2048 }), // Optional; required only for external items
  productCategory: mysqlEnum("productCategory", ["merch", "book"]).default("merch").notNull(),
  bookFormat: mysqlEnum("bookFormat", ["paperback", "hardcover", "ebook"]),
  isbn: varchar("isbn", { length: 32 }),
  publisher: varchar("publisher", { length: 255 }),
  publicationDate: date("publicationDate", { mode: "string" }),
  edition: varchar("edition", { length: 100 }),
  pageCount: int("pageCount"),
  language: varchar("language", { length: 100 }),
  isSigned: boolean("isSigned").default(false).notNull(),
  ebookFileKey: varchar("ebookFileKey", { length: 1024 }), // Private S3 key; never expose publicly
  ebookFileName: varchar("ebookFileName", { length: 255 }),
  ebookFileSize: int("ebookFileSize"),
  ebookMimeType: varchar("ebookMimeType", { length: 100 }),
  ebookFileFormat: mysqlEnum("ebookFileFormat", ["pdf", "epub"]),
  ebookRightsConfirmed: boolean("ebookRightsConfirmed").default(false).notNull(),
  ebookRightsConfirmedAt: timestamp("ebookRightsConfirmedAt"),
  imageUrls: json("imageUrls").$type<string[]>().default([]),
  variants: json("variants").$type<Array<{ name: string; options: string[] }>>().default([]),
  trackInventory: boolean("trackInventory").default(false).notNull(),
  inventoryQuantity: int("inventoryQuantity"),
  shippingAvailable: boolean("shippingAvailable").default(true).notNull(),
  pickupAvailable: boolean("pickupAvailable").default(false).notNull(),
  shippingAmountCents: int("shippingAmountCents").default(0).notNull(),
  fulfillmentTime: varchar("fulfillmentTime", { length: 100 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("idx_merch_items_user").on(table.userId, table.userType),
  activeIdx: index("idx_merch_items_active").on(table.userId, table.isActive),
  categoryIdx: index("idx_merch_items_category").on(table.productCategory, table.bookFormat, table.isActive),
}));

export type MerchItem = typeof merchItems.$inferSelect;
export type InsertMerchItem = typeof merchItems.$inferInsert;

/**
 * Merch Orders - native OlogyWood merch checkout orders.
 * The creator handles fulfillment; OlogyWood handles payment, records, and status communication.
 */
export const merchOrders = mysqlTable("merch_orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 24 }).unique().notNull(),
  sellerUserId: int("sellerUserId").notNull(),
  sellerType: mysqlEnum("sellerType", ["artist", "venue"]).notNull(),
  buyerUserId: int("buyerUserId"), // Nullable for guest checkout
  buyerEmail: varchar("buyerEmail", { length: 320 }).notNull(),
  buyerName: varchar("buyerName", { length: 255 }).notNull(),
  buyerPhone: varchar("buyerPhone", { length: 30 }),
  fulfillmentMethod: mysqlEnum("fulfillmentMethod", ["shipping", "pickup", "digital"]).notNull(),
  shippingAddress: json("shippingAddress").$type<{
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }>(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  status: mysqlEnum("status", ["new", "confirmed", "preparing", "shipped", "ready_for_pickup", "completed", "cancelled", "refunded"]).default("new").notNull(),
  subtotalCents: int("subtotalCents").notNull(),
  shippingCents: int("shippingCents").default(0).notNull(),
  totalCents: int("totalCents").notNull(),
  platformFeeCents: int("platformFeeCents").notNull(),
  sellerNetCents: int("sellerNetCents").notNull(),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }).unique(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  trackingNumber: varchar("trackingNumber", { length: 255 }),
  trackingCarrier: varchar("trackingCarrier", { length: 100 }),
  trackingUrl: varchar("trackingUrl", { length: 2048 }),
  pickupNotes: text("pickupNotes"),
  fulfillmentNotes: text("fulfillmentNotes"),
  customerNote: text("customerNote"),
  paidAt: timestamp("paidAt"),
  fulfilledAt: timestamp("fulfilledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  sellerIdx: index("idx_merch_orders_seller").on(table.sellerUserId, table.status),
  buyerIdx: index("idx_merch_orders_buyer").on(table.buyerUserId),
  buyerEmailIdx: index("idx_merch_orders_buyer_email").on(table.buyerEmail),
  statusIdx: index("idx_merch_orders_status").on(table.status),
  stripeSessionIdx: index("idx_merch_orders_stripe_session").on(table.stripeCheckoutSessionId),
  orderNumberIdx: index("idx_merch_orders_number").on(table.orderNumber),
}));

export type MerchOrder = typeof merchOrders.$inferSelect;
export type InsertMerchOrder = typeof merchOrders.$inferInsert;

/**
 * Merch Order Items - immutable product/variant/price snapshots for each order.
 */
export const merchOrderItems = mysqlTable("merch_order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  merchItemId: int("merchItemId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 2048 }),
  selectedVariants: json("selectedVariants").$type<Record<string, string>>().default({}),
  quantity: int("quantity").notNull(),
  unitPriceCents: int("unitPriceCents").notNull(),
  lineTotalCents: int("lineTotalCents").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  orderIdx: index("idx_merch_order_items_order").on(table.orderId),
  merchItemIdx: index("idx_merch_order_items_item").on(table.merchItemId),
}));

export type MerchOrderItem = typeof merchOrderItems.$inferSelect;
export type InsertMerchOrderItem = typeof merchOrderItems.$inferInsert;

/**
 * Book Download Access - purchase-authorized access to private eBook objects.
 * One access row is granted for each paid eBook order line. Public product
 * responses never include the private S3 key stored on merch_items.
 */
export const bookDownloadAccess = mysqlTable("book_download_access", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  orderItemId: int("orderItemId").notNull().unique(),
  merchItemId: int("merchItemId").notNull(),
  buyerUserId: int("buyerUserId"),
  buyerEmail: varchar("buyerEmail", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["active", "refunded", "revoked"]).default("active").notNull(),
  downloadCount: int("downloadCount").default(0).notNull(),
  maxDownloads: int("maxDownloads").default(5).notNull(),
  lastDownloadedAt: timestamp("lastDownloadedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  orderIdx: index("idx_book_download_order").on(table.orderId),
  itemIdx: index("idx_book_download_item").on(table.merchItemId),
  buyerIdx: index("idx_book_download_buyer").on(table.buyerUserId),
  emailIdx: index("idx_book_download_email").on(table.buyerEmail),
}));

export type BookDownloadAccess = typeof bookDownloadAccess.$inferSelect;
export type InsertBookDownloadAccess = typeof bookDownloadAccess.$inferInsert;


// ============= PROJECT PREVIEWS =============
export const projectPreviews = mysqlTable("project_previews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  releaseType: varchar("releaseType", { length: 50 }).notNull().default("album"), // album, ep, mixtape, deluxe, single_collection
  coverArtUrl: text("coverArtUrl"),
  releaseDate: date("releaseDate"),
  externalLink: text("externalLink"), // Spotify, Apple Music, Bandcamp, etc.
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, coming_soon, archived
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_project_previews_user").on(table.userId),
  statusIdx: index("idx_project_previews_status").on(table.userId, table.status),
}));

export type ProjectPreview = typeof projectPreviews.$inferSelect;
export type InsertProjectPreview = typeof projectPreviews.$inferInsert;

export const projectPreviewTracks = mysqlTable("project_preview_tracks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  trackNumber: int("trackNumber").notNull(),
  audioUrl: text("audioUrl"),
  durationSeconds: int("durationSeconds").notNull().default(30),
  playCount: int("playCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("idx_project_preview_tracks_project").on(table.projectId),
  orderIdx: index("idx_project_preview_tracks_order").on(table.projectId, table.trackNumber),
}));

export type ProjectPreviewTrack = typeof projectPreviewTracks.$inferSelect;
export type InsertProjectPreviewTrack = typeof projectPreviewTracks.$inferInsert;

/**
 * Sponsor Slots — artists on Enterprise tier can showcase up to 5 sponsors
 */
export const sponsorSlots = mysqlTable("sponsor_slots", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(),
  sponsorName: varchar("sponsorName", { length: 200 }).notNull(),
  sponsorLogoUrl: varchar("sponsorLogoUrl", { length: 512 }).notNull(),
  sponsorWebsite: varchar("sponsorWebsite", { length: 512 }),
  sponsorDescription: varchar("sponsorDescription", { length: 500 }),
  displayOrder: int("displayOrder").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  artistIdx: index("idx_sponsor_slots_artist").on(table.artistId),
  activeIdx: index("idx_sponsor_slots_active").on(table.artistId, table.isActive),
}));
export type SponsorSlot = typeof sponsorSlots.$inferSelect;
export type InsertSponsorSlot = typeof sponsorSlots.$inferInsert;

/**
 * Sponsor Analytics — tracks impressions and clicks for each sponsor slot
 */
export const sponsorAnalytics = mysqlTable("sponsor_analytics", {
  id: int("id").autoincrement().primaryKey(),
  sponsorSlotId: int("sponsorSlotId").notNull(),
  artistId: int("artistId").notNull(),
  eventType: mysqlEnum("eventType", ["impression", "click"]).notNull(),
  eventDate: timestamp("eventDate").defaultNow().notNull(),
  source: varchar("source", { length: 100 }), // 'profile', 'event_page', 'ticket_confirmation', 'media_kit'
  viewerUserId: int("viewerUserId"), // null for anonymous views
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  slotIdx: index("idx_sponsor_analytics_slot").on(table.sponsorSlotId),
  artistIdx: index("idx_sponsor_analytics_artist").on(table.artistId),
  dateIdx: index("idx_sponsor_analytics_date").on(table.eventDate),
}));
export type SponsorAnalytic = typeof sponsorAnalytics.$inferSelect;
export type InsertSponsorAnalytic = typeof sponsorAnalytics.$inferInsert;

/**
 * Media Kit — auto-generated media kit data for Enterprise artists
 */
export const mediaKits = mysqlTable("media_kits", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull().unique(),
  bio: text("bio"),
  pressPhotos: json("pressPhotos").$type<string[]>(), // Array of photo URLs
  socialStats: json("socialStats").$type<{ platform: string; followers: number; url: string }[]>(),
  achievements: json("achievements").$type<string[]>(), // Notable achievements
  genres: json("genres").$type<string[]>(),
  monthlyListeners: int("monthlyListeners"),
  totalStreams: int("totalStreams"),
  averageEventAttendance: int("averageEventAttendance"),
  contactEmail: varchar("contactEmail", { length: 320 }),
  managementContact: varchar("managementContact", { length: 320 }),
  bookingContact: varchar("bookingContact", { length: 320 }),
  isPublic: boolean("isPublic").notNull().default(false),
  lastGeneratedAt: timestamp("lastGeneratedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  artistIdx: index("idx_media_kits_artist").on(table.artistId),
}));
export type MediaKit = typeof mediaKits.$inferSelect;
export type InsertMediaKit = typeof mediaKits.$inferInsert;


/**
 * Venue Sponsor Packages — venues define sponsorship opportunities they offer
 */
export const venueSponsorPackages = mysqlTable("venue_sponsor_packages", {
  id: int("id").autoincrement().primaryKey(),
  venueId: int("venueId").notNull(),
  name: varchar("name", { length: 200 }).notNull(), // e.g. "Main Stage Banner", "Bar Sponsor"
  description: text("description"),
  packageType: mysqlEnum("packageType", ["title_sponsor", "stage_sponsor", "bar_sponsor", "digital_signage", "event_mention", "custom"]).notNull().default("custom"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: mysqlEnum("duration", ["per_event", "weekly", "monthly", "quarterly", "yearly"]).notNull().default("monthly"),
  benefits: json("benefits").$type<string[]>(), // List of what the sponsor gets
  maxSlots: int("maxSlots").notNull().default(1), // How many sponsors can fill this package
  filledSlots: int("filledSlots").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  tier: mysqlEnum("tier", ["bronze", "silver", "gold", "platinum", "custom"]).notNull().default("custom"), // Sponsorship tier level
  category: varchar("category", { length: 100 }), // Custom category label
  imageUrl: varchar("imageUrl", { length: 512 }), // Example placement photo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  venueIdx: index("idx_venue_sponsor_packages_venue").on(table.venueId),
  activeIdx: index("idx_venue_sponsor_packages_active").on(table.venueId, table.isActive),
  typeIdx: index("idx_venue_sponsor_packages_type").on(table.packageType),
}));
export type VenueSponsorPackage = typeof venueSponsorPackages.$inferSelect;
export type InsertVenueSponsorPackage = typeof venueSponsorPackages.$inferInsert;

/**
 * Venue Sponsor Applications — brands/businesses apply to sponsor a venue
 */
export const venueSponsorApplications = mysqlTable("venue_sponsor_applications", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull(),
  venueId: int("venueId").notNull(),
  applicantUserId: int("applicantUserId"), // If the applicant is a registered user
  companyName: varchar("companyName", { length: 200 }).notNull(),
  contactName: varchar("contactName", { length: 200 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 50 }),
  companyWebsite: varchar("companyWebsite", { length: 512 }),
  companyLogoUrl: varchar("companyLogoUrl", { length: 512 }),
  promoMaterialUrls: json("promoMaterialUrls").$type<string[]>(), // URLs to promo images/PDFs
  message: text("message"), // Why they want to sponsor
  status: mysqlEnum("status", ["pending", "approved", "rejected", "expired"]).notNull().default("pending"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  packageIdx: index("idx_venue_sponsor_apps_package").on(table.packageId),
  venueIdx: index("idx_venue_sponsor_apps_venue").on(table.venueId),
  statusIdx: index("idx_venue_sponsor_apps_status").on(table.venueId, table.status),
  applicantIdx: index("idx_venue_sponsor_apps_applicant").on(table.applicantUserId),
}));
export type VenueSponsorApplication = typeof venueSponsorApplications.$inferSelect;
export type InsertVenueSponsorApplication = typeof venueSponsorApplications.$inferInsert;

/**
 * Active Venue Sponsors — approved sponsors currently displayed at the venue
 */
export const venueActiveSponsors = mysqlTable("venue_active_sponsors", {
  id: int("id").autoincrement().primaryKey(),
  venueId: int("venueId").notNull(),
  packageId: int("packageId").notNull(),
  applicationId: int("applicationId").notNull(),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  companyLogoUrl: varchar("companyLogoUrl", { length: 512 }).notNull(),
  companyWebsite: varchar("companyWebsite", { length: 512 }),
  companyDescription: varchar("companyDescription", { length: 500 }),
  displayOrder: int("displayOrder").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  venueIdx: index("idx_venue_active_sponsors_venue").on(table.venueId),
  activeIdx: index("idx_venue_active_sponsors_active").on(table.venueId, table.isActive),
  packageIdx: index("idx_venue_active_sponsors_package").on(table.packageId),
}));
export type VenueActiveSponsor = typeof venueActiveSponsors.$inferSelect;
export type InsertVenueActiveSponsor = typeof venueActiveSponsors.$inferInsert;


// ============ VENUE SPONSOR MESSAGES ============
export const venueSponsorMessages = mysqlTable("venue_sponsor_messages", {
  id: int("id").primaryKey().autoincrement(),
  applicationId: int("applicationId").notNull(),
  senderUserId: int("senderUserId").notNull(),
  senderRole: mysqlEnum("senderRole", ["venue", "sponsor"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  applicationIdx: index("idx_sponsor_messages_application").on(table.applicationId),
  senderIdx: index("idx_sponsor_messages_sender").on(table.senderUserId),
}));
export type VenueSponsorMessage = typeof venueSponsorMessages.$inferSelect;
export type InsertVenueSponsorMessage = typeof venueSponsorMessages.$inferInsert;


/**
 * Artist Team Members - tracks who has access to manage an artist profile.
 * Roles: owner (the artist themselves), manager, team_member
 */
export const artistTeamMembers = mysqlTable("artist_team_members", {
  id: int("id").autoincrement().primaryKey(),
  artistProfileId: int("artistProfileId").notNull(), // references artistProfiles.id
  userId: int("userId").notNull(), // references users.id
  role: mysqlEnum("teamRole", ["owner", "manager", "team_member"]).notNull().default("team_member"),
  permissions: json("permissions").$type<{
    editProfile: boolean;
    manageBookings: boolean;
    sendMessages: boolean;
    manageCalendar: boolean;
    uploadMedia: boolean;
    viewEarnings: boolean;
    manageTeam: boolean;
  }>(),
  invitedByUserId: int("invitedByUserId"), // who invited this member
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  artistProfileIdx: index("idx_team_members_artist").on(table.artistProfileId),
  userIdx: index("idx_team_members_user").on(table.userId),
  uniqueMember: unique("uniq_artist_team_member").on(table.artistProfileId, table.userId),
}));
export type ArtistTeamMember = typeof artistTeamMembers.$inferSelect;
export type InsertArtistTeamMember = typeof artistTeamMembers.$inferInsert;


/**
 * Content Releases - the core of the creator commerce system.
 * A release represents any monetizable content a creator wants to sell/share.
 * The content itself lives externally (YouTube, Vimeo, Spotify, etc.)
 * OlogyWood handles the business model and access control.
 * NOTE: This is separate from artistReleases (audio track sales hosted on S3).
 */
export const contentReleases = mysqlTable("releases", {
  id: int("id").autoincrement().primaryKey(),
  artistProfileId: int("artistProfileId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  releaseType: varchar("releaseType", { length: 50 }).notNull(),
  genre: varchar("genre", { length: 100 }),
  duration: varchar("duration", { length: 50 }),
  thumbnailUrl: text("thumbnailUrl"),
  trailerUrl: text("trailerUrl"),
  hostingPlatform: varchar("hostingPlatform", { length: 50 }).notNull(),
  contentUrl: text("contentUrl").notNull(),
  accessModel: varchar("accessModel", { length: 50 }).notNull().default("free"),
  price: decimal("price", { precision: 10, scale: 2 }),
  minPrice: decimal("minPrice", { precision: 10, scale: 2 }),
  premiereDate: timestamp("premiereDate"),
  isPublished: boolean("isPublished").default(false).notNull(),
  includesLiveQA: boolean("includesLiveQA").default(false).notNull(),
  includesBonusContent: boolean("includesBonusContent").default(false).notNull(),
  bonusContentDescription: text("bonusContentDescription"),
  // Optional creator-provided AI-use disclosure. Disabled means unknown / not disclosed,
  // not a platform claim that AI was absent.
  aiUseDisclosureEnabled: boolean("aiUseDisclosureEnabled").default(false).notNull(),
  aiUseLevel: varchar("aiUseLevel", { length: 40 }),
  aiUseComponents: json("aiUseComponents").$type<string[]>(),
  aiUseTools: varchar("aiUseTools", { length: 300 }),
  aiUseNotes: varchar("aiUseNotes", { length: 1000 }),
  stripeProductId: varchar("stripeProductId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  viewCount: int("viewCount").default(0).notNull(),
  purchaseCount: int("purchaseCount").default(0).notNull(),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  artistIdx: index("idx_content_releases_artist").on(table.artistProfileId),
  userIdx: index("idx_content_releases_user").on(table.userId),
  typeIdx: index("idx_content_releases_type").on(table.releaseType),
  publishedIdx: index("idx_content_releases_published").on(table.isPublished),
}));

export type ContentRelease = typeof contentReleases.$inferSelect;
export type InsertContentRelease = typeof contentReleases.$inferInsert;

/**
 * Content Release Purchases - tracks who has purchased/unlocked a content release
 */
export const contentReleasePurchases = mysqlTable("content_release_purchases", {
  id: int("id").autoincrement().primaryKey(),
  releaseId: int("releaseId").notNull(),
  userId: int("userId").notNull(),
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  accessGrantedAt: timestamp("accessGrantedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  releaseIdx: index("idx_content_purchases_release").on(table.releaseId),
  userIdx: index("idx_content_purchases_user").on(table.userId),
  uniquePurchase: unique("uniq_content_release_purchase").on(table.releaseId, table.userId),
}));

export type ContentReleasePurchase = typeof contentReleasePurchases.$inferSelect;
export type InsertContentReleasePurchase = typeof contentReleasePurchases.$inferInsert;

/**
 * Artist Team Invitations - pending invitations sent by email.
 */
export const artistTeamInvitations = mysqlTable("artist_team_invitations", {
  id: int("id").autoincrement().primaryKey(),
  artistProfileId: int("artistProfileId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("inviteRole", ["manager", "team_member"]).notNull().default("team_member"),
  token: varchar("token", { length: 64 }).notNull().unique(),
  status: mysqlEnum("inviteStatus", ["pending", "accepted", "declined", "expired"]).notNull().default("pending"),
  invitedByUserId: int("invitedByUserId").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  artistProfileIdx: index("idx_team_invitations_artist").on(table.artistProfileId),
  tokenIdx: index("idx_team_invitations_token").on(table.token),
  emailIdx: index("idx_team_invitations_email").on(table.email),
}));
export type ArtistTeamInvitation = typeof artistTeamInvitations.$inferSelect;
export type InsertArtistTeamInvitation = typeof artistTeamInvitations.$inferInsert;

/**
 * Artist Team Activity Log - audit trail for team actions.
 */
export const artistTeamActivityLog = mysqlTable("artist_team_activity_log", {
  id: int("id").autoincrement().primaryKey(),
  artistProfileId: int("artistProfileId").notNull(),
  userId: int("userId").notNull(), // who performed the action
  action: varchar("action", { length: 100 }).notNull(), // e.g. 'profile_edited', 'booking_accepted', 'media_uploaded'
  details: json("details").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  artistProfileIdx: index("idx_team_activity_artist").on(table.artistProfileId),
  userIdx: index("idx_team_activity_user").on(table.userId),
}));
export type ArtistTeamActivityLog = typeof artistTeamActivityLog.$inferSelect;
export type InsertArtistTeamActivityLog = typeof artistTeamActivityLog.$inferInsert;


/**
 * Google Calendar Integration — stores OAuth tokens for artists who connect their Google Calendar.
 * Used for two-way sync: importing busy times as unavailable blocks.
 */
export const googleCalendarIntegrations = mysqlTable("google_calendar_integrations", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(),
  googleEmail: varchar("googleEmail", { length: 255 }),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken").notNull(),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  calendarId: varchar("calendarId", { length: 255 }).default("primary"),
  syncEnabled: boolean("syncEnabled").default(true),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  artistIdx: index("idx_gcal_artist").on(table.artistId),
}));
export type GoogleCalendarIntegration = typeof googleCalendarIntegrations.$inferSelect;
export type InsertGoogleCalendarIntegration = typeof googleCalendarIntegrations.$inferInsert;


/**
 * Fan Club Tiers — talent sets their own membership tiers
 */
export const fanClubTiers = mysqlTable("fan_club_tiers", {
  id: int("id").autoincrement().primaryKey(),
  talentUserId: int("talentUserId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  priceMonthly: int("priceMonthly").notNull(),
  description: text("description"),
  perks: json("perks").$type<string[]>(),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  stripeProductId: varchar("stripeProductId", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  artistUserId: int("artistUserId"),
  priceCents: int("priceCents").default(0),
}, (table) => ({
  talentIdx: index("idx_fan_club_tiers_talent").on(table.talentUserId),
}));
export type FanClubTier = typeof fanClubTiers.$inferSelect;
export type InsertFanClubTier = typeof fanClubTiers.$inferInsert;

/**
 * Fan Club Memberships — fan subscribes to a talent's tier
 */
export const fanClubMemberships = mysqlTable("fan_club_memberships", {
  id: int("id").autoincrement().primaryKey(),
  fanUserId: int("fanUserId").notNull(),
  talentUserId: int("talentUserId").notNull(),
  tierId: int("tierId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  status: mysqlEnum("status", ["active", "cancelled", "past_due", "incomplete"]).default("active").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  cancelledAt: timestamp("cancelledAt"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  artistUserId: int("artistUserId"),
}, (table) => ({
  fanIdx: index("idx_fan_club_memberships_fan").on(table.fanUserId),
  talentIdx: index("idx_fan_club_memberships_talent").on(table.talentUserId),
  tierIdx: index("idx_fan_club_memberships_tier").on(table.tierId),
  uniqueMembership: index("idx_fan_club_unique_membership").on(table.fanUserId, table.talentUserId),
}));
export type FanClubMembership = typeof fanClubMemberships.$inferSelect;
export type InsertFanClubMembership = typeof fanClubMemberships.$inferInsert;

/**
 * Fan Club Posts — exclusive content from talent
 */
export const fanClubPosts = mysqlTable("fan_club_posts", {
  id: int("id").autoincrement().primaryKey(),
  talentUserId: int("talentUserId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  mediaUrl: text("mediaUrl"),
  mediaType: mysqlEnum("mediaType", ["image", "video", "audio", "none"]).default("none").notNull(),
  visibility: mysqlEnum("visibility", ["public", "members_only", "tier_specific"]).default("members_only").notNull(),
  requiredTierId: int("requiredTierId"),
  likesCount: int("likesCount").default(0).notNull(),
  commentsCount: int("commentsCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  artistUserId: int("artistUserId"),
  contentCategory: varchar("contentCategory", { length: 50 }),
}, (table) => ({
  talentIdx: index("idx_fan_club_posts_talent").on(table.talentUserId),
  visibilityIdx: index("idx_fan_club_posts_visibility").on(table.visibility),
  createdIdx: index("idx_fan_club_posts_created").on(table.createdAt),
}));
export type FanClubPost = typeof fanClubPosts.$inferSelect;
export type InsertFanClubPost = typeof fanClubPosts.$inferInsert;


/**
 * Promotion Requests — managed ad service ("Boost My Event") intake
 */
export const promotionRequests = mysqlTable("promotion_requests", {
  id: int("id").autoincrement().primaryKey(),
  artistUserId: int("artistUserId").notNull(),
  type: mysqlEnum("type", ["event", "release", "profile"]).notNull(),
  targetId: int("targetId"), // event ID or release ID (null for profile)
  targetName: varchar("targetName", { length: 255 }).notNull(), // display name of what's being promoted
  budget: int("budget").notNull(), // in cents
  goals: text("goals").notNull(), // what the artist wants to achieve
  targetAudience: text("targetAudience"), // age, location, interests
  platforms: json("platforms").$type<string[]>(), // ['instagram', 'facebook', 'tiktok', 'youtube']
  timeline: varchar("timeline", { length: 100 }), // e.g. "7 days", "14 days"
  additionalNotes: text("additionalNotes"),
  status: mysqlEnum("status", ["submitted", "in_review", "in_progress", "completed", "cancelled"]).default("submitted").notNull(),
  adminNotes: text("adminNotes"),
  reportUrl: text("reportUrl"), // link to campaign report
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  paidAt: timestamp("paidAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  artistIdx: index("idx_promo_requests_artist").on(table.artistUserId),
  statusIdx: index("idx_promo_requests_status").on(table.status),
  typeIdx: index("idx_promo_requests_type").on(table.type),
}));
export type PromotionRequest = typeof promotionRequests.$inferSelect;
export type InsertPromotionRequest = typeof promotionRequests.$inferInsert;


/**
 * Video Portfolio — multi-video clips for artists and athletes (up to 10 per profile)
 */
export const videoPortfolio = mysqlTable("video_portfolio", {
  id: int("id").autoincrement().primaryKey(),
  artistProfileId: int("artistProfileId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  category: varchar("category", { length: 50 }).notNull(), // highlights, training, game_day, behind_the_scenes, live_performance, studio, music_video, other
  duration: int("duration"), // in seconds (max 120)
  sortOrder: int("sortOrder").default(0).notNull(),
  status: mysqlEnum("status", ["active", "processing", "removed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  artistProfileIdx: index("idx_video_portfolio_artist").on(table.artistProfileId),
  categoryIdx: index("idx_video_portfolio_category").on(table.category),
}));
export type VideoPortfolioItem = typeof videoPortfolio.$inferSelect;
export type InsertVideoPortfolioItem = typeof videoPortfolio.$inferInsert;


// Fan Club Post Likes
export const fanClubPostLikes = mysqlTable("fan_club_post_likes", {
  id: int("id").primaryKey().autoincrement(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  postUserIdx: index("idx_fc_likes_post_user").on(table.postId, table.userId),
}));

// Fan Club Post Comments
export const fanClubPostComments = mysqlTable("fan_club_post_comments", {
  id: int("id").primaryKey().autoincrement(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  content: text("content").notNull(),
  parentId: int("parentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  postIdx: index("idx_fc_comments_post").on(table.postId),
}));


/**
 * Ology Live Experiences — virtual bookable experiences (1-on-1, small group, broadcast)
 * Talent creates these offerings; fans book and pay through the platform.
 */
export const ologyLiveExperiences = mysqlTable("ology_live_experiences", {
  id: int("id").autoincrement().primaryKey(),
  talentId: int("talentId").notNull(), // references users.id (the talent offering this)
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  duration: int("duration").notNull(), // in minutes (15, 30, 45, 60, 90, 120)
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // price per person
  capacityType: mysqlEnum("capacityType", ["one_on_one", "small_group", "broadcast"]).notNull(),
  maxAttendees: int("maxAttendees").default(1), // 1 for one_on_one, 2-10 for small_group, null/unlimited for broadcast
  platform: varchar("platform", { length: 50 }).notNull(), // twitch, discord, zoom, facetime, google_meet, youtube_live, other
  platformLink: varchar("platformLink", { length: 512 }), // pre-set link or "sent after booking"
  linkSentAfterBooking: boolean("linkSentAfterBooking").default(false),
  category: varchar("category", { length: 50 }).notNull(), // gaming, music, fitness, qa, workshop, listening_party, film_breakdown, comedy, photography, production, brand_building, other
  tags: json("tags"), // additional tags like ["call_of_duty", "fortnite", "songwriting"]
  coverImageUrl: varchar("coverImageUrl", { length: 512 }), // optional cover image
  // Availability
  recurringSchedule: json("recurringSchedule"), // { monday: [{start: "19:00", end: "21:00"}], tuesday: [...] }
  isActive: boolean("isActive").default(true).notNull(), // talent can pause offerings
  // Stats
  totalBookings: int("totalBookings").default(0),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  talentIdx: index("idx_ology_live_talent").on(table.talentId),
  categoryIdx: index("idx_ology_live_category").on(table.category),
  activeIdx: index("idx_ology_live_active").on(table.isActive),
  capacityIdx: index("idx_ology_live_capacity").on(table.capacityType),
}));
export type OlogyLiveExperience = typeof ologyLiveExperiences.$inferSelect;
export type InsertOlogyLiveExperience = typeof ologyLiveExperiences.$inferInsert;

/**
 * Ology Live Bookings — fan bookings for live experiences
 */
export const ologyLiveBookings = mysqlTable("ology_live_bookings", {
  id: int("id").autoincrement().primaryKey(),
  experienceId: int("experienceId").notNull(), // references ologyLiveExperiences.id
  fanId: int("fanId").notNull(), // references users.id (the fan booking)
  talentId: int("talentId").notNull(), // references users.id (denormalized for quick queries)
  scheduledAt: timestamp("scheduledAt").notNull(), // when the session is scheduled
  duration: int("duration").notNull(), // in minutes (copied from experience at booking time)
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled", "no_show"]).default("pending").notNull(),
  // Payment
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }), // Ologywood's cut
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid", "refunded"]).default("unpaid").notNull(),
  paidAt: timestamp("paidAt"),
  refundedAt: timestamp("refundedAt"),
  // Session details
  joinLink: varchar("joinLink", { length: 512 }), // link sent to fan for the session
  platform: varchar("platform", { length: 50 }), // copied from experience
  // Cancellation
  cancelledAt: timestamp("cancelledAt"),
  cancelledBy: varchar("cancelledBy", { length: 20 }), // 'fan' or 'talent'
  cancellationReason: text("cancellationReason"),
  // Review
  fanRating: int("fanRating"), // 1-5 stars
  fanReview: text("fanReview"),
  reviewedAt: timestamp("reviewedAt"),
  // Metadata
  notes: text("notes"), // fan can add notes when booking (e.g., "I want to play Warzone")
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  experienceIdx: index("idx_ology_live_bookings_experience").on(table.experienceId),
  fanIdx: index("idx_ology_live_bookings_fan").on(table.fanId),
  talentIdx: index("idx_ology_live_bookings_talent").on(table.talentId),
  statusIdx: index("idx_ology_live_bookings_status").on(table.status),
  scheduledIdx: index("idx_ology_live_bookings_scheduled").on(table.scheduledAt),
}));
export type OlogyLiveBooking = typeof ologyLiveBookings.$inferSelect;
export type InsertOlogyLiveBooking = typeof ologyLiveBookings.$inferInsert;

/**
 * Ology Live Time Slots — available time slots for experiences
 * Generated from recurring schedule or manually added by talent
 */
export const ologyLiveTimeSlots = mysqlTable("ology_live_time_slots", {
  id: int("id").autoincrement().primaryKey(),
  experienceId: int("experienceId").notNull(),
  talentId: int("talentId").notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  spotsTotal: int("spotsTotal").default(1).notNull(), // total capacity for this slot
  spotsTaken: int("spotsTaken").default(0).notNull(), // how many booked
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  experienceIdx: index("idx_ology_live_slots_experience").on(table.experienceId),
  talentIdx: index("idx_ology_live_slots_talent").on(table.talentId),
  startIdx: index("idx_ology_live_slots_start").on(table.startTime),
  availableIdx: index("idx_ology_live_slots_available").on(table.isAvailable),
}));
export type OlogyLiveTimeSlot = typeof ologyLiveTimeSlots.$inferSelect;
export type InsertOlogyLiveTimeSlot = typeof ologyLiveTimeSlots.$inferInsert;


/**
 * Ology Live Session Contracts — auto-generated NIL-compliant agreements for each booking
 * Ties directly to a booking and includes full contract content, signatures, and status tracking
 */
export const ologyLiveSessionContracts = mysqlTable("ology_live_session_contracts", {
  id: int("id").primaryKey().autoincrement(),
  bookingId: int("bookingId").notNull(),
  experienceId: int("experienceId").notNull(),
  talentId: int("talentId").notNull(),
  fanId: int("fanId").notNull(),
  // Contract content (JSON with structured NIL agreement)
  contractContent: json("contractContent"),
  // Status tracking
  status: varchar("status", { length: 30 }).default("generated").notNull(), // generated, viewed, signed_by_fan, signed_by_talent, fully_executed
  // Signatures
  talentSignature: text("talentSignature"),
  talentSignedAt: timestamp("talentSignedAt"),
  fanSignature: text("fanSignature"),
  fanSignedAt: timestamp("fanSignedAt"),
  // NIL compliance fields
  compensationAmount: decimal("compensationAmount", { precision: 10, scale: 2 }),
  mediaRightsGranted: json("mediaRightsGranted"), // what media rights fan gets (recording, streaming, etc.)
  ncaaComplianceNote: text("ncaaComplianceNote"),
  // Metadata
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  bookingIdx: index("idx_ology_live_contracts_booking").on(table.bookingId),
  talentIdx: index("idx_ology_live_contracts_talent").on(table.talentId),
  fanIdx: index("idx_ology_live_contracts_fan").on(table.fanId),
  statusIdx: index("idx_ology_live_contracts_status").on(table.status),
}));
export type OlogyLiveSessionContract = typeof ologyLiveSessionContracts.$inferSelect;
export type InsertOlogyLiveSessionContract = typeof ologyLiveSessionContracts.$inferInsert;

/**
 * Ology Live Reviews — post-session reviews from fans about their experience
 */
export const ologyLiveReviews = mysqlTable("ology_live_reviews", {
  id: int("id").primaryKey().autoincrement(),
  bookingId: int("bookingId").notNull(),
  experienceId: int("experienceId").notNull(),
  talentId: int("talentId").notNull(),
  fanId: int("fanId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  reviewText: text("reviewText"),
  // Talent can respond to reviews
  talentResponse: text("talentResponse"),
  talentRespondedAt: timestamp("talentRespondedAt"),
  // Moderation
  isPublic: boolean("isPublic").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  bookingIdx: index("idx_ology_live_reviews_booking").on(table.bookingId),
  experienceIdx: index("idx_ology_live_reviews_experience").on(table.experienceId),
  talentIdx: index("idx_ology_live_reviews_talent").on(table.talentId),
  fanIdx: index("idx_ology_live_reviews_fan").on(table.fanId),
  ratingIdx: index("idx_ology_live_reviews_rating").on(table.rating),
}));
export type OlogyLiveReview = typeof ologyLiveReviews.$inferSelect;
export type InsertOlogyLiveReview = typeof ologyLiveReviews.$inferInsert;

/**
 * Ology Live Earnings — tracks per-session revenue for NIL reporting
 */
export const ologyLiveEarnings = mysqlTable("ology_live_earnings", {
  id: int("id").primaryKey().autoincrement(),
  talentId: int("talentId").notNull(),
  bookingId: int("bookingId").notNull(),
  experienceId: int("experienceId").notNull(),
  // Financial
  grossAmount: decimal("grossAmount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }).notNull(),
  netAmount: decimal("netAmount", { precision: 10, scale: 2 }).notNull(),
  // NIL categorization
  nilCategory: varchar("nilCategory", { length: 50 }).default("virtual_appearance").notNull(), // virtual_appearance, gaming_session, qa_session, workshop, etc.
  // Session details for reporting
  sessionDate: timestamp("sessionDate").notNull(),
  sessionDuration: int("sessionDuration").notNull(), // minutes
  platform: varchar("platform", { length: 50 }),
  // Payout tracking
  payoutStatus: varchar("payoutStatus", { length: 30 }).default("pending").notNull(), // pending, processing, paid
  paidAt: timestamp("paidAt"),
  stripeTransferId: varchar("stripeTransferId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  talentIdx: index("idx_ology_live_earnings_talent").on(table.talentId),
  bookingIdx: index("idx_ology_live_earnings_booking").on(table.bookingId),
  dateIdx: index("idx_ology_live_earnings_date").on(table.sessionDate),
  nilCategoryIdx: index("idx_ology_live_earnings_category").on(table.nilCategory),
  payoutIdx: index("idx_ology_live_earnings_payout").on(table.payoutStatus),
}));
export type OlogyLiveEarning = typeof ologyLiveEarnings.$inferSelect;
export type InsertOlogyLiveEarning = typeof ologyLiveEarnings.$inferInsert;

/**
 * Ology Live Questions — fans submit questions in advance for upcoming sessions
 */
export const ologyLiveQuestions = mysqlTable("ology_live_questions", {
  id: int("id").primaryKey().autoincrement(),
  bookingId: int("bookingId").notNull(),
  experienceId: int("experienceId").notNull(),
  fanId: int("fanId").notNull(),
  talentId: int("talentId").notNull(),
  // Question content
  questionText: text("questionText").notNull(),
  // Status tracking
  status: varchar("status", { length: 30 }).default("pending").notNull(), // pending, answered, skipped
  answeredAt: timestamp("answeredAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  bookingIdx: index("idx_ology_live_questions_booking").on(table.bookingId),
  experienceIdx: index("idx_ology_live_questions_experience").on(table.experienceId),
  fanIdx: index("idx_ology_live_questions_fan").on(table.fanId),
  talentIdx: index("idx_ology_live_questions_talent").on(table.talentId),
  statusIdx: index("idx_ology_live_questions_status").on(table.status),
}));
export type OlogyLiveQuestion = typeof ologyLiveQuestions.$inferSelect;
export type InsertOlogyLiveQuestion = typeof ologyLiveQuestions.$inferInsert;
