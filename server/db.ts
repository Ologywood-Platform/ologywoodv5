import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";


import { 
  User, InsertUser, users, 
  artistProfiles, InsertArtistProfile, ArtistProfile,
  venueProfiles, InsertVenueProfile, VenueProfile,
  riderTemplates, InsertRiderTemplate, RiderTemplate,
  availability, InsertAvailability, Availability,
  verificationBadges,
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
  savedEvents, InsertSavedEvent, SavedEvent,
  artistReleases, InsertArtistRelease, ArtistRelease,
  releasePurchases, InsertReleasePurchase, ReleasePurchase,
  notifications, InsertNotification, Notification,
  notificationPreferences, InsertNotificationPreference, NotificationPreference,
  unsubscribeFeedback, InsertUnsubscribeFeedback, UnsubscribeFeedback,
  bookingDisputes, InsertBookingDispute, BookingDispute,
  videoModerationQueue, InsertVideoModerationQueue, VideoModerationQueue,
  videoFlags, InsertVideoFlag, VideoFlag
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { eq, ne, sql, and, or, gte, lte, like, desc, asc, inArray } from "drizzle-orm";

// Re-export User type for use in other modules
export type { User, InsertUser };

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _pool: ReturnType<typeof mysql.createPool> | null = null;

export function getPool() {
  return _pool;
}



// ============= CONTRACT FUNCTIONS =============

export async function createContract(data: InsertContract): Promise<Contract> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(contracts).values(data);
  const contractId = (result as any)[0].insertId;
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
  const signatureId = (result as any)[0].insertId;
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
      
      // Determine if this is TiDB Cloud or AWS RDS based on hostname
      const isTiDB = url.hostname.includes('tidbcloud.com');
      const isAWSRDS = url.hostname.includes('rds.amazonaws.com');
      
      const poolConfig: any = {
        host: url.hostname,
        port: parseInt(url.port || '3306'),
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true
      };
      
      // TiDB Cloud requires SSL, AWS RDS doesn't (unless explicitly enabled)
      if (isTiDB) {
        poolConfig.ssl = {}; // Enable SSL for TiDB with default settings
      } else if (isAWSRDS) {
        poolConfig.ssl = false; // AWS RDS doesn't require SSL by default
      }
      
      const pool = mysql.createPool(poolConfig);
      
      // Test connection immediately
      try {
        const connection = await pool.getConnection();
        const result = await connection.query('SELECT 1 as test');
        connection.release();
      } catch (testError: any) {
        console.error("[Database] Connection test failed:", {
          message: testError.message,
          code: testError.code,
          errno: testError.errno,
          sqlState: testError.sqlState
        });
        throw testError;
      }
      
      _pool = pool;
      _db = drizzle(pool, { schema, mode: 'default' }) as any;
    } catch (error: any) {
      console.error("[Database] Failed to connect:", {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        host: error.host,
        port: error.port
      });
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

// ============= HELPER FUNCTIONS =============

/**
 * Parse artist profile to ensure genre is always an array
 * Handles cases where genre might be string, JSON, or already an array
 */
function parseArtistProfile(artist: any): ArtistProfile | null {
  if (!artist) return null;
  
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

    const sql = 'INSERT INTO users (openId, name, email, loginMethod, lastSignedIn, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE name = COALESCE(VALUES(name), name), email = COALESCE(email, VALUES(email)), loginMethod = COALESCE(loginMethod, VALUES(loginMethod)), lastSignedIn = VALUES(lastSignedIn), updatedAt = NOW()';

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

export async function updateUserRole(userId: number, role: "user" | "admin" | "artist" | "venue" | "fan" | "blogger"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ============= ARTIST PROFILE FUNCTIONS =============

export async function getArtistProfileByUserId(userId: number): Promise<ArtistProfile | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(artistProfiles).where(eq(artistProfiles.userId, userId)).limit(1);
  return result[0] ? parseArtistProfile(result[0]) : null;
}

export async function getArtistProfileById(id: number): Promise<ArtistProfile | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(artistProfiles).where(eq(artistProfiles.id, id)).limit(1);
  return result[0] ? parseArtistProfile(result[0]) : null;
}

export async function createArtistProfile(data: InsertArtistProfile): Promise<ArtistProfile> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    const result = await db.insert(artistProfiles).values(data);
    const artistId = (result as any)[0].insertId;
    
    if (!artistId) {
      console.error('[createArtistProfile] No insertId from insert');
      throw new Error('Failed to get insert ID');
    }
    
    const artist = await db.select().from(artistProfiles).where(eq(artistProfiles.id, artistId)).limit(1);
    
    if (!artist || !artist[0]) {
      console.error('[createArtistProfile] Failed to retrieve created artist');
      throw new Error('Failed to retrieve created artist');
    }
    
    const parsed = parseArtistProfile(artist[0]);
    if (!parsed) throw new Error('Failed to parse created artist profile');
    return parsed;
  } catch (error) {
    console.error('[createArtistProfile] Error:', error);
    throw error;
  }
}

export async function updateArtistProfile(id: number, data: Partial<InsertArtistProfile>): Promise<ArtistProfile | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db.update(artistProfiles).set(data).where(eq(artistProfiles.id, id));
  const updated = await getArtistProfileById(id);
  return updated ? parseArtistProfile(updated) : null;
}

export async function searchArtists(filters: {
  genre?: string[];
  location?: string;
  minFee?: number;
  maxFee?: number;
  availableFrom?: string;
  availableTo?: string;
  availableDate?: string;
  verifiedOnly?: boolean;
}) {
  let results: any[] = [];
  try {
    // Use getAllArtists which properly parses data via Drizzle ORM
    results = await getAllArtists();
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
        artistGenres.some((g: string) => g?.toLowerCase() === selectedGenre.toLowerCase())
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
    const dbInstance = await getDb();
    const artistIds = filtered.map(a => a.id);
    if (!dbInstance || artistIds.length === 0) return filtered;
    const availabilities = await dbInstance.select().from(availability).where(
      sql`${availability.artistId} IN (${sql.join(artistIds.map(id => sql`${id}`), sql`, `)})`
    );
    
    // Filter artists who are AVAILABLE (not booked/unavailable) in the requested date range
    filtered = filtered.filter(artist => {
      const artistAvailability = availabilities.filter((av: any) => av.artistId === artist.id);
      // If artist has no availability records, they haven't set their calendar yet
      // Include them (they might be available) unless they have a "booked" entry for the date
      if (artistAvailability.length === 0) return true;
      
      return artistAvailability.some((av: any) => {
        const avDate = av.date; // YYYY-MM-DD string
        const fromDate = filters.availableFrom || null;
        const toDate = filters.availableTo || null;
        
        if (fromDate && avDate < fromDate) return false;
        if (toDate && avDate > toDate) return false;
        // Only include if the status is "available" (exclude "booked" and "unavailable")
        return av.status === 'available';
      });
    });
  }
  
  // Filter by single available date
  if (filters.availableDate) {
    const dbInstance = await getDb();
    const artistIds = filtered.map(a => a.id);
    if (!dbInstance || artistIds.length === 0) return filtered;
    
    // Get availability records for the specific date
    const dateAvailabilities = await dbInstance.select().from(availability).where(
      sql`${availability.artistId} IN (${sql.join(artistIds.map(id => sql`${id}`), sql`, `)}) AND ${availability.date} = ${filters.availableDate}`
    );
    
    // Build a map of artistId -> status for the requested date
    const dateStatusMap = new Map<number, string>();
    dateAvailabilities.forEach((av: any) => {
      dateStatusMap.set(av.artistId, av.status);
    });
    
    filtered = filtered.filter(artist => {
      const status = dateStatusMap.get(artist.id);
      // If no record for this date, artist hasn't blocked it — consider them available
      if (!status) return true;
      // If explicitly "available", include them
      if (status === 'available') return true;
      // If "booked" or "unavailable", exclude them
      return false;
    });
  }
  
  // Filter by verified status
  if (filters.verifiedOnly) {
    const dbInstance = await getDb();
    const artistIds = filtered.map(a => a.id);
    if (!dbInstance || artistIds.length === 0) return filtered;
    
    const badges = await dbInstance.select().from(verificationBadges).where(
      sql`${verificationBadges.artistId} IN (${sql.join(artistIds.map(id => sql`${id}`), sql`, `)})`
    );
    
    const verifiedArtistIds = new Set(
      badges
        .filter((b: any) => b.verificationStatus !== 'bronze') // bronze = unverified baseline
        .map((b: any) => b.artistId)
    );
    
    filtered = filtered.filter(artist => verifiedArtistIds.has(artist.id));
  }
  
  return filtered;
}

export async function getAllArtists() {
  const db = await getDb();
  if (!db) {
    return [];
  }
  
  try {
    // Use Drizzle ORM to fetch all artists
    const artists = await db.select().from(artistProfiles);
    
    // Ensure all JSON fields are properly parsed and serializable
    return artists.map(artist => parseArtistProfile(artist));
  } catch (error) {
    console.error("[getAllArtists] Error fetching artists:", error);
    return [];
  }
}

// ============= VENUE PROFILE FUNCTIONS =============

export async function getVenueProfileByUserId(userId: number): Promise<VenueProfile | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(venueProfiles).where(eq(venueProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getVenueProfileById(id: number): Promise<VenueProfile | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(venueProfiles).where(eq(venueProfiles.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createVenueProfile(data: InsertVenueProfile): Promise<VenueProfile> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(venueProfiles).values(data);
  const venueId = (result as any)[0].insertId;
  const venue = await db.select().from(venueProfiles).where(eq(venueProfiles.id, venueId)).limit(1);
  return venue[0] as VenueProfile;
}

export async function updateVenueProfile(id: number, data: Partial<InsertVenueProfile>): Promise<VenueProfile | null> {
  const db = await getDb();
  if (!db) return null;
  
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
  const results = await db.select().from(riderTemplates).where(eq(riderTemplates.artistId, artistId));
  return results as RiderTemplate[];
}

export async function getRiderTemplateById(id: number): Promise<RiderTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(riderTemplates).where(eq(riderTemplates.id, id)).limit(1);
  return result[0] as RiderTemplate | undefined;
}

export async function createRiderTemplate(data: InsertRiderTemplate): Promise<RiderTemplate> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(riderTemplates).values(data);
  const riderId = (result as any)[0].insertId;
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
  const bookingId = (result as any)[0].insertId;
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

export async function updateSubscriptionStatus(userId: number, status: "active" | "cancelled" | "past_due" | "trialing"): Promise<void> {
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

export async function updateBookingPaymentStatus(
  bookingId: number, 
  paymentStatus: string, 
  stripeSessionId?: string,
  paymentType?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updateData: any = { paymentStatus };
  
  if (paymentType === 'deposit') {
    updateData.depositPaidAt = new Date();
    if (stripeSessionId) updateData.stripeDepositPaymentIntentId = stripeSessionId;
    // Auto-confirm booking when deposit is paid
    updateData.status = 'confirmed';
  } else if (paymentType === 'final_payment' || paymentType === 'final') {
    updateData.finalPaidAt = new Date();
    if (stripeSessionId) updateData.stripeFinalPaymentIntentId = stripeSessionId;
    // Mark booking as completed when fully paid
    updateData.status = 'completed';
  } else {
    // Legacy full payment
    if (stripeSessionId) updateData.stripePaymentIntentId = stripeSessionId;
  }
  
  await db.update(bookings).set(updateData).where(eq(bookings.id, bookingId));
  console.log(`[DB] Updated booking #${bookingId} payment status to ${paymentStatus} (type: ${paymentType || 'full'})`);
}

// ============= MESSAGE FUNCTIONS =============

export async function createMessage(data: InsertMessage): Promise<Message> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(messages).values(data);
  const messageId = (result as any)[0].insertId;
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
  const availabilityId = (result as any)[0].insertId;
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
  const reviewId = (result as any)[0].insertId;
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
  const reviewId = (result as any)[0].insertId;
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

  const result = await db.insert(favorites).values({ venueId: userId, artistId });
  const favoriteId = (result as any)[0].insertId;
  const favorite = await db.select().from(favorites).where(eq(favorites.id, favoriteId)).limit(1);
  return favorite[0] as Favorite;
}

export async function removeFavorite(userId: number, artistId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(favorites).where(
    and(eq(favorites.venueId, userId), eq(favorites.artistId, artistId))
  );
}

export async function getFavoritesByUserId(userId: number): Promise<Favorite[]> {
  const db = await getDb();
  if (!db) return [];
  // favorites table has venueId and artistId, not userId. This returns empty for now.
  return [];
}

// ============= BOOKING TEMPLATE FUNCTIONS =============

export async function createBookingTemplate(data: InsertBookingTemplate): Promise<BookingTemplate> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(bookingTemplates).values(data);
  const templateId = (result as any)[0].insertId;
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
  const viewId = (result as any)[0].insertId;
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
  const reminderId = (result as any)[0].insertId;
  const reminder = await db.select().from(bookingReminders).where(eq(bookingReminders.id, reminderId)).limit(1);
  return reminder[0] as BookingReminder;
}

export async function getBookingRemindersByBookingId(bookingId: number): Promise<BookingReminder[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bookingReminders).where(eq(bookingReminders.bookingId, bookingId));
}

// ============= EMAIL PREFERENCE FUNCTIONS =============

/**
 * Get email preferences for a user by their ID.
 * Returns null if no preferences exist (consistent with router expectations).
 */
export async function getEmailPreferences(userId: number): Promise<EmailPreference | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(emailPreferences).where(eq(emailPreferences.userId, userId)).limit(1);
  return result[0] ?? null;
}

// Alias for backward compatibility
export const getEmailPreferencesByUserId = getEmailPreferences;

/**
 * Create default email preferences for a user.
 * Returns the created preferences or null if DB is unavailable.
 */
export async function createEmailPreferences(userId: number): Promise<EmailPreference | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Check if preferences already exist
  const existing = await getEmailPreferences(userId);
  if (existing) return existing;
  
  await db.insert(emailPreferences).values({
    userId,
    frequency: 'weekly',
    bookingUpdates: true,
    newOpportunities: true,
    platformNews: false,
    weeklyDigest: true,
    reminders: true,
  } as InsertEmailPreference);
  
  // Return the newly created preferences
  return await getEmailPreferences(userId);
}

/**
 * Update email preferences for a user. Creates preferences if they don't exist (upsert).
 * Returns the updated preferences or null.
 */
export async function updateEmailPreferences(userId: number, data: Partial<InsertEmailPreference>): Promise<EmailPreference | null> {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await getEmailPreferences(userId);
  if (existing) {
    await db.update(emailPreferences).set(data).where(eq(emailPreferences.userId, userId));
  } else {
    await db.insert(emailPreferences).values({ userId, ...data } as InsertEmailPreference);
  }
  
  return await getEmailPreferences(userId);
}

/**
 * Delete email preferences for a user.
 */
export async function deleteEmailPreferences(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(emailPreferences).where(eq(emailPreferences.userId, userId));
}

// ============= STRIPE FUNCTIONS =============

export async function createStripeConnectAccount(data: InsertStripeConnectAccount): Promise<StripeConnectAccount> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(stripeConnectAccounts).values(data);
  const accountId = (result as any)[0].insertId;
  const account = await db.select().from(stripeConnectAccounts).where(eq(stripeConnectAccounts.id, accountId)).limit(1);
  return account[0] as StripeConnectAccount;
}

export async function getStripeConnectAccountByUserId(userId: number): Promise<StripeConnectAccount | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  // stripeConnectAccounts uses artistId, not userId
  const result = await db.select().from(stripeConnectAccounts).where(eq(stripeConnectAccounts.artistId, userId)).limit(1);
  return result[0];
}

// ============= PAYOUT FUNCTIONS =============

export async function createArtistPayout(data: InsertArtistPayout): Promise<ArtistPayout> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(artistPayouts).values(data);
  const payoutId = (result as any)[0].insertId;
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
  const invoiceId = (result as any)[0].insertId;
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
  const eventId = (result as any)[0].insertId;
  const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  return event[0] as Event;
}

export async function getEventsByVenueId(venueId: number): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  // Note: events table has artistId, not venueId. This function returns empty for now.
  return [];
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
  const recurrenceId = (result as any)[0].insertId;
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
  const historyId = (result as any)[0].insertId;
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
  const photoId = (result as any)[0].insertId;
  const photo = await db.select().from(eventPhotos).where(eq(eventPhotos.id, photoId)).limit(1);
  return photo[0] as EventPhoto;
}

export async function getEventPhotosByEventId(eventId: number): Promise<EventPhoto[]> {
  const db = await getDb();
  if (!db) return [];
  // eventPhotos uses eventHistoryId, not eventId
  return await db.select().from(eventPhotos).where(eq(eventPhotos.eventHistoryId, eventId));
}

// ============= SAVED EVENT FUNCTIONS =============

export async function createSavedEvent(data: InsertSavedEvent): Promise<SavedEvent> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(savedEvents).values(data);
  const savedId = (result as any)[0].insertId;
  const saved = await db.select().from(savedEvents).where(eq(savedEvents.id, savedId)).limit(1);
  return saved[0] as SavedEvent;
}

export async function getSavedEventsByUserId(userId: number): Promise<SavedEvent[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(savedEvents).where(eq(savedEvents.userId, userId));
}


/// ============= ADDITIONAL DATABASE FUNCTIONS =============

// Availability Functions
export async function getAvailabilityForDate(artistId: number, date: Date): Promise<Availability | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const dateStr = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
  const result = await db.select().from(availability)
    .where(and(eq(availability.artistId, artistId), eq(availability.date, dateStr)))
    .limit(1);
  return result[0];
}

// Booking Functions
export async function getBookingStats(artistId: number): Promise<{ total: number; confirmed: number; pending: number; completed: number }> {
  const db = await getDb();
  if (!db) return { total: 0, confirmed: 0, pending: 0, completed: 0 };
  
  const allBookings = await db.select().from(bookings).where(eq(bookings.artistId, artistId));
  return {
    total: allBookings.length,
    confirmed: allBookings.filter(b => b.status === 'confirmed').length,
    pending: allBookings.filter(b => b.status === 'pending').length,
    completed: allBookings.filter(b => b.status === 'completed').length
  };
}

export async function getBookingTemplatesByUserId(userId: number): Promise<BookingTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  // bookingTemplates uses venueId, not userId
  return await db.select().from(bookingTemplates).where(eq(bookingTemplates.venueId, userId));
}

// Favorite Functions
export async function getFavoriteCount(artistId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(favorites).where(eq(favorites.artistId, artistId));
  return result.length;
}

export async function getFavoritesByVenue(venueId: number) {
  const db = await getDb();
  if (!db) return [];
  const favs = await db.select().from(favorites).where(eq(favorites.venueId, venueId));
  // Join with artist profiles to get full artist info
  const results = await Promise.all(
    favs.map(async (fav) => {
      const artist = await db.select().from(artistProfiles).where(eq(artistProfiles.id, fav.artistId)).limit(1);
      const parsed = artist[0] ? parseArtistProfile(artist[0]) : null;
      return parsed ? { ...fav, ...parsed, favoriteId: fav.id, id: parsed.id } : null;
    })
  );
  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}

export async function isFavorited(venueId: number, artistId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(favorites)
    .where(and(eq(favorites.venueId, venueId), eq(favorites.artistId, artistId)))
    .limit(1);
  return result.length > 0;
}

export async function getVenuesWhoFavoritedArtist(artistId: number): Promise<VenueProfile[]> {
  const db = await getDb();
  if (!db) return [];
  const favs = await db.select().from(favorites).where(eq(favorites.artistId, artistId));
  const venueIds = favs.map(f => f.venueId);
  if (venueIds.length === 0) return [];
  const venues = await db.select().from(venueProfiles).where(sql`${venueProfiles.id} IN (${sql.join(venueIds)})`);
  return venues;
}

// Message Functions
export async function markMessageAsRead(messageId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(messages).set({ isRead: true }).where(eq(messages.id, messageId));
}

export async function markMessagesAsRead(bookingId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(messages).set({ isRead: true }).where(eq(messages.bookingId, bookingId));
}

export async function getTotalUnreadMessageCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(messages)
    .where(and(eq(messages.recipientId, userId), eq(messages.isRead, false)));
  return result.length;
}

export async function getUnreadMessageCountByBooking(bookingId: number, userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(messages)
    .where(and(eq(messages.bookingId, bookingId), eq(messages.recipientId, userId), eq(messages.isRead, false)));
  return result.length;
}

// Review Functions
export async function getReviewByBookingId(bookingId: number): Promise<Review | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reviews).where(eq(reviews.bookingId, bookingId)).limit(1);
  return result[0];
}

export async function getReviewById(reviewId: number): Promise<Review | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  return result[0];
}

export async function getAverageRatingForVenue(venueId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const venueReviewsList = await db.select().from(venueReviews).where(eq(venueReviews.venueId, venueId));
  if (venueReviewsList.length === 0) return 0;
  const sum = venueReviewsList.reduce((acc, r) => acc + (r.rating || 0), 0);
  return sum / venueReviewsList.length;
}

export async function updateReview(id: number, data: Partial<InsertReview>): Promise<Review | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(reviews).set({ ...data, updatedAt: new Date() }).where(eq(reviews.id, id));
  const result = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  return result[0];
}

export async function getVenueReviewByBookingId(bookingId: number): Promise<VenueReview | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(venueReviews).where(eq(venueReviews.bookingId, bookingId)).limit(1);
  return result[0];
}

export async function getVenueReviewById(reviewId: number): Promise<VenueReview | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(venueReviews).where(eq(venueReviews.id, reviewId)).limit(1);
  return result[0];
}

export async function updateVenueReview(id: number, data: Partial<InsertVenueReview>): Promise<VenueReview | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(venueReviews).set({ ...data, updatedAt: new Date() }).where(eq(venueReviews.id, id));
  const result = await db.select().from(venueReviews).where(eq(venueReviews.id, id)).limit(1);
  return result[0];
}

// Analytics Functions
export async function getRevenueByMonth(artistId: number, months: number = 12): Promise<Array<{ month: string; revenue: number }>> {
  const db = await getDb();
  if (!db) return [];
  
  const artistBookings = await db.select().from(bookings)
    .where(eq(bookings.artistId, artistId));
  
  const monthlyRevenue: Record<string, number> = {};
  const now = new Date();
  
  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
    monthlyRevenue[monthKey] = 0;
  }
  
  // Calculate revenue from confirmed/completed bookings
  for (const booking of artistBookings) {
    if (booking.status === 'confirmed' || booking.status === 'completed') {
      const monthKey = booking.eventDate.toISOString().slice(0, 7);
      if (monthKey in monthlyRevenue) {
        monthlyRevenue[monthKey] += Number(booking.totalFee) || 0;
      }
    }
  }
  
  return Object.entries(monthlyRevenue)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, revenue]) => ({ month, revenue }));
}

// Profile View Functions
export async function getProfileViewCount(artistId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(profileViews).where(eq(profileViews.artistId, artistId));
  return result.length;
}

// Reminder Functions
export async function markReminderSent(reminderId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(bookingReminders).set({ sentAt: new Date() }).where(eq(bookingReminders.id, reminderId));
}



// ============= FORMERLY STUBBED FUNCTIONS - NOW REAL =============

/**
 * Get a user by their ID.
 */
export async function getUserById(userId: number): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] ?? null;
}

/**
 * Get a venue profile by verification token.
 */
export async function getVenueProfileByToken(token: string): Promise<VenueProfile | null> {
  const db = await getDb();
  if (!db) return null;
  // venueProfiles doesn't have a token column; search by verificationToken if it exists
  // For now, return null as this is a specialized lookup
  return null;
}

/**
 * Set availability for an artist on a specific date.
 */
export async function setAvailability(data: InsertAvailability): Promise<Availability | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Check if availability already exists for this artist + date
  const dateStr = typeof data.date === 'string' ? data.date : (data.date as Date).toISOString().split('T')[0];
  const existing = await db.select().from(availability)
    .where(and(eq(availability.artistId, data.artistId), eq(availability.date, dateStr)))
    .limit(1);
  
  if (existing[0]) {
    // Update existing
    await db.update(availability).set(data).where(eq(availability.id, existing[0].id));
    const updated = await db.select().from(availability).where(eq(availability.id, existing[0].id)).limit(1);
    return updated[0] ?? null;
  } else {
    // Insert new
    const result = await db.insert(availability).values(data);
    const id = (result as any)[0].insertId;
    const created = await db.select().from(availability).where(eq(availability.id, id)).limit(1);
    return created[0] ?? null;
  }
}

/**
 * Delete an availability record by ID.
 */
export async function deleteAvailability(availabilityId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.delete(availability).where(eq(availability.id, availabilityId));
    return true;
  } catch (error) {
    console.error('Error deleting availability:', error);
    return false;
  }
}

/**
 * Get saved events for a user.
 */
export async function getUserSavedEvents(userId: number): Promise<SavedEvent[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(savedEvents).where(eq(savedEvents.userId, userId));
}

/**
 * Get artist event history.
 */
export async function getArtistEventHistory(artistId: number): Promise<EventHistory[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(eventHistory).where(eq(eventHistory.artistId, artistId));
}

/**
 * Get event history by ID.
 */
export async function getEventHistoryById(historyId: number): Promise<EventHistory | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(eventHistory).where(eq(eventHistory.id, historyId)).limit(1);
  return result[0] ?? null;
}

/**
 * Get all events for an artist.
 */
export async function getArtistEvents(artistId: number): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(events).where(eq(events.artistId, artistId));
}

/**
 * Get public events for an artist.
 */
export async function getArtistPublicEvents(artistId: number): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(events)
    .where(and(eq(events.artistId, artistId), eq(events.isPublic, true)));
}

/**
 * Get upcoming events for an artist.
 */
export async function getArtistUpcomingEvents(artistId: number): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  const today = new Date().toISOString().split('T')[0];
  return await db.select().from(events)
    .where(and(
      eq(events.artistId, artistId),
      gte(events.eventDate, new Date(today))
    ));
}

/**
 * Get photos for an event history entry.
 */
export async function getEventPhotos(eventHistoryId: number): Promise<EventPhoto[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(eventPhotos).where(eq(eventPhotos.eventHistoryId, eventHistoryId));
}

/**
 * Add a photo to an event history entry.
 */
export async function addEventPhoto(data: InsertEventPhoto): Promise<EventPhoto | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(eventPhotos).values(data);
  const id = (result as any)[0].insertId;
  const photo = await db.select().from(eventPhotos).where(eq(eventPhotos.id, id)).limit(1);
  return photo[0] ?? null;
}

/**
 * Delete an event photo by ID.
 */
export async function deleteEventPhoto(photoId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.delete(eventPhotos).where(eq(eventPhotos.id, photoId));
    return true;
  } catch (error) {
    console.error('Error deleting event photo:', error);
    return false;
  }
}

/**
 * Delete an event recurrence by ID.
 */
export async function deleteEventRecurrence(recurrenceId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.delete(eventRecurrence).where(eq(eventRecurrence.id, recurrenceId));
    return true;
  } catch (error) {
    console.error('Error deleting event recurrence:', error);
    return false;
  }
}

/**
 * Get event recurrence for an event.
 */
export async function getEventRecurrence(eventId: number): Promise<EventRecurrence | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(eventRecurrence).where(eq(eventRecurrence.eventId, eventId)).limit(1);
  return result[0] ?? null;
}

/**
 * Search public events with filters.
 */
export async function searchPublicEvents(filters: {
  query?: string;
  city?: string;
  category?: string;
  genre?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [eq(events.isPublic, true)];
  
  if (filters.query) {
    conditions.push(
      or(
        like(events.eventTitle, `%${filters.query}%`),
        like(events.description, `%${filters.query}%`)
      )
    );
  }
  if (filters.city) {
    conditions.push(like(events.location, `%${filters.city}%`));
  }
  if (filters.category) {
    conditions.push(eq(events.eventType, filters.category as any));
  }
  if (filters.genre) {
    // Genre is on artist profiles, not events - skip this filter at event level
  }
  if (filters.startDate) {
    conditions.push(sql`${events.eventDate} >= ${filters.startDate}`);
  }
  if (filters.endDate) {
    conditions.push(sql`${events.eventDate} <= ${filters.endDate}`);
  }
  
  return await db.select().from(events).where(and(...conditions));
}

/**
 * Save an event for a user.
 */
export async function saveEvent(eventId: number, userId: number): Promise<SavedEvent | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Check if already saved
  const existing = await db.select().from(savedEvents)
    .where(and(eq(savedEvents.userId, userId), eq(savedEvents.eventId, eventId)))
    .limit(1);
  
  if (existing[0]) return existing[0];
  
  const result = await db.insert(savedEvents).values({ userId, eventId } as InsertSavedEvent);
  const id = (result as any)[0].insertId;
  const saved = await db.select().from(savedEvents).where(eq(savedEvents.id, id)).limit(1);
  return saved[0] ?? null;
}

/**
 * Remove a saved event for a user.
 */
export async function removeSavedEvent(userId: number, eventId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.delete(savedEvents).where(
      and(eq(savedEvents.userId, userId), eq(savedEvents.eventId, eventId))
    );
    return true;
  } catch (error) {
    console.error('Error removing saved event:', error);
    return false;
  }
}

/**
 * Check if an event is saved by a user.
 */
export async function isEventSaved(userId: number, eventId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(savedEvents)
    .where(and(eq(savedEvents.userId, userId), eq(savedEvents.eventId, eventId)))
    .limit(1);
  return result.length > 0;
}

/**
 * Get favorited artists' availability for a venue within a date range.
 */
export async function getFavoritedArtistsAvailability(
  venueId: number, 
  startDate: Date, 
  endDate: Date
): Promise<Array<{ id: number; artistId: number; artistName: string; date: string; status: string }>> {
  const db = await getDb();
  if (!db) return [];
  
  // Get favorited artist IDs
  const favs = await db.select().from(favorites).where(eq(favorites.venueId, venueId));
  const artistIds = favs.map(f => f.artistId);
  if (artistIds.length === 0) return [];
  
  // Get availability for those artists in the date range
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  
  const availRecords = await db.select().from(availability)
    .where(and(
      inArray(availability.artistId, artistIds),
      sql`${availability.date} >= ${startStr}`,
      sql`${availability.date} <= ${endStr}`
    ));
  
  // Get artist names
  const artists = await db.select().from(artistProfiles)
    .where(inArray(artistProfiles.id, artistIds));
   const artistMap = new Map(artists.map(a => [a.id, a.artistName || 'Unknown']));

  return availRecords.map((a: any) => ({
    id: a.id,
    artistId: a.artistId,
    artistName: artistMap.get(a.artistId) || 'Unknown',
    date: typeof a.date === 'string' ? a.date : (a.date as Date).toISOString().split('T')[0],
    status: a.status || 'available',
  }));
}

/**
 * Get payment history for a booking (from invoices table).
 */
export async function getPaymentHistory(bookingId: number): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(invoices).where(eq(invoices.bookingId, bookingId));
}

/**
 * Record a refund for a booking.
 */
export async function recordRefund(
  refundId: string, 
  bookingId: number, 
  reason?: string
): Promise<{ success: boolean; refundId: string }> {
  const db = await getDb();
  if (!db) return { success: false, refundId };
  
  try {
    // Update the booking's payment status to refunded
    await db.update(bookings).set({
      paymentStatus: 'refunded',
      stripeRefundId: refundId,
    }).where(eq(bookings.id, bookingId));
    
    return { success: true, refundId };
  } catch (error) {
    console.error('Error recording refund:', error);
    return { success: false, refundId };
  }
}

/**
 * Get venue bookings within a date range.
 */
export async function getVenueBookingsByDateRange(
  venueId: number, 
  startDate: Date, 
  endDate: Date
): Promise<Array<{ id: number; artistId: number; artistName: string; eventDate: string; eventTime: string; status: string }>> {
  const db = await getDb();
  if (!db) return [];
  
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  
  const venueBookings = await db.select().from(bookings)
    .where(and(
      eq(bookings.venueId, venueId),
      gte(bookings.eventDate, new Date(startStr)),
      lte(bookings.eventDate, new Date(endStr))
    ));
  
  // Get artist names
  const artistIds = [...new Set(venueBookings.map(b => b.artistId))];
  if (artistIds.length === 0) return [];
  
  const artists = await db.select().from(artistProfiles)
    .where(inArray(artistProfiles.id, artistIds));
  const artistMap = new Map(artists.map(a => [a.id, a.artistName || 'Unknown']));

  return venueBookings.map((b: any) => ({
    id: b.id,
    artistId: b.artistId,
    artistName: artistMap.get(b.artistId) || 'Unknown',
    eventDate: typeof b.eventDate === 'string' ? b.eventDate : (b.eventDate as Date).toISOString().split('T')[0],
    eventTime: b.eventTime || '',
    status: b.status || 'pending',
  }));
}

/**
 * Find similar events based on event type, location, and date proximity.
 * Returns up to `limit` public events that are not the current event,
 * scored by relevance: same type > same location > close date.
 */
export async function getSimilarEvents(
  eventId: number,
  opts: { limit?: number } = {}
): Promise<(Event & { artistName?: string; similarityScore: number })[]> {
  const db = await getDb();
  if (!db) return [];

  // First, fetch the source event
  const [sourceEvent] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!sourceEvent) return [];

  const limit = opts.limit ?? 6;

  // Fetch public events that are not the current event and not cancelled
  const candidates = await db
    .select()
    .from(events)
    .where(
      and(
        ne(events.id, eventId),
        eq(events.isPublic, true),
        ne(events.status, 'cancelled' as any)
      )
    )
    .limit(50); // fetch a reasonable pool to score

  // Score each candidate for similarity
  const scored = candidates.map((candidate) => {
    let score = 0;

    // Same event type: +3 points
    if (candidate.eventType === sourceEvent.eventType) {
      score += 3;
    }

    // Same or similar location: +2 points (exact match) or +1 (partial)
    if (sourceEvent.location && candidate.location) {
      const srcLoc = sourceEvent.location.toLowerCase();
      const candLoc = candidate.location.toLowerCase();
      if (srcLoc === candLoc) {
        score += 2;
      } else {
        // Check city-level match (last part of comma-separated address)
        const srcCity = srcLoc.split(',').pop()?.trim() || '';
        const candCity = candLoc.split(',').pop()?.trim() || '';
        if (srcCity && candCity && srcCity === candCity) {
          score += 1;
        }
      }
    }

    // Date proximity: +2 for within 30 days, +1 for within 90 days
    if (sourceEvent.eventDate && candidate.eventDate) {
      const srcDate = new Date(sourceEvent.eventDate);
      const candDate = new Date(candidate.eventDate);
      const diffDays = Math.abs(
        (candDate.getTime() - srcDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= 30) {
        score += 2;
      } else if (diffDays <= 90) {
        score += 1;
      }
    }

    // Same artist: +1 point (users who like this artist may like their other events)
    if (candidate.artistId === sourceEvent.artistId) {
      score += 1;
    }

    return { ...candidate, similarityScore: score };
  });

  // Sort by score descending, then by date ascending (upcoming first)
  scored.sort((a, b) => {
    if (b.similarityScore !== a.similarityScore) {
      return b.similarityScore - a.similarityScore;
    }
    // Tie-break: upcoming events first
    const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
    const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
    return dateA - dateB;
  });

  // Take top results
  const topResults = scored.slice(0, limit);

  // Enrich with artist names
  const artistIds = [...new Set(topResults.map((e) => e.artistId))];
  if (artistIds.length === 0) return topResults.map((e) => ({ ...e, artistName: undefined }));

  const artists = await db
    .select({ id: artistProfiles.id, artistName: artistProfiles.artistName })
    .from(artistProfiles)
    .where(inArray(artistProfiles.id, artistIds));

  const artistMap = new Map(artists.map((a) => [a.id, a.artistName]));

  return topResults.map((e) => ({
    ...e,
    artistName: artistMap.get(e.artistId) || undefined,
  }));
}


// ============= ARTIST RELEASE FUNCTIONS (White Label Release) =============

/**
 * Create a new artist release (single track).
 */
export async function createRelease(data: InsertArtistRelease): Promise<ArtistRelease> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(artistReleases).values(data);
  const id = (result as any)[0].insertId;
  const release = await db.select().from(artistReleases).where(eq(artistReleases.id, id)).limit(1);
  return release[0] as ArtistRelease;
}

/**
 * Get a release by ID.
 */
export async function getReleaseById(id: number): Promise<ArtistRelease | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(artistReleases).where(eq(artistReleases.id, id)).limit(1);
  return result[0] ?? null;
}

/**
 * Get all releases for an artist (for dashboard management).
 */
export async function getReleasesByArtistId(artistId: number): Promise<ArtistRelease[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(artistReleases)
    .where(eq(artistReleases.artistId, artistId))
    .orderBy(desc(artistReleases.createdAt));
}

/**
 * Get published releases for an artist (for public profile).
 */
export async function getPublishedReleasesByArtistId(artistId: number): Promise<ArtistRelease[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(artistReleases)
    .where(and(
      eq(artistReleases.artistId, artistId),
      eq(artistReleases.status, 'published')
    ))
    .orderBy(desc(artistReleases.publishedAt));
}

/**
 * Get count of active (non-archived, non-taken_down) releases for tier gating.
 */
export async function getActiveReleaseCount(artistId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(artistReleases)
    .where(and(
      eq(artistReleases.artistId, artistId),
      or(
        eq(artistReleases.status, 'draft'),
        eq(artistReleases.status, 'published')
      )
    ));
  return result.length;
}

/**
 * Update a release.
 */
export async function updateRelease(id: number, data: Partial<InsertArtistRelease>): Promise<ArtistRelease | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(artistReleases).set(data).where(eq(artistReleases.id, id));
  return await getReleaseById(id);
}

/**
 * Delete a release (hard delete — only for drafts).
 */
export async function deleteRelease(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.delete(artistReleases).where(eq(artistReleases.id, id));
    return true;
  } catch (error) {
    console.error('Error deleting release:', error);
    return false;
  }
}

/**
 * Increment sales counters on a release after a successful purchase.
 */
export async function incrementReleaseSales(releaseId: number, amountCents: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(artistReleases).set({
    totalSales: sql`${artistReleases.totalSales} + 1`,
    totalRevenueCents: sql`${artistReleases.totalRevenueCents} + ${amountCents}`,
  }).where(eq(artistReleases.id, releaseId));
}

// ============= RELEASE PURCHASE FUNCTIONS =============

/**
 * Create a purchase record after successful Stripe checkout.
 */
export async function createReleasePurchase(data: InsertReleasePurchase): Promise<ReleasePurchase> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(releasePurchases).values(data);
  const id = (result as any)[0].insertId;
  const purchase = await db.select().from(releasePurchases).where(eq(releasePurchases.id, id)).limit(1);
  return purchase[0] as ReleasePurchase;
}

/**
 * Get a purchase by Stripe checkout session ID (for webhook idempotency).
 */
export async function getPurchaseBySessionId(sessionId: string): Promise<ReleasePurchase | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(releasePurchases)
    .where(eq(releasePurchases.stripeCheckoutSessionId, sessionId))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Get a purchase by ID.
 */
export async function getPurchaseById(id: number): Promise<ReleasePurchase | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(releasePurchases).where(eq(releasePurchases.id, id)).limit(1);
  return result[0] ?? null;
}

/**
 * Get all purchases for a release (for artist sales dashboard).
 */
export async function getPurchasesByReleaseId(releaseId: number): Promise<ReleasePurchase[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(releasePurchases)
    .where(eq(releasePurchases.releaseId, releaseId))
    .orderBy(desc(releasePurchases.purchasedAt));
}

/**
 * Get purchases by buyer email (for download access verification).
 */
export async function getPurchasesByBuyerEmail(email: string, releaseId: number): Promise<ReleasePurchase | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(releasePurchases)
    .where(and(
      eq(releasePurchases.buyerEmail, email),
      eq(releasePurchases.releaseId, releaseId)
    ))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Increment download count for a purchase.
 */
export async function incrementDownloadCount(purchaseId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(releasePurchases).set({
    downloadCount: sql`${releasePurchases.downloadCount} + 1`,
    lastDownloadedAt: new Date(),
  }).where(eq(releasePurchases.id, purchaseId));
}

/**
 * Get total sales stats for an artist across all releases.
 */
export async function getArtistReleaseSalesStats(artistId: number): Promise<{
  totalReleases: number;
  publishedReleases: number;
  totalSales: number;
  totalRevenueCents: number;
}> {
  const db = await getDb();
  if (!db) return { totalReleases: 0, publishedReleases: 0, totalSales: 0, totalRevenueCents: 0 };
  
  const releases = await db.select().from(artistReleases)
    .where(eq(artistReleases.artistId, artistId));
  
  return {
    totalReleases: releases.length,
    publishedReleases: releases.filter(r => r.status === 'published').length,
    totalSales: releases.reduce((sum, r) => sum + r.totalSales, 0),
    totalRevenueCents: releases.reduce((sum, r) => sum + r.totalRevenueCents, 0),
  };
}


/**
 * Update an event history entry.
 */
export async function updateEventHistory(historyId: number, data: Partial<InsertEventHistory>): Promise<EventHistory | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(eventHistory).set(data).where(eq(eventHistory.id, historyId));
  const result = await db.select().from(eventHistory).where(eq(eventHistory.id, historyId)).limit(1);
  return result[0] ?? null;
}

/**
 * Delete an event history entry and its associated photos.
 */
export async function deleteEventHistory(historyId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    // Delete associated photos first
    await db.delete(eventPhotos).where(eq(eventPhotos.eventHistoryId, historyId));
    // Delete the history entry
    await db.delete(eventHistory).where(eq(eventHistory.id, historyId));
    return true;
  } catch (error) {
    console.error('Error deleting event history:', error);
    return false;
  }
}

/**
 * Get portfolio stats for an artist (history count + photo count).
 */
export async function getArtistPortfolioStats(artistId: number): Promise<{ historyCount: number; photoCount: number }> {
  const db = await getDb();
  if (!db) return { historyCount: 0, photoCount: 0 };
  const histories = await db.select().from(eventHistory).where(eq(eventHistory.artistId, artistId));
  const historyIds = histories.map(h => h.id);
  let photoCount = 0;
  if (historyIds.length > 0) {
    const photos = await db.select().from(eventPhotos).where(inArray(eventPhotos.eventHistoryId, historyIds));
    photoCount = photos.length;
  }
  return { historyCount: histories.length, photoCount };
}

/**
 * Get recent portfolio photos for an artist (for profile preview).
 */
export async function getArtistRecentPhotos(artistId: number, limit: number = 3): Promise<EventPhoto[]> {
  const db = await getDb();
  if (!db) return [];
  const histories = await db.select().from(eventHistory).where(eq(eventHistory.artistId, artistId));
  const historyIds = histories.map(h => h.id);
  if (historyIds.length === 0) return [];
  const photos = await db.select().from(eventPhotos)
    .where(inArray(eventPhotos.eventHistoryId, historyIds))
    .orderBy(desc(eventPhotos.createdAt))
    .limit(limit);
  return photos;
}


// ============= TRACK REVIEW FUNCTIONS =============

import { trackReviews, type TrackReview, type InsertTrackReview } from "../drizzle/schema";

/**
 * Check if a user has purchased a specific release.
 */
export async function hasUserPurchasedRelease(userId: number, releaseId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(releasePurchases)
    .where(and(
      eq(releasePurchases.buyerUserId, userId),
      eq(releasePurchases.releaseId, releaseId),
    ))
    .limit(1);
  return result.length > 0;
}

/**
 * Get a user's review for a specific release (if any).
 */
export async function getUserReviewForRelease(userId: number, releaseId: number): Promise<TrackReview | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(trackReviews)
    .where(and(
      eq(trackReviews.userId, userId),
      eq(trackReviews.releaseId, releaseId),
    ))
    .limit(1);
  return result[0] || null;
}

/**
 * Create a track review (one per user per release, enforced by unique constraint).
 */
export async function createTrackReview(data: { releaseId: number; userId: number; rating: number; reviewText?: string }): Promise<TrackReview> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(trackReviews).values({
    releaseId: data.releaseId,
    userId: data.userId,
    rating: data.rating,
    reviewText: data.reviewText || null,
  }).$returningId();
  const review = await db.select().from(trackReviews).where(eq(trackReviews.id, result.id)).limit(1);
  return review[0];
}

/**
 * Update an existing track review.
 */
export async function updateTrackReview(reviewId: number, data: { rating?: number; reviewText?: string }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(trackReviews).set(data).where(eq(trackReviews.id, reviewId));
}

/**
 * Delete a track review.
 */
export async function deleteTrackReview(reviewId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(trackReviews).where(eq(trackReviews.id, reviewId));
}

/**
 * Get all reviews for a release, ordered by newest first.
 */
export async function getReviewsByReleaseId(releaseId: number): Promise<TrackReview[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(trackReviews)
    .where(eq(trackReviews.releaseId, releaseId))
    .orderBy(sql`${trackReviews.createdAt} DESC`);
}

/**
 * Get average rating and review count for a release.
 */
export async function getReleaseReviewStats(releaseId: number): Promise<{ avgRating: number; reviewCount: number }> {
  const db = await getDb();
  if (!db) return { avgRating: 0, reviewCount: 0 };
  const result = await db.select({
    avgRating: sql<number>`COALESCE(AVG(${trackReviews.rating}), 0)`,
    reviewCount: sql<number>`COUNT(*)`,
  }).from(trackReviews)
    .where(eq(trackReviews.releaseId, releaseId));
  return {
    avgRating: Number(result[0]?.avgRating || 0),
    reviewCount: Number(result[0]?.reviewCount || 0),
  };
}


/**
 * Get a single track review by ID.
 */
export async function getTrackReviewById(reviewId: number): Promise<TrackReview | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(trackReviews).where(eq(trackReviews.id, reviewId)).limit(1);
  return result[0] || null;
}


// ============= NOTIFICATION FUNCTIONS =============

export async function createNotification(data: InsertNotification): Promise<Notification> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(notifications).values(data);
  const id = Number(result[0].insertId);
  return (await db.select().from(notifications).where(eq(notifications.id, id)).limit(1))[0];
}

export async function getNotificationsByUserId(
  userId: number,
  opts: { limit?: number; offset?: number } = {}
): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  const limit = opts.limit || 50;
  const offset = opts.offset || 0;
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count || 0;
}

export async function markNotificationRead(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  return true;
}

export async function markAllNotificationsRead(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return true;
}

export async function deleteNotification(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  return true;
}

// ============= NOTIFICATION PREFERENCE FUNCTIONS =============

export async function getNotificationPreferences(userId: number): Promise<NotificationPreference | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  return result[0];
}

export async function upsertNotificationPreferences(
  userId: number,
  data: Partial<InsertNotificationPreference>
): Promise<NotificationPreference> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const existing = await getNotificationPreferences(userId);
  if (existing) {
    await db
      .update(notificationPreferences)
      .set(data)
      .where(eq(notificationPreferences.userId, userId));
    return (await getNotificationPreferences(userId))!;
  } else {
    const result = await db.insert(notificationPreferences).values({ userId, ...data });
    const id = Number(result[0].insertId);
    return (await db.select().from(notificationPreferences).where(eq(notificationPreferences.id, id)).limit(1))[0];
  }
}


/**
 * Get all purchases for a user (for My Purchases page).
 * Joins with artistReleases to include release details.
 */
export async function getUserPurchases(userId: number, userEmail?: string): Promise<Array<ReleasePurchase & { release: ArtistRelease | null }>> {
  const db = await getDb();
  if (!db) return [];
  // Match by userId OR by email (handles cases where purchase was made before login or on different session)
  const conditions = [eq(releasePurchases.buyerUserId, userId)];
  if (userEmail) {
    conditions.push(eq(releasePurchases.buyerEmail, userEmail));
  }
  const purchases = await db.select().from(releasePurchases)
    .where(or(...conditions))
    .orderBy(desc(releasePurchases.purchasedAt));
  
  // Fetch release details for each purchase
  const results = await Promise.all(
    purchases.map(async (purchase) => {
      const release = await getReleaseById(purchase.releaseId);
      return { ...purchase, release };
    })
  );
  return results;
}

/**
 * Get a purchase by Stripe checkout session ID with release details (for success page).
 */
export async function getPurchaseBySessionIdWithRelease(sessionId: string): Promise<(ReleasePurchase & { release: ArtistRelease | null }) | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(releasePurchases)
    .where(eq(releasePurchases.stripeCheckoutSessionId, sessionId))
    .limit(1);
  if (!result[0]) return null;
  const release = await getReleaseById(result[0].releaseId);
  return { ...result[0], release };
}


/**
 * Get release sales analytics for an artist.
 * Returns per-release stats (sales count, gross revenue, platform fees, net revenue)
 * plus an overall summary. Uses denormalized counters on artist_releases for performance,
 * with detailed per-purchase data from release_purchases for time-series.
 */
export async function getReleaseSalesAnalytics(artistProfileId: number): Promise<{
  summary: { totalSales: number; totalGrossRevenueCents: number; totalPlatformFeeCents: number; totalNetRevenueCents: number; releaseCount: number };
  releases: Array<{
    id: number;
    title: string;
    genre: string | null;
    priceInCents: number;
    status: string;
    publishedAt: Date | null;
    totalSales: number;
    totalRevenueCents: number;
    coverArtKey: string;
    recentPurchases: Array<{
      amountPaidCents: number;
      platformFeeCents: number;
      artistNetCents: number;
      purchasedAt: Date;
    }>;
  }>;
}> {
  const db = await getDb();
  if (!db) return { summary: { totalSales: 0, totalGrossRevenueCents: 0, totalPlatformFeeCents: 0, totalNetRevenueCents: 0, releaseCount: 0 }, releases: [] };

  // Get all releases for this artist
  const releases = await db.select().from(artistReleases)
    .where(eq(artistReleases.artistId, artistProfileId))
    .orderBy(desc(artistReleases.createdAt));

  let totalSales = 0;
  let totalGrossRevenueCents = 0;
  let totalPlatformFeeCents = 0;
  let totalNetRevenueCents = 0;

  const releasesWithStats = await Promise.all(
    releases.map(async (release) => {
      // Get recent purchases for this release (last 50 for time-series)
      const purchases = await db.select({
        amountPaidCents: releasePurchases.amountPaidCents,
        platformFeeCents: releasePurchases.platformFeeCents,
        artistNetCents: releasePurchases.artistNetCents,
        purchasedAt: releasePurchases.purchasedAt,
      }).from(releasePurchases)
        .where(eq(releasePurchases.releaseId, release.id))
        .orderBy(desc(releasePurchases.purchasedAt))
        .limit(50);

      // Calculate totals from purchases for accuracy
      const grossFromPurchases = purchases.reduce((sum, p) => sum + p.amountPaidCents, 0);
      const feesFromPurchases = purchases.reduce((sum, p) => sum + p.platformFeeCents, 0);
      const netFromPurchases = purchases.reduce((sum, p) => sum + p.artistNetCents, 0);

      // Use denormalized counters for totals (more accurate for all-time)
      totalSales += release.totalSales;
      totalGrossRevenueCents += release.totalRevenueCents;
      totalPlatformFeeCents += feesFromPurchases;
      totalNetRevenueCents += netFromPurchases;

      return {
        id: release.id,
        title: release.title,
        genre: release.genre,
        priceInCents: release.priceInCents,
        status: release.status,
        publishedAt: release.publishedAt,
        totalSales: release.totalSales,
        totalRevenueCents: release.totalRevenueCents,
        coverArtKey: release.coverArtKey,
        recentPurchases: purchases,
      };
    })
  );

  return {
    summary: {
      totalSales,
      totalGrossRevenueCents,
      totalPlatformFeeCents,
      totalNetRevenueCents,
      releaseCount: releases.length,
    },
    releases: releasesWithStats,
  };
}


// ── Unsubscribe Feedback ──────────────────────────────────────────────

export async function insertUnsubscribeFeedback(data: {
  userId: number | null;
  email: string | null;
  reason: string;
  comment: string | null;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(unsubscribeFeedback).values({
    userId: data.userId,
    email: data.email,
    reason: data.reason,
    comment: data.comment,
  });
  return result;
}

export async function getUnsubscribeFeedbackStats() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      reason: unsubscribeFeedback.reason,
      count: sql<number>`COUNT(*)`,
    })
    .from(unsubscribeFeedback)
    .groupBy(unsubscribeFeedback.reason)
    .orderBy(desc(sql`COUNT(*)`));
  return rows;
}


// ============= BOOKING DISPUTE FUNCTIONS =============

export async function createDispute(data: InsertBookingDispute): Promise<BookingDispute> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(bookingDisputes).values(data);
  const id = (result as any)[0].insertId;
  const dispute = await db.select().from(bookingDisputes).where(eq(bookingDisputes.id, id)).limit(1);
  return dispute[0] as BookingDispute;
}

export async function getDisputeById(id: number): Promise<BookingDispute | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookingDisputes).where(eq(bookingDisputes.id, id)).limit(1);
  return result[0];
}

export async function getDisputesByUserId(userId: number): Promise<BookingDispute[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookingDisputes)
    .where(or(eq(bookingDisputes.reporterId, userId), eq(bookingDisputes.respondentId, userId)))
    .orderBy(desc(bookingDisputes.createdAt));
}

export async function getDisputeByBookingId(bookingId: number): Promise<BookingDispute | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookingDisputes).where(eq(bookingDisputes.bookingId, bookingId)).limit(1);
  return result[0];
}

export async function getAllDisputes(statusFilter?: string): Promise<BookingDispute[]> {
  const db = await getDb();
  if (!db) return [];
  if (statusFilter && statusFilter !== 'all') {
    return db.select().from(bookingDisputes)
      .where(eq(bookingDisputes.status, statusFilter as any))
      .orderBy(desc(bookingDisputes.createdAt));
  }
  return db.select().from(bookingDisputes).orderBy(desc(bookingDisputes.createdAt));
}

export async function updateDisputeStatus(
  id: number,
  data: { status: string; resolution?: string; adminNotes?: string; resolvedById?: number; resolvedAt?: Date }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(bookingDisputes).set(data as any).where(eq(bookingDisputes.id, id));
}


// ============= VIDEO MODERATION FUNCTIONS =============

export async function createVideoModerationEntry(data: InsertVideoModerationQueue): Promise<VideoModerationQueue> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(videoModerationQueue).values(data);
  const id = (result as any)[0].insertId;
  const entry = await db.select().from(videoModerationQueue).where(eq(videoModerationQueue.id, id)).limit(1);
  return entry[0];
}

export async function getVideoModerationQueue(statusFilter?: string): Promise<VideoModerationQueue[]> {
  const db = await getDb();
  if (!db) return [];
  if (statusFilter && statusFilter !== 'all') {
    return db.select().from(videoModerationQueue)
      .where(eq(videoModerationQueue.status, statusFilter as any))
      .orderBy(desc(videoModerationQueue.createdAt));
  }
  return db.select().from(videoModerationQueue).orderBy(desc(videoModerationQueue.createdAt));
}

export async function getVideoModerationEntry(id: number): Promise<VideoModerationQueue | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(videoModerationQueue).where(eq(videoModerationQueue.id, id)).limit(1);
  return result[0];
}

export async function updateVideoModerationStatus(
  id: number,
  data: { status: string; reviewedBy?: number; reviewedAt?: Date; rejectionReason?: string }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(videoModerationQueue).set(data as any).where(eq(videoModerationQueue.id, id));
}

export async function getPendingVideoCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` })
    .from(videoModerationQueue)
    .where(eq(videoModerationQueue.status, 'pending'));
  return result[0]?.count || 0;
}


// ============= VIDEO FLAG FUNCTIONS =============

export async function flagVideo(artistProfileId: number, flaggedByUserId: number, reason: string, details?: string): Promise<{ flagCount: number; autoHidden: boolean }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Check if user already flagged this video
  const existing = await db.select().from(videoFlags)
    .where(and(
      eq(videoFlags.artistProfileId, artistProfileId),
      eq(videoFlags.flaggedByUserId, flaggedByUserId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    throw new Error('You have already reported this video');
  }
  
  // Insert the flag
  await db.insert(videoFlags).values({
    artistProfileId,
    flaggedByUserId,
    reason: reason as any,
    details: details || null,
  });
  
  // Increment flag count on artist profile
  await db.update(artistProfiles)
    .set({ performanceVideoFlagCount: sql`${artistProfiles.performanceVideoFlagCount} + 1` })
    .where(eq(artistProfiles.id, artistProfileId));
  
  // Get updated flag count
  const profile = await db.select({ flagCount: artistProfiles.performanceVideoFlagCount })
    .from(artistProfiles)
    .where(eq(artistProfiles.id, artistProfileId))
    .limit(1);
  
  const flagCount = profile[0]?.flagCount || 0;
  let autoHidden = false;
  
  // Auto-hide if 3+ flags
  if (flagCount >= 3) {
    await db.update(artistProfiles)
      .set({ performanceVideoStatus: 'flagged' as any })
      .where(eq(artistProfiles.id, artistProfileId));
    autoHidden = true;
  }
  
  return { flagCount, autoHidden };
}

export async function getFlagsForArtist(artistProfileId: number): Promise<VideoFlag[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videoFlags)
    .where(eq(videoFlags.artistProfileId, artistProfileId))
    .orderBy(desc(videoFlags.createdAt));
}

export async function hasUserFlaggedVideo(artistProfileId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(videoFlags)
    .where(and(
      eq(videoFlags.artistProfileId, artistProfileId),
      eq(videoFlags.flaggedByUserId, userId)
    ))
    .limit(1);
  return result.length > 0;
}

export async function getFlaggedVideos(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select({
    id: artistProfiles.id,
    userId: artistProfiles.userId,
    artistName: artistProfiles.artistName,
    performanceVideoUrl: artistProfiles.performanceVideoUrl,
    performanceVideoStatus: artistProfiles.performanceVideoStatus,
    performanceVideoFlagCount: artistProfiles.performanceVideoFlagCount,
    performanceVideoUploadedAt: artistProfiles.performanceVideoUploadedAt,
  })
    .from(artistProfiles)
    .where(
      or(
        eq(artistProfiles.performanceVideoStatus, 'flagged' as any),
        gte(artistProfiles.performanceVideoFlagCount, 1)
      )
    )
    .orderBy(desc(artistProfiles.performanceVideoFlagCount));
  return results;
}

export async function dismissVideoFlags(artistProfileId: number, adminUserId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  // Clear all flags
  await db.delete(videoFlags).where(eq(videoFlags.artistProfileId, artistProfileId));
  // Reset flag count and restore approved status
  await db.update(artistProfiles)
    .set({ 
      performanceVideoFlagCount: 0, 
      performanceVideoStatus: 'approved' as any 
    })
    .where(eq(artistProfiles.id, artistProfileId));
}

export async function takeDownVideo(artistProfileId: number, adminUserId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  // Set status to taken_down
  await db.update(artistProfiles)
    .set({ performanceVideoStatus: 'taken_down' as any })
    .where(eq(artistProfiles.id, artistProfileId));
}
