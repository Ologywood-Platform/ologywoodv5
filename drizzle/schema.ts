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
