import { eq, and, gte, lte, inArray, like, or, desc, sql, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  artistProfiles, InsertArtistProfile, ArtistProfile,
  venueProfiles, InsertVenueProfile, VenueProfile,
  riderTemplates, InsertRiderTemplate, RiderTemplate,
  availability, InsertAvailability, Availability,
  bookings, InsertBooking, Booking,
  messages, InsertMessage, Message,
  subscriptions, InsertSubscription, Subscription,
  reviews, InsertReview, Review,
  venueReviews, InsertVenueReview, VenueReview,
  favorites, InsertFavorite, Favorite,
  bookingTemplates, InsertBookingTemplate, BookingTemplate,
  profileViews, InsertProfileView, ProfileView,
  bookingReminders, InsertBookingReminder, BookingReminder
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USER FUNCTIONS =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(userId: number, role: 'artist' | 'venue') {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set({ role }).where(eq(users.id, userId));
}
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= ARTIST PROFILE FUNCTIONS =============

export async function createArtistProfile(profile: InsertArtistProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(artistProfiles).values(profile);
  return result;
}

export async function getArtistProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(artistProfiles).where(eq(artistProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getArtistProfileById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(artistProfiles).where(eq(artistProfiles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateArtistProfile(id: number, updates: Partial<ArtistProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(artistProfiles).set(updates).where(eq(artistProfiles.id, id));
}

export async function searchArtists(filters: {
  genre?: string[];
  location?: string;
  minFee?: number;
  maxFee?: number;
  availableFrom?: string;
  availableTo?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(artistProfiles);
  
  // Note: Genre filtering with JSON arrays requires custom SQL or post-processing
  // For MVP, we'll return all and filter in application code if needed
  
  const results = await query;
  
  // Apply filters in application code for MVP
  let filtered = results;
  
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
  if (!db) return [];
  
  return await db.select().from(artistProfiles);
}

// ============= VENUE PROFILE FUNCTIONS =============

export async function createVenueProfile(profile: InsertVenueProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(venueProfiles).values(profile);
  return result;
}

export async function getVenueProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(venueProfiles).where(eq(venueProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getVenueProfileById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(venueProfiles).where(eq(venueProfiles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateVenueProfile(id: number, updates: Partial<VenueProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(venueProfiles).set(updates).where(eq(venueProfiles.id, id));
}

// ============= RIDER TEMPLATE FUNCTIONS =============

export async function createRiderTemplate(template: InsertRiderTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(riderTemplates).values(template);
  return result;
}

export async function getRiderTemplatesByArtistId(artistId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(riderTemplates).where(eq(riderTemplates.artistId, artistId));
}

export async function getRiderTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(riderTemplates).where(eq(riderTemplates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateRiderTemplate(id: number, updates: Partial<RiderTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(riderTemplates).set(updates).where(eq(riderTemplates.id, id));
}

export async function deleteRiderTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(riderTemplates).where(eq(riderTemplates.id, id));
}

// ============= AVAILABILITY FUNCTIONS =============

export async function setAvailability(avail: InsertAvailability) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(availability).values(avail).onDuplicateKeyUpdate({
    set: { status: avail.status, notes: avail.notes }
  });
}

export async function getAvailabilityByArtistId(artistId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(availability).where(eq(availability.artistId, artistId));
  
  // If date range provided, filter (would need to add date comparison logic)
  const results = await query;
  
  if (startDate && endDate) {
    return results.filter(a => {
      const dateStr = a.date instanceof Date ? a.date.toISOString().split('T')[0] : a.date;
      return dateStr >= startDate && dateStr <= endDate;
    });
  }
  
  return results;
}

export async function getAvailabilityForDate(artistId: number, date: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(availability)
    .where(and(
      eq(availability.artistId, artistId),
      sql`${availability.date} = ${date}`
    ))
    .limit(1);
    
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteAvailability(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(availability).where(eq(availability.id, id));
}

// ============= BOOKING FUNCTIONS =============

export async function createBooking(booking: InsertBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(bookings).values(booking);
  // Get the inserted booking
  const newBooking = await db.select().from(bookings)
    .where(eq(bookings.id, sql`LAST_INSERT_ID()`))
    .limit(1);
  return newBooking[0]?.id || 0;
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBookingsByArtistId(artistId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(bookings)
    .where(eq(bookings.artistId, artistId))
    .orderBy(desc(bookings.createdAt));
}

export async function getBookingsByVenueId(venueId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(bookings)
    .where(eq(bookings.venueId, venueId))
    .orderBy(desc(bookings.createdAt));
}

export async function updateBooking(id: number, updates: Partial<Booking>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(bookings).set(updates).where(eq(bookings.id, id));
}

// ============= MESSAGE FUNCTIONS =============

export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(messages).values(message);
  return result;
}

export async function getMessagesByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(messages)
    .where(eq(messages.bookingId, bookingId))
    .orderBy(messages.sentAt);
}

export async function markMessageAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(messages).set({ readAt: new Date() }).where(eq(messages.id, id));
}

// ============= SUBSCRIPTION FUNCTIONS =============

export async function createSubscription(subscription: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(subscriptions).values(subscription);
  return result;
}

export async function getSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSubscription(userId: number, updates: Partial<Subscription>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(subscriptions).set(updates).where(eq(subscriptions.userId, userId));
}

export async function upsertSubscription(data: {
  userId: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  planType: string;
  status: 'active' | 'inactive' | 'trialing' | 'canceled' | 'past_due';
  currentPeriodEnd?: Date;
}) {
  const db = await getDb();
  if (!db) return;

  await db.insert(subscriptions).values(data).onDuplicateKeyUpdate({
    set: {
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      status: data.status,
      currentPeriodEnd: data.currentPeriodEnd,
      updatedAt: new Date(),
    },
  });
}

export async function updateSubscriptionStatus(
  userId: number,
  status: 'active' | 'inactive' | 'trialing' | 'canceled' | 'past_due'
) {
  const db = await getDb();
  if (!db) return;

  await db.update(subscriptions)
    .set({ status, updatedAt: new Date() })
    .where(eq(subscriptions.userId, userId));
}

// ============= REVIEW FUNCTIONS =============

export async function createReview(review: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(reviews).values(review);
  return result;
}

export async function getReviewsByArtistId(artistId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(reviews)
    .where(eq(reviews.artistId, artistId))
    .orderBy(desc(reviews.createdAt));
}

export async function getReviewByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(reviews).where(eq(reviews.bookingId, bookingId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getReviewById(reviewId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateReview(reviewId: number, updates: { artistResponse?: string, respondedAt?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reviews).set(updates).where(eq(reviews.id, reviewId));
}

export async function getAverageRatingForArtist(artistId: number): Promise<{ average: number; count: number }> {
  const db = await getDb();
  if (!db) return { average: 0, count: 0 };
  
  const artistReviews = await getReviewsByArtistId(artistId);
  if (!artistReviews || artistReviews.length === 0) {
    return { average: 0, count: 0 };
  }
  
  const sum = artistReviews.reduce((acc, review) => acc + review.rating, 0);
  return {
    average: sum / artistReviews.length,
    count: artistReviews.length,
  };
}

export async function getUnreadMessageCountByBooking(bookingId: number, userId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(
      and(
        eq(messages.bookingId, bookingId),
        eq(messages.receiverId, userId),
        isNull(messages.readAt)
      )
    );
  
  return result[0]?.count || 0;
}

export async function getTotalUnreadMessageCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(
      and(
        eq(messages.receiverId, userId),
        isNull(messages.readAt)
      )
    );
  
  return result[0]?.count || 0;
}

export async function markMessagesAsRead(bookingId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.bookingId, bookingId),
        eq(messages.receiverId, userId),
        isNull(messages.readAt)
      )
    );
}

// ============= VENUE REVIEW FUNCTIONS =============

export async function createVenueReview(review: InsertVenueReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(venueReviews).values(review);
  return result;
}

export async function getVenueReviewsByVenueId(venueId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(venueReviews)
    .where(eq(venueReviews.venueId, venueId))
    .orderBy(desc(venueReviews.createdAt));
}

export async function getVenueReviewByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(venueReviews).where(eq(venueReviews.bookingId, bookingId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getVenueReviewById(reviewId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(venueReviews).where(eq(venueReviews.id, reviewId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateVenueReview(reviewId: number, updates: { venueResponse?: string, respondedAt?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(venueReviews).set(updates).where(eq(venueReviews.id, reviewId));
}

export async function getAverageRatingForVenue(venueId: number): Promise<{ average: number; count: number }> {
  const db = await getDb();
  if (!db) return { average: 0, count: 0 };
  
  const reviews = await getVenueReviewsByVenueId(venueId);
  if (!reviews || reviews.length === 0) {
    return { average: 0, count: 0 };
  }
  
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return {
    average: sum / reviews.length,
    count: reviews.length,
  };
}


// ============= FAVORITES FUNCTIONS =============

export async function addFavorite(userId: number, artistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if already favorited
  const existing = await db.select().from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.artistId, artistId)));
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  await db.insert(favorites).values({ userId, artistId });
  return { userId, artistId };
}

export async function removeFavorite(userId: number, artistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.artistId, artistId)));
}

export async function getFavoritesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get favorites with artist profile details
  const userFavorites = await db.select().from(favorites)
    .where(eq(favorites.userId, userId));
  
  if (userFavorites.length === 0) return [];
  
  const artistIds = userFavorites.map(f => f.artistId);
  const artists = await db.select().from(artistProfiles)
    .where(sql`${artistProfiles.id} IN (${sql.join(artistIds.map(id => sql`${id}`), sql`, `)})`);
  
  return artists;
}

export async function isFavorited(userId: number, artistId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select().from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.artistId, artistId)));
  
  return result.length > 0;
}

export async function getFavoriteCount(artistId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select().from(favorites)
    .where(eq(favorites.artistId, artistId));
  
  return result.length;
}


export async function getVenuesWhoFavoritedArtist(artistId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all users who favorited this artist
  const userFavorites = await db.select().from(favorites)
    .where(eq(favorites.artistId, artistId));
  
  if (userFavorites.length === 0) return [];
  
  const userIds = userFavorites.map(f => f.userId);
  
  // Get user details and venue profiles
  const venueUsers = await db.select().from(users)
    .where(sql`${users.id} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`);
  
  const venueProfilesList = await db.select().from(venueProfiles)
    .where(sql`${venueProfiles.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`);
  
  // Combine user and venue profile data
  return venueUsers.map(user => {
    const profile = venueProfilesList.find((p: VenueProfile) => p.userId === user.id);
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      organizationName: profile?.organizationName,
    };
  }).filter(v => v.email); // Only return venues with email addresses
}


// ============= BOOKING TEMPLATE FUNCTIONS =============

export async function createBookingTemplate(template: InsertBookingTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(bookingTemplates).values(template);
  return template;
}

export async function getBookingTemplatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(bookingTemplates)
    .where(eq(bookingTemplates.userId, userId))
    .orderBy(desc(bookingTemplates.updatedAt));
}

export async function getBookingTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(bookingTemplates)
    .where(eq(bookingTemplates.id, id));
  
  return result[0] || null;
}

export async function updateBookingTemplate(id: number, updates: Partial<InsertBookingTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(bookingTemplates)
    .set(updates)
    .where(eq(bookingTemplates.id, id));
}

export async function deleteBookingTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(bookingTemplates)
    .where(eq(bookingTemplates.id, id));
}


// ============= ANALYTICS FUNCTIONS =============

export async function trackProfileView(artistId: number, viewerUserId?: number, ipAddress?: string) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(profileViews).values({
    artistId,
    viewerUserId,
    ipAddress,
  });
}

export async function getProfileViewCount(artistId: number, days?: number) {
  const db = await getDb();
  if (!db) return 0;
  
  let conditions = [eq(profileViews.artistId, artistId)];
  
  if (days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    conditions.push(gte(profileViews.viewedAt, startDate));
  }
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(profileViews)
    .where(and(...conditions));
  
  return Number(result[0]?.count) || 0;
}

export async function getBookingStats(artistId: number) {
  const db = await getDb();
  if (!db) return {
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
  };
  
  const allBookings = await db.select().from(bookings)
    .where(eq(bookings.artistId, artistId));
  
  const stats = {
    total: allBookings.length,
    pending: allBookings.filter(b => b.status === 'pending').length,
    confirmed: allBookings.filter(b => b.status === 'confirmed').length,
    completed: allBookings.filter(b => b.status === 'completed').length,
    cancelled: allBookings.filter(b => b.status === 'cancelled').length,
    totalRevenue: allBookings
      .filter(b => b.status === 'completed' && b.totalFee)
      .reduce((sum, b) => sum + (typeof b.totalFee === 'number' ? b.totalFee : 0), 0),
  };
  
  return stats;
}

export async function getRevenueByMonth(artistId: number, months: number = 12) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  const completedBookings = await db.select().from(bookings)
    .where(
      and(
        eq(bookings.artistId, artistId),
        eq(bookings.status, 'completed'),
        gte(bookings.eventDate, startDate)
      )
    )
    .orderBy(bookings.eventDate);
  
  // Group by month
  const revenueByMonth: { [key: string]: number } = {};
  completedBookings.forEach(booking => {
    if (booking.eventDate && booking.totalFee) {
      const monthKey = booking.eventDate.toISOString().substring(0, 7); // YYYY-MM
      const fee = typeof booking.totalFee === 'number' ? booking.totalFee : 0;
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + fee;
    }
  });
  
  return Object.entries(revenueByMonth).map(([month, revenue]) => ({
    month,
    revenue,
  }));
}


// ============= BOOKING REMINDER FUNCTIONS =============

export async function getBookingsNeedingReminders() {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(now.getDate() + 7);
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(now.getDate() + 3);
  const oneDayFromNow = new Date(now);
  oneDayFromNow.setDate(now.getDate() + 1);
  
  // Get all confirmed bookings with upcoming event dates
  const upcomingBookings = await db.select().from(bookings)
    .where(
      and(
        eq(bookings.status, 'confirmed'),
        gte(bookings.eventDate, now)
      )
    );
  
  // Get all sent reminders
  const sentReminders = await db.select().from(bookingReminders);
  
  const bookingsNeedingReminders: Array<{
    booking: Booking;
    reminderType: '7_days' | '3_days' | '1_day';
  }> = [];
  
  for (const booking of upcomingBookings) {
    if (!booking.eventDate) continue;
    
    const eventDate = new Date(booking.eventDate);
    const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if we need to send 7-day reminder
    if (daysUntil <= 7 && daysUntil > 6) {
      const alreadySent = sentReminders.some(
        r => r.bookingId === booking.id && r.reminderType === '7_days'
      );
      if (!alreadySent) {
        bookingsNeedingReminders.push({ booking, reminderType: '7_days' });
      }
    }
    
    // Check if we need to send 3-day reminder
    if (daysUntil <= 3 && daysUntil > 2) {
      const alreadySent = sentReminders.some(
        r => r.bookingId === booking.id && r.reminderType === '3_days'
      );
      if (!alreadySent) {
        bookingsNeedingReminders.push({ booking, reminderType: '3_days' });
      }
    }
    
    // Check if we need to send 1-day reminder
    if (daysUntil <= 1 && daysUntil > 0) {
      const alreadySent = sentReminders.some(
        r => r.bookingId === booking.id && r.reminderType === '1_day'
      );
      if (!alreadySent) {
        bookingsNeedingReminders.push({ booking, reminderType: '1_day' });
      }
    }
  }
  
  return bookingsNeedingReminders;
}

export async function markReminderSent(bookingId: number, reminderType: string) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(bookingReminders).values({
    bookingId,
    reminderType,
  });
}


// ============= CALENDAR FUNCTIONS =============

export async function getVenueBookingsByDateRange(venueId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(bookings)
    .where(
      and(
        eq(bookings.venueId, venueId),
        gte(bookings.eventDate, startDate),
        lte(bookings.eventDate, endDate)
      )
    )
    .orderBy(bookings.eventDate);
}

export async function getFavoritedArtistsAvailability(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  // Get user's favorited artists
  const userFavorites = await db.select().from(favorites)
    .where(eq(favorites.userId, userId));
  
  if (userFavorites.length === 0) return [];
  
  const artistIds = userFavorites.map(f => f.artistId);
  
  // Get availability for those artists in the date range
  const availabilityRecords = await db.select().from(availability)
    .where(
      and(
        inArray(availability.artistId, artistIds),
        gte(availability.date, startDate),
        lte(availability.date, endDate),
        eq(availability.status, 'available')
      )
    );
  
  // Enrich with artist details
  const enrichedAvailability = [];
  for (const avail of availabilityRecords) {
    const artist = await getArtistProfileById(avail.artistId);
    if (artist) {
      enrichedAvailability.push({
        ...avail,
        artistName: artist.artistName,
      });
    }
  }
  
  return enrichedAvailability;
}
