import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import * as stubs from "./db-stubs";

export const removeSavedEvent = stubs.removeSavedEvent;
export const getVenueProfileByToken = stubs.getVenueProfileByToken;
export const getUserById = stubs.getUserById;
export const setAvailability = stubs.setAvailability;
export const getVenuesWhoFavoritedArtist = stubs.getVenuesWhoFavoritedArtist;
export const deleteAvailability = stubs.deleteAvailability;
export const getUserSavedEvents = stubs.getUserSavedEvents;
export const getArtistEventHistory = stubs.getArtistEventHistory;
export const getEventHistoryById = stubs.getEventHistoryById;
export const getEmailPreferences = stubs.getEmailPreferences;
export const createEmailPreferences = stubs.createEmailPreferences;
export const getArtistEvents = stubs.getArtistEvents;
export const getArtistPublicEvents = stubs.getArtistPublicEvents;
export const getArtistUpcomingEvents = stubs.getArtistUpcomingEvents;
export const getEventPhotos = stubs.getEventPhotos;
export const addEventPhoto = stubs.addEventPhoto;
export const deleteEventPhoto = stubs.deleteEventPhoto;
export const deleteEventRecurrence = stubs.deleteEventRecurrence;
export const getEventRecurrence = stubs.getEventRecurrence;
export const searchPublicEvents = stubs.searchPublicEvents;
export const saveEvent = stubs.saveEvent;
export const isEventSaved = stubs.isEventSaved;
export const getFavoritedArtistsAvailability = stubs.getFavoritedArtistsAvailability;
export const getPaymentHistory = stubs.getPaymentHistory;
export const recordRefund = stubs.recordRefund;
export const getVenueBookingsByDateRange = stubs.getVenueBookingsByDateRange;

import { 
  User, InsertUser, users, 
  artistProfiles, InsertArtistProfile, ArtistProfile,
  venueProfiles, InsertVenueProfile, VenueProfile,
  riderTemplates, InsertRiderTemplate, RiderTemplate,
  availability, InsertAvailability, Availability,
  bookings, InsertBooking, Booking,
  messages, InsertMessage, Message,
  reviews, InsertReview, Review,
  venueReviews, InsertVenueReview, VenueReview,
  favorites, InsertFavorite, Favorite,
  bookingTemplates, InsertBookingTemplate, BookingTemplate,
  profileViews, InsertProfileView, ProfileView,
  bookingReminders, InsertBookingReminder, BookingReminder,
  contracts, InsertContract, Contract,
  signatures, InsertSignature, Signature,
  emailPreferences, InsertEmailPreference, EmailPreference,
  userSubscriptions, InsertUserSubscription, UserSubscription,
  stripeConnectAccounts, InsertStripeConnectAccount, StripeConnectAccount,
  artistPayouts, InsertArtistPayout, ArtistPayout,
  invoices, InsertInvoice, Invoice,
  events, InsertEvent, Event,
  eventRecurrence, InsertEventRecurrence, EventRecurrence,
  eventHistory, InsertEventHistory, EventHistory,
  eventPhotos, InsertEventPhoto, EventPhoto,
  savedEvents, InsertSavedEvent, SavedEvent
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { eq, sql } from "drizzle-orm";

// Re-export User type for use in other modules
export type { User, InsertUser };

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: ReturnType<typeof mysql.createPool> | null = null;

export function getPool() {
  return _pool;
}

// ============= CALENDAR EVENT FUNCTIONS (DEPRECATED) =============
// Calendar functions removed - calendarRouter is deprecated and commented out in routers.ts

// ============= CONTRACT FUNCTIONS =============

export async function createContract(data: InsertContract): Promise<Contract> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(contracts).values(data);
  const contractId = (result as any).insertId;
  const contract = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
  return contract[0] as Contract;
}

export async function getContractById(id: number): Promise<Contract | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return result[0];
}

export async function getContractByBookingId(bookingId: number): Promise<Contract | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contracts).where(eq(contracts.bookingId, bookingId)).limit(1);
  return result[0];
}

export async function getContractsByArtistId(artistId: number): Promise<Contract[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contracts).where(eq(contracts.artistId, artistId));
}

export async function getContractsByVenueId(venueId: number): Promise<Contract[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contracts).where(eq(contracts.venueId, venueId));
}

export async function updateContract(id: number, data: Partial<InsertContract>): Promise<Contract | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  await db.update(contracts).set(data).where(eq(contracts.id, id));
  return await getContractById(id);
}

// ============= SIGNATURE FUNCTIONS =============

export async function createSignature(data: InsertSignature): Promise<Signature> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(signatures).values(data);
  const signatureId = (result as any).insertId;
  const signature = await db.select().from(signatures).where(eq(signatures.id, signatureId)).limit(1);
  return signature[0] as Signature;
}

export async function getSignatureById(id: number): Promise<Signature | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(signatures).where(eq(signatures.id, id)).limit(1);
  return result[0];
}

export async function getSignaturesByContractId(contractId: number): Promise<Signature[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(signatures).where(eq(signatures.contractId, contractId));
}

export async function updateSignature(id: number, data: Partial<InsertSignature>): Promise<Signature | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  await db.update(signatures).set(data).where(eq(signatures.id, id));
  return await getSignatureById(id);
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Parse DATABASE_URL to extract connection parameters
      const url = new URL(process.env.DATABASE_URL);
      const pool = mysql.createPool({
        host: url.hostname,
        port: parseInt(url.port || '3306'),
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        ssl: {} // Enable SSL for TiDB with default settings
      });
      _pool = pool;
      _db = drizzle(pool, { schema, mode: 'default' });
      console.log("[Database] Connected successfully to TiDB");
      // Connection is lazy - will be tested on first query
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= HELPER FUNCTIONS =============

/**
 * Parse artist profile to ensure genre is always an array
 * Handles cases where genre might be string, JSON, or already an array
 */
function parseArtistProfile(artist: any): ArtistProfile {
  if (!artist) return undefined;
  
  let genre: string[] = [];
  if (typeof artist.genre === 'string') {
    try {
      genre = JSON.parse(artist.genre);
    } catch {
      genre = artist.genre.split(',').map((g: string) => g.trim()).filter((g: string) => g);
    }
  } else if (Array.isArray(artist.genre)) {
    genre = artist.genre;
  }
  
  let socialLinks = artist.socialLinks;
  if (typeof socialLinks === 'string') {
    try { socialLinks = JSON.parse(socialLinks); } catch { socialLinks = {}; }
  }
  
  let mediaGallery = artist.mediaGallery;
  if (typeof mediaGallery === 'string') {
    try { mediaGallery = JSON.parse(mediaGallery); } catch { mediaGallery = { photos: [], videos: [] }; }
  }
  
  return {
    ...artist,
    genre: genre || [],
    socialLinks: socialLinks || {},
    mediaGallery: mediaGallery || { photos: [], videos: [] },
    profilePhotoUrl: artist.profilePhotoUrl || null,
    websiteUrl: artist.websiteUrl || null,
    bio: artist.bio || null,
    location: artist.location || null
  };
}

// ============= USER FUNCTIONS =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  await getDb();
  const pool = getPool();
  if (!pool) {
    console.warn("[Database] Cannot upsert user: pool not available");
    return;
  }

  try {
    const name = user.name ?? null;
    const email = user.email ?? null;
    const loginMethod = user.loginMethod ?? null;
    const lastSignedIn = user.lastSignedIn ?? new Date();
    // Default to 'venue' role so users can create bookings immediately
    const role = user.role ?? 'venue';

    const sql = 'INSERT INTO users (openId, name, email, loginMethod, lastSignedIn, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), loginMethod = VALUES(loginMethod), lastSignedIn = VALUES(lastSignedIn), updatedAt = NOW()';

    await pool.query(sql, [user.openId, name, email, loginMethod, lastSignedIn, role]);
  } catch (error) {
    console.error("[Database] Error upserting user:", error);
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserRole(userId: number, role: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ============= ARTIST PROFILE FUNCTIONS =============

export async function getArtistProfileByUserId(userId: number): Promise<ArtistProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(artistProfiles).where(eq(artistProfiles.userId, userId)).limit(1);
  return result[0] ? parseArtistProfile(result[0]) : undefined;
}

export async function getArtistProfileById(id: number): Promise<ArtistProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(artistProfiles).where(eq(artistProfiles.id, id)).limit(1);
  return result[0] ? parseArtistProfile(result[0]) : undefined;
}

export async function createArtistProfile(data: InsertArtistProfile): Promise<ArtistProfile> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    const result = await db.insert(artistProfiles).values(data);
    const artistId = (result as any).insertId;
    
    if (!artistId) {
      console.error('[createArtistProfile] No insertId from insert');
      throw new Error('Failed to get insert ID');
    }
    
    const artist = await db.select().from(artistProfiles).where(eq(artistProfiles.id, artistId)).limit(1);
    
    if (!artist || !artist[0]) {
      console.error('[createArtistProfile] Failed to retrieve created artist');
      throw new Error('Failed to retrieve created artist');
    }
    
    return parseArtistProfile(artist[0]);
  } catch (error) {
    console.error('[createArtistProfile] Error:', error);
    throw error;
  }
}

export async function updateArtistProfile(id: number, data: Partial<InsertArtistProfile>): Promise<ArtistProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  await db.update(artistProfiles).set(data).where(eq(artistProfiles.id, id));
  const updated = await getArtistProfileById(id);
  return updated ? parseArtistProfile(updated) : undefined;
}

export async function searchArtists(filters: {
  genre?: string[];
  location?: string;
  minFee?: number;
  maxFee?: number;
  availableFrom?: string;
  availableTo?: string;
}) {
  let results: any[] = [];
  try {
    console.log('[searchArtists] Called with filters:', JSON.stringify(filters));
  console.log('[searchArtists] Fetching artists...');
    // Use getAllArtists which properly parses data via Drizzle ORM
    results = await getAllArtists();
    console.log(`[searchArtists] Fetched ${results.length} artists from database`);
  } catch (error) {
    console.error('[searchArtists] Query failed:', error);
    // Fallback: return empty array
    return [];
  }
  
  // Apply filters in application code for MVP
  let filtered = results;
  
  // Filter by genre (genre is always an array after parseArtistProfile)
  if (filters.genre && filters.genre.length > 0) {
    filtered = filtered.filter(a => {
      const artistGenres = a.genre || [];
      return filters.genre!.some(selectedGenre => 
        artistGenres.some(g => g?.toLowerCase() === selectedGenre.toLowerCase())
      );
    });
  }
  
  if (filters.location) {
    filtered = filtered.filter(a => 
      a.location?.toLowerCase().includes(filters.location!.toLowerCase())
    );
  }
  
  if (filters.minFee !== undefined) {
    filtered = filtered.filter(a => 
      a.feeRangeMin !== null && a.feeRangeMin >= filters.minFee!
    );
  }
  
  if (filters.maxFee !== undefined) {
    filtered = filtered.filter(a => 
      a.feeRangeMax !== null && a.feeRangeMax <= filters.maxFee!
    );
  }
  
  // Filter by availability dates if provided
  if (filters.availableFrom || filters.availableTo) {
    // Get availability for all artists
    const artistIds = filtered.map(a => a.id);
    const availabilities = await db.select().from(availability).where(
      sql`${availability.artistId} IN (${sql.join(artistIds.map(id => sql`${id}`), sql`, `)})`
    );
    
    // Filter artists who have availability in the requested date range
    filtered = filtered.filter(artist => {
      const artistAvailability = availabilities.filter(av => av.artistId === artist.id);
      // Only exclude if no availability records AND user requested availability filtering
      // This prevents filtering out artists who just haven't set availability yet
      if (artistAvailability.length === 0) return false;
      
      return artistAvailability.some(av => {
        const avDate = new Date(av.date);
        const fromDate = filters.availableFrom ? new Date(filters.availableFrom) : null;
        const toDate = filters.availableTo ? new Date(filters.availableTo) : null;
        
        if (fromDate && avDate < fromDate) return false;
        if (toDate && avDate > toDate) return false;
        return true;
      });
    });
  }
  
  return filtered;
}

export async function getAllArtists() {
  const db = await getDb();
  if (!db) {
    console.log("[getAllArtists] Database not available");
    return [];
  }
  
  try {
    console.log("[getAllArtists] Fetching all artists using Drizzle ORM...");
    // Use Drizzle ORM to fetch all artists
    const artists = await db.select().from(artistProfiles);
    console.log(`[getAllArtists] Successfully fetched ${artists.length} artists`);
    
    // Ensure all JSON fields are properly parsed and serializable
    return artists.map(artist => parseArtistProfile(artist));
  } catch (error) {
    console.error("[getAllArtists] Error fetching artists:", error);
    return [];
  }
}

// ============= VENUE PROFILE FUNCTIONS =============

export async function getVenueProfileByUserId(userId: number): Promise<VenueProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(venueProfiles).where(eq(venueProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function getVenueProfileById(id: number): Promise<VenueProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(venueProfiles).where(eq(venueProfiles.id, id)).limit(1);
  return result[0];
}

export async function createVenueProfile(data: InsertVenueProfile): Promise<VenueProfile> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(venueProfiles).values(data);
  const venueId = (result as any).insertId;
  const venue = await db.select().from(venueProfiles).where(eq(venueProfiles.id, venueId)).limit(1);
  return venue[0] as VenueProfile;
}

export async function updateVenueProfile(id: number, data: Partial<InsertVenueProfile>): Promise<VenueProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  await db.update(venueProfiles).set(data).where(eq(venueProfiles.id, id));
  return await getVenueProfileById(id);
}

export async function getAllVenues() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const [venues] = await (db as any).pool.query('SELECT * FROM venue_profiles');
    return (venues as any[]).map(venue => ({
      ...venue,
      amenities: venue.amenities ? JSON.parse(venue.amenities) : [],
      socialLinks: venue.socialLinks ? JSON.parse(venue.socialLinks) : {},
    }));
  } catch (error) {
    console.error("[getAllVenues] Error fetching venues:", error);
    return [];
  }
}

export async function searchVenues(filters: {
  query?: string;
  location?: string;
  capacity?: number;
  amenities?: string[];
}) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    let sql_query = 'SELECT * FROM venue_profiles WHERE 1=1';
    const params: any[] = [];
    
    if (filters.query) {
      sql_query += ' AND (venueName LIKE ? OR description LIKE ?)';
      params.push(`%${filters.query}%`, `%${filters.query}%`);
    }
    
    if (filters.location) {
      sql_query += ' AND location LIKE ?';
      params.push(`%${filters.location}%`);
    }
    
    if (filters.capacity) {
      sql_query += ' AND capacity >= ?';
      params.push(filters.capacity);
    }
    
    const [venues] = await (db as any).pool.query(sql_query, params);
    
    return (venues as any[]).map(venue => ({
      ...venue,
      amenities: venue.amenities ? JSON.parse(venue.amenities) : [],
      socialLinks: venue.socialLinks ? JSON.parse(venue.socialLinks) : {},
    }));
  } catch (error) {
    console.error("[searchVenues] Error searching venues:", error);
    return [];
  }
}

// ============= RIDER TEMPLATE FUNCTIONS =============

export async function getRiderTemplatesByArtistId(artistId: number): Promise<RiderTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(riderTemplates).where(eq(riderTemplates.artistId, artistId));
}

export async function getRiderTemplateById(id: number): Promise<RiderTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(riderTemplates).where(eq(riderTemplates.id, id)).limit(1);
  return result[0];
}

export async function createRiderTemplate(data: InsertRiderTemplate): Promise<RiderTemplate> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(riderTemplates).values(data);
  const riderId = (result as any).insertId;
  const rider = await db.select().from(riderTemplates).where(eq(riderTemplates.id, riderId)).limit(1);
  return rider[0] as RiderTemplate;
}

export async function updateRiderTemplate(id: number, data: Partial<InsertRiderTemplate>): Promise<RiderTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  await db.update(riderTemplates).set(data).where(eq(riderTemplates.id, id));
  return await getRiderTemplateById(id);
}

export async function deleteRiderTemplate(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(riderTemplates).where(eq(riderTemplates.id, id));
}

// ============= BOOKING FUNCTIONS =============

export async function createBooking(data: InsertBooking): Promise<Booking> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(bookings).values(data);
  const bookingId = (result as any).insertId;
  const booking = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  return booking[0] as Booking;
}

export async function getBookingById(id: number): Promise<Booking | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0];
}

export async function getBookingsByArtistId(artistId: number): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bookings).where(eq(bookings.artistId, artistId));
}

export async function getBookingsByVenueId(venueId: number): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bookings).where(eq(bookings.venueId, venueId));
}

export async function updateBooking(id: number, data: Partial<InsertBooking>): Promise<Booking | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  await db.update(bookings).set(data).where(eq(bookings.id, id));
  return await getBookingById(id);
}

export async function updateSubscriptionStatus(userId: number, status: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(userSubscriptions).set({ status }).where(eq(userSubscriptions.userId, userId));
}

export async function getSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId)).limit(1);
  return result[0] || null;
}

export async function upsertSubscription(data: any): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getSubscriptionByUserId(data.userId);
  if (existing) {
    await db.update(userSubscriptions).set(data).where(eq(userSubscriptions.userId, data.userId));
  } else {
    await db.insert(userSubscriptions).values(data);
  }
}

export async function updateBookingPaymentStatus(bookingId: number, paymentStatus: string, stripePaymentIntentId?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updateData: any = { paymentStatus };
  if (stripePaymentIntentId) {
    updateData.stripePaymentIntentId = stripePaymentIntentId;
  }
  
  await db.update(bookings).set(updateData).where(eq(bookings.id, bookingId));
}

// ============= MESSAGE FUNCTIONS =============

export async function createMessage(data: InsertMessage): Promise<Message> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(messages).values(data);
  const messageId = (result as any).insertId;
  const message = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
  return message[0] as Message;
}

export async function getMessagesByBookingId(bookingId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(messages).where(eq(messages.bookingId, bookingId));
}

export async function getMessageById(id: number): Promise<Message | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return result[0];
}

// ============= AVAILABILITY FUNCTIONS =============

export async function createAvailability(data: InsertAvailability): Promise<Availability> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(availability).values(data);
  const availabilityId = (result as any).insertId;
  const avail = await db.select().from(availability).where(eq(availability.id, availabilityId)).limit(1);
  return avail[0] as Availability;
}

export async function getAvailabilityByArtistId(artistId: number): Promise<Availability[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(availability).where(eq(availability.artistId, artistId));
  } catch (error) {
    console.error('Error getting availability:', error);
    // Return empty array if query fails
    return [];
  }
}

export async function getBookingsNeedingReminders() {
  const db = await getDb();
  if (!db) return [];
  
  // Get bookings that are within 7 days and haven't been reminded yet
  const result = await db.select().from(bookings);
  return result.filter(booking => {
    const eventDate = new Date(booking.eventDate);
    const daysUntilEvent = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilEvent === 7 || daysUntilEvent === 3 || daysUntilEvent === 1;
  });
}

// ============= REVIEW FUNCTIONS =============

export async function createReview(data: InsertReview): Promise<Review> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(reviews).values(data);
  const reviewId = (result as any).insertId;
  const review = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  return review[0] as Review;
}

export async function getReviewsByArtistId(artistId: number): Promise<Review[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(reviews).where(eq(reviews.artistId, artistId));
  } catch (error) {
    console.error('Error getting reviews:', error);
    // Return empty array if query fails (table might not have all columns)
    return [];
  }
}

export async function getAverageRatingForArtist(artistId: number): Promise<{ averageRating: number; reviewCount: number }> {
  const db = await getDb();
  if (!db) return { averageRating: 0, reviewCount: 0 };
  
  const artistReviews = await getReviewsByArtistId(artistId);
  if (artistReviews.length === 0) {
    return { averageRating: 0, reviewCount: 0 };
  }
  
  const totalRating = artistReviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / artistReviews.length;
  
  return {
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount: artistReviews.length,
  };
}



export async function createVenueReview(data: InsertVenueReview): Promise<VenueReview> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(venueReviews).values(data);
  const reviewId = (result as any).insertId;
  const review = await db.select().from(venueReviews).where(eq(venueReviews.id, reviewId)).limit(1);
  return review[0] as VenueReview;
}

export async function getVenueReviewsByVenueId(venueId: number): Promise<VenueReview[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(venueReviews).where(eq(venueReviews.venueId, venueId));
}

// ============= FAVORITE FUNCTIONS =============

export async function addFavorite(userId: number, artistId: number): Promise<Favorite> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(favorites).values({ userId, artistId });
  const favoriteId = (result as any).insertId;
  const favorite = await db.select().from(favorites).where(eq(favorites.id, favoriteId)).limit(1);
  return favorite[0] as Favorite;
}

export async function removeFavorite(userId: number, artistId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(favorites).where(
    sql`${favorites.userId} = ${userId} AND ${favorites.artistId} = ${artistId}`
  );
}

export async function getFavoritesByUserId(userId: number): Promise<Favorite[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(favorites).where(eq(favorites.userId, userId));
}

// ============= BOOKING TEMPLATE FUNCTIONS =============

export async function createBookingTemplate(data: InsertBookingTemplate): Promise<BookingTemplate> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(bookingTemplates).values(data);
  const templateId = (result as any).insertId;
  const template = await db.select().from(bookingTemplates).where(eq(bookingTemplates.id, templateId)).limit(1);
  return template[0] as BookingTemplate;
}

export async function getBookingTemplatesByVenueId(venueId: number): Promise<BookingTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bookingTemplates).where(eq(bookingTemplates.venueId, venueId));
}

export async function getBookingTemplateById(id: number): Promise<BookingTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookingTemplates).where(eq(bookingTemplates.id, id)).limit(1);
  return result[0];
}

export async function updateBookingTemplate(id: number, data: Partial<InsertBookingTemplate>): Promise<BookingTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  await db.update(bookingTemplates).set(data).where(eq(bookingTemplates.id, id));
  return await getBookingTemplateById(id);
}

export async function deleteBookingTemplate(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(bookingTemplates).where(eq(bookingTemplates.id, id));
}

// ============= PROFILE VIEW FUNCTIONS =============

export async function trackProfileView(data: InsertProfileView): Promise<ProfileView> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(profileViews).values(data);
  const viewId = (result as any).insertId;
  const view = await db.select().from(profileViews).where(eq(profileViews.id, viewId)).limit(1);
  return view[0] as ProfileView;
}

export async function getProfileViewsByArtistId(artistId: number): Promise<ProfileView[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(profileViews).where(eq(profileViews.artistId, artistId));
}

// ============= BOOKING REMINDER FUNCTIONS =============

export async function createBookingReminder(data: InsertBookingReminder): Promise<BookingReminder> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(bookingReminders).values(data);
  const reminderId = (result as any).insertId;
  const reminder = await db.select().from(bookingReminders).where(eq(bookingReminders.id, reminderId)).limit(1);
  return reminder[0] as BookingReminder;
}

export async function getBookingRemindersByBookingId(bookingId: number): Promise<BookingReminder[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bookingReminders).where(eq(bookingReminders.bookingId, bookingId));
}

// ============= EMAIL PREFERENCE FUNCTIONS =============

export async function getEmailPreferencesByUserId(userId: number): Promise<EmailPreference | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(emailPreferences).where(eq(emailPreferences.userId, userId)).limit(1);
  return result[0];
}

export async function updateEmailPreferences(userId: number, data: Partial<InsertEmailPreference>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getEmailPreferencesByUserId(userId);
  if (existing) {
    await db.update(emailPreferences).set(data).where(eq(emailPreferences.userId, userId));
  } else {
    await db.insert(emailPreferences).values({ userId, ...data } as InsertEmailPreference);
  }
}

// ============= STRIPE FUNCTIONS =============

export async function createStripeConnectAccount(data: InsertStripeConnectAccount): Promise<StripeConnectAccount> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(stripeConnectAccounts).values(data);
  const accountId = (result as any).insertId;
  const account = await db.select().from(stripeConnectAccounts).where(eq(stripeConnectAccounts.id, accountId)).limit(1);
  return account[0] as StripeConnectAccount;
}

export async function getStripeConnectAccountByUserId(userId: number): Promise<StripeConnectAccount | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(stripeConnectAccounts).where(eq(stripeConnectAccounts.userId, userId)).limit(1);
  return result[0];
}

// ============= PAYOUT FUNCTIONS =============

export async function createArtistPayout(data: InsertArtistPayout): Promise<ArtistPayout> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(artistPayouts).values(data);
  const payoutId = (result as any).insertId;
  const payout = await db.select().from(artistPayouts).where(eq(artistPayouts.id, payoutId)).limit(1);
  return payout[0] as ArtistPayout;
}

export async function getArtistPayoutsByArtistId(artistId: number): Promise<ArtistPayout[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(artistPayouts).where(eq(artistPayouts.artistId, artistId));
}

// ============= INVOICE FUNCTIONS =============

export async function createInvoice(data: InsertInvoice): Promise<Invoice> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(invoices).values(data);
  const invoiceId = (result as any).insertId;
  const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  return invoice[0] as Invoice;
}

export async function getInvoicesByBookingId(bookingId: number): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(invoices).where(eq(invoices.bookingId, bookingId));
}

// ============= EVENT FUNCTIONS =============

export async function createEvent(data: InsertEvent): Promise<Event> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(events).values(data);
  const eventId = (result as any).insertId;
  const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  return event[0] as Event;
}

export async function getEventsByVenueId(venueId: number): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(events).where(eq(events.venueId, venueId));
}

export async function getEventById(id: number): Promise<Event | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result[0];
}

export async function updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  await db.update(events).set(data).where(eq(events.id, id));
  return await getEventById(id);
}

export async function deleteEvent(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db.delete(events).where(eq(events.id, id));
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
}

// ============= EVENT RECURRENCE FUNCTIONS =============

export async function createEventRecurrence(data: InsertEventRecurrence): Promise<EventRecurrence> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(eventRecurrence).values(data);
  const recurrenceId = (result as any).insertId;
  const recurrence = await db.select().from(eventRecurrence).where(eq(eventRecurrence.id, recurrenceId)).limit(1);
  return recurrence[0] as EventRecurrence;
}

export async function getEventRecurrencesByEventId(eventId: number): Promise<EventRecurrence[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(eventRecurrence).where(eq(eventRecurrence.eventId, eventId));
}

// ============= EVENT HISTORY FUNCTIONS =============

export async function createEventHistory(data: InsertEventHistory): Promise<EventHistory> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(eventHistory).values(data);
  const historyId = (result as any).insertId;
  const history = await db.select().from(eventHistory).where(eq(eventHistory.id, historyId)).limit(1);
  return history[0] as EventHistory;
}

export async function getEventHistoryByEventId(eventId: number): Promise<EventHistory[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(eventHistory).where(eq(eventHistory.eventId, eventId));
}

// ============= EVENT PHOTO FUNCTIONS =============

export async function createEventPhoto(data: InsertEventPhoto): Promise<EventPhoto> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(eventPhotos).values(data);
  const photoId = (result as any).insertId;
  const photo = await db.select().from(eventPhotos).where(eq(eventPhotos.id, photoId)).limit(1);
  return photo[0] as EventPhoto;
}

export async function getEventPhotosByEventId(eventId: number): Promise<EventPhoto[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(eventPhotos).where(eq(eventPhotos.eventId, eventId));
}

// ============= SAVED EVENT FUNCTIONS =============

export async function createSavedEvent(data: InsertSavedEvent): Promise<SavedEvent> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(savedEvents).values(data);
  const savedId = (result as any).insertId;
  const saved = await db.select().from(savedEvents).where(eq(savedEvents.id, savedId)).limit(1);
  return saved[0] as SavedEvent;
}

export async function getSavedEventsByUserId(userId: number): Promise<SavedEvent[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(savedEvents).where(eq(savedEvents.userId, userId));
}


// ============= STUB FUNCTIONS FOR NON-MVP ROUTERS =============
// These are placeholders for functions used by commented-out routers








