import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { venueSponsorPackages, venueSponsorApplications, venueActiveSponsors, venueProfiles, venueSponsorMessages } from "../../drizzle/schema";
import { eq, and, desc, sql, count, inArray } from "drizzle-orm";
import { notifySponsorApplicationReceived, notifySponsorApplicationApproved, notifySponsorApplicationRejected, notifySponsorMessage } from "../services/notificationService";

// Helper to check if user is a venue
const venueProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'venue' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Venue access required' });
  }
  return next({ ctx });
});

export const venueSponsorRouter = router({
  // ─── SPONSOR PACKAGES (Venue Management) ─────────────────────────

  /**
   * Get all sponsor packages for the current venue
   */
  getMyPackages: venueProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

    const packages = await db
      .select()
      .from(venueSponsorPackages)
      .where(eq(venueSponsorPackages.venueId, ctx.user.id))
      .orderBy(desc(venueSponsorPackages.createdAt));

    return packages;
  }),

  /**
   * Create a new sponsor package
   */
  createPackage: venueProcedure
    .input(z.object({
      name: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      packageType: z.enum(["title_sponsor", "stage_sponsor", "bar_sponsor", "digital_signage", "event_mention", "custom"]),
      price: z.string(), // decimal as string
      duration: z.enum(["per_event", "weekly", "monthly", "quarterly", "yearly"]),
      benefits: z.array(z.string().max(200)).max(10).optional(),
      maxSlots: z.number().min(1).max(50).default(1),
      imageUrl: z.string().url().max(512).optional(),
      tier: z.enum(["bronze", "silver", "gold", "platinum", "custom"]).default("custom"),
      category: z.string().max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const result = await db.insert(venueSponsorPackages).values({
        venueId: ctx.user.id,
        name: input.name,
        description: input.description || null,
        packageType: input.packageType,
        price: input.price,
        duration: input.duration,
        benefits: input.benefits || [],
        maxSlots: input.maxSlots,
        imageUrl: input.imageUrl || null,
        tier: input.tier,
        category: input.category || null,
      });

      return { id: result[0].insertId, message: 'Sponsor package created successfully' };
    }),

  /**
   * Update a sponsor package
   */
  updatePackage: venueProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).optional().nullable(),
      packageType: z.enum(["title_sponsor", "stage_sponsor", "bar_sponsor", "digital_signage", "event_mention", "custom"]).optional(),
      price: z.string().optional(),
      duration: z.enum(["per_event", "weekly", "monthly", "quarterly", "yearly"]).optional(),
      benefits: z.array(z.string().max(200)).max(10).optional(),
      maxSlots: z.number().min(1).max(50).optional(),
      isActive: z.boolean().optional(),
      imageUrl: z.string().url().max(512).optional().nullable(),
      tier: z.enum(["bronze", "silver", "gold", "platinum", "custom"]).optional(),
      category: z.string().max(100).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Verify ownership
      const existing = await db
        .select()
        .from(venueSponsorPackages)
        .where(and(eq(venueSponsorPackages.id, input.id), eq(venueSponsorPackages.venueId, ctx.user.id)))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Package not found' });
      }

      const { id, ...updateData } = input;
      const cleanData: any = {};
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) cleanData[key] = value;
      });

      await db.update(venueSponsorPackages)
        .set(cleanData)
        .where(eq(venueSponsorPackages.id, input.id));

      return { message: 'Package updated successfully' };
    }),

  /**
   * Delete a sponsor package
   */
  deletePackage: venueProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Verify ownership
      const existing = await db
        .select()
        .from(venueSponsorPackages)
        .where(and(eq(venueSponsorPackages.id, input.id), eq(venueSponsorPackages.venueId, ctx.user.id)))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Package not found' });
      }

      // Check if there are active sponsors using this package
      const activeCount = await db
        .select({ count: count() })
        .from(venueActiveSponsors)
        .where(and(eq(venueActiveSponsors.packageId, input.id), eq(venueActiveSponsors.isActive, true)));

      if ((activeCount[0]?.count || 0) > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot delete a package with active sponsors. Deactivate sponsors first.' });
      }

      await db.delete(venueSponsorPackages).where(eq(venueSponsorPackages.id, input.id));
      return { message: 'Package deleted successfully' };
    }),

  // ─── SPONSOR APPLICATIONS ────────────────────────────────────────

  /**
   * Get all applications for the current venue (venue-side)
   */
  getMyApplications: venueProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected", "expired"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const conditions = [eq(venueSponsorApplications.venueId, ctx.user.id)];
      if (input?.status) {
        conditions.push(eq(venueSponsorApplications.status, input.status));
      }

      const applications = await db
        .select()
        .from(venueSponsorApplications)
        .where(and(...conditions))
        .orderBy(desc(venueSponsorApplications.createdAt));

      return applications;
    }),

  /**
   * Approve a sponsor application
   */
  approveApplication: venueProcedure
    .input(z.object({
      applicationId: z.number(),
      startDate: z.string(), // ISO date
      endDate: z.string().optional(),
      reviewNotes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Verify ownership and get application
      const [application] = await db
        .select()
        .from(venueSponsorApplications)
        .where(and(
          eq(venueSponsorApplications.id, input.applicationId),
          eq(venueSponsorApplications.venueId, ctx.user.id),
        ))
        .limit(1);

      if (!application) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Application not found' });
      }

      if (application.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Application has already been reviewed' });
      }

      // Check if package has available slots
      const [pkg] = await db
        .select()
        .from(venueSponsorPackages)
        .where(eq(venueSponsorPackages.id, application.packageId))
        .limit(1);

      if (!pkg) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Package not found' });
      }

      if (pkg.filledSlots >= pkg.maxSlots) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This package has no available slots' });
      }

      // Update application status
      await db.update(venueSponsorApplications)
        .set({
          status: 'approved',
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes || null,
        })
        .where(eq(venueSponsorApplications.id, input.applicationId));

      // Create active sponsor record
      const nextOrder = await db
        .select({ max: sql<number>`COALESCE(MAX(${venueActiveSponsors.displayOrder}), 0)` })
        .from(venueActiveSponsors)
        .where(eq(venueActiveSponsors.venueId, ctx.user.id));

      await db.insert(venueActiveSponsors).values({
        venueId: ctx.user.id,
        packageId: application.packageId,
        applicationId: application.id,
        companyName: application.companyName,
        companyLogoUrl: application.companyLogoUrl || '',
        companyWebsite: application.companyWebsite || null,
        companyDescription: null,
        displayOrder: (nextOrder[0]?.max || 0) + 1,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
      });

      // Increment filled slots
      await db.update(venueSponsorPackages)
        .set({ filledSlots: pkg.filledSlots + 1 })
        .where(eq(venueSponsorPackages.id, application.packageId));

      // Notify the applicant if they are a registered user
      if (application.applicantUserId) {
        // Get venue name for the notification
        const [venueProfile] = await db
          .select({ organizationName: venueProfiles.organizationName })
          .from(venueProfiles)
          .where(eq(venueProfiles.userId, ctx.user.id))
          .limit(1);
        notifySponsorApplicationApproved({
          applicantUserId: application.applicantUserId,
          venueName: venueProfile?.organizationName || 'A venue',
          packageName: pkg.name,
        });
      }

      return { message: 'Application approved. Sponsor is now active.' };
    }),

  /**
   * Reject a sponsor application
   */
  rejectApplication: venueProcedure
    .input(z.object({
      applicationId: z.number(),
      reviewNotes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const [application] = await db
        .select()
        .from(venueSponsorApplications)
        .where(and(
          eq(venueSponsorApplications.id, input.applicationId),
          eq(venueSponsorApplications.venueId, ctx.user.id),
        ))
        .limit(1);

      if (!application) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Application not found' });
      }

      await db.update(venueSponsorApplications)
        .set({
          status: 'rejected',
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes || null,
        })
        .where(eq(venueSponsorApplications.id, input.applicationId));

      // Notify the applicant if they are a registered user
      if (application.applicantUserId) {
        const [venueProfile] = await db
          .select({ organizationName: venueProfiles.organizationName })
          .from(venueProfiles)
          .where(eq(venueProfiles.userId, ctx.user.id))
          .limit(1);
        notifySponsorApplicationRejected({
          applicantUserId: application.applicantUserId,
          venueName: venueProfile?.organizationName || 'A venue',
          packageName: 'sponsorship', // Generic since we don't fetch pkg here
        });
      }

      return { message: 'Application rejected' };
    }),

  // ─── ACTIVE SPONSORS ─────────────────────────────────────────────

  /**
   * Get active sponsors for the current venue (venue-side management)
   */
  getMyActiveSponsors: venueProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

    const sponsors = await db
      .select()
      .from(venueActiveSponsors)
      .where(and(eq(venueActiveSponsors.venueId, ctx.user.id), eq(venueActiveSponsors.isActive, true)))
      .orderBy(venueActiveSponsors.displayOrder);

    return sponsors;
  }),

  /**
   * Deactivate an active sponsor
   */
  deactivateSponsor: venueProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const [sponsor] = await db
        .select()
        .from(venueActiveSponsors)
        .where(and(eq(venueActiveSponsors.id, input.id), eq(venueActiveSponsors.venueId, ctx.user.id)))
        .limit(1);

      if (!sponsor) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Sponsor not found' });
      }

      await db.update(venueActiveSponsors)
        .set({ isActive: false })
        .where(eq(venueActiveSponsors.id, input.id));

      // Decrement filled slots on the package
      const [pkg] = await db
        .select()
        .from(venueSponsorPackages)
        .where(eq(venueSponsorPackages.id, sponsor.packageId))
        .limit(1);

      if (pkg && pkg.filledSlots > 0) {
        await db.update(venueSponsorPackages)
          .set({ filledSlots: pkg.filledSlots - 1 })
          .where(eq(venueSponsorPackages.id, sponsor.packageId));
      }

      return { message: 'Sponsor deactivated' };
    }),

  // ─── PUBLIC ENDPOINTS ────────────────────────────────────────────

  /**
   * Get active sponsor packages for a venue (public - for potential sponsors to browse)
   */
  getPublicPackages: publicProcedure
    .input(z.object({ venueId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const packages = await db
        .select({
          id: venueSponsorPackages.id,
          venueId: venueSponsorPackages.venueId,
          name: venueSponsorPackages.name,
          description: venueSponsorPackages.description,
          packageType: venueSponsorPackages.packageType,
          price: venueSponsorPackages.price,
          duration: venueSponsorPackages.duration,
          benefits: venueSponsorPackages.benefits,
          maxSlots: venueSponsorPackages.maxSlots,
          filledSlots: venueSponsorPackages.filledSlots,
          imageUrl: venueSponsorPackages.imageUrl,
        })
        .from(venueSponsorPackages)
        .where(and(eq(venueSponsorPackages.venueId, input.venueId), eq(venueSponsorPackages.isActive, true)))
        .orderBy(venueSponsorPackages.price);

      return packages;
    }),

  /**
   * Get active sponsors displayed on a venue profile (public)
   */
  getPublicSponsors: publicProcedure
    .input(z.object({ venueId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const sponsors = await db
        .select({
          id: venueActiveSponsors.id,
          companyName: venueActiveSponsors.companyName,
          companyLogoUrl: venueActiveSponsors.companyLogoUrl,
          companyWebsite: venueActiveSponsors.companyWebsite,
          companyDescription: venueActiveSponsors.companyDescription,
          displayOrder: venueActiveSponsors.displayOrder,
        })
        .from(venueActiveSponsors)
        .where(and(eq(venueActiveSponsors.venueId, input.venueId), eq(venueActiveSponsors.isActive, true)))
        .orderBy(venueActiveSponsors.displayOrder);

      return sponsors;
    }),

  /**
   * Submit a sponsor application (public - any user or guest can apply)
   */
  submitApplication: publicProcedure
    .input(z.object({
      packageId: z.number(),
      companyName: z.string().min(1).max(200),
      contactName: z.string().min(1).max(200),
      contactEmail: z.string().email().max(320),
      contactPhone: z.string().max(50).optional(),
      companyWebsite: z.string().url().max(512).optional(),
      companyLogoUrl: z.string().url().max(512).optional(),
      promoMaterialUrls: z.array(z.string().url()).max(5).optional(),
      message: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Get the package to find the venue
      const [pkg] = await db
        .select()
        .from(venueSponsorPackages)
        .where(and(eq(venueSponsorPackages.id, input.packageId), eq(venueSponsorPackages.isActive, true)))
        .limit(1);

      if (!pkg) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Sponsor package not found or no longer available' });
      }

      // Check if slots are available
      if (pkg.filledSlots >= pkg.maxSlots) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This sponsorship package is fully booked' });
      }

      const result = await db.insert(venueSponsorApplications).values({
        packageId: input.packageId,
        venueId: pkg.venueId,
        applicantUserId: (ctx as any).user?.id || null,
        companyName: input.companyName,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone || null,
        companyWebsite: input.companyWebsite || null,
        companyLogoUrl: input.companyLogoUrl || null,
        promoMaterialUrls: input.promoMaterialUrls || null,
        message: input.message || null,
      });

      // Notify the venue owner about the new application
      notifySponsorApplicationReceived({
        venueUserId: pkg.venueId,
        companyName: input.companyName,
        packageName: pkg.name,
      });

      return { id: result[0].insertId, message: 'Application submitted successfully. The venue will review your request.' };
    }),

  /**
   * Browse all venues with active sponsorship packages (public discovery)
   */
  browseOpportunities: publicProcedure
    .input(z.object({
      packageType: z.enum(["title_sponsor", "stage_sponsor", "bar_sponsor", "digital_signage", "event_mention", "custom"]).optional(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { opportunities: [], total: 0 };

      const conditions = [eq(venueSponsorPackages.isActive, true)];
      if (input?.packageType) {
        conditions.push(eq(venueSponsorPackages.packageType, input.packageType));
      }

      // Get packages with venue info
      const packages = await db
        .select({
          id: venueSponsorPackages.id,
          venueId: venueSponsorPackages.venueId,
          name: venueSponsorPackages.name,
          description: venueSponsorPackages.description,
          packageType: venueSponsorPackages.packageType,
          tier: venueSponsorPackages.tier,
          category: venueSponsorPackages.category,
          price: venueSponsorPackages.price,
          duration: venueSponsorPackages.duration,
          benefits: venueSponsorPackages.benefits,
          maxSlots: venueSponsorPackages.maxSlots,
          filledSlots: venueSponsorPackages.filledSlots,
          imageUrl: venueSponsorPackages.imageUrl,
        })
        .from(venueSponsorPackages)
        .where(and(...conditions))
        .orderBy(desc(venueSponsorPackages.createdAt))
        .limit(input?.limit || 20)
        .offset(input?.offset || 0);

      // Get venue names for the packages
      const venueIds = [...new Set(packages.map(p => p.venueId))];
      let venueMap: Record<number, { name: string; city?: string; state?: string }> = {};

      if (venueIds.length > 0) {
        const venues = await db
          .select({
            userId: venueProfiles.userId,
            organizationName: venueProfiles.organizationName,
            city: venueProfiles.city,
            state: venueProfiles.state,
          })
          .from(venueProfiles)
          .where(inArray(venueProfiles.userId, venueIds));

        venues.forEach(v => {
          venueMap[v.userId] = {
            name: v.organizationName || 'Unknown Venue',
            city: v.city || undefined,
            state: v.state || undefined,
          };
        });
      }

      const opportunities = packages.map(pkg => ({
        ...pkg,
        venueName: venueMap[pkg.venueId]?.name || 'Unknown Venue',
        venueCity: venueMap[pkg.venueId]?.city,
        venueState: venueMap[pkg.venueId]?.state,
        availableSlots: pkg.maxSlots - pkg.filledSlots,
      }));

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(venueSponsorPackages)
        .where(and(...conditions));

      return { opportunities, total: totalResult?.count || 0 };
    }),

  /**
   * Get venue sponsorship stats (for venue dashboard)
   */
  getStats: venueProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

    const [packageCount] = await db
      .select({ count: count() })
      .from(venueSponsorPackages)
      .where(and(eq(venueSponsorPackages.venueId, ctx.user.id), eq(venueSponsorPackages.isActive, true)));

    const [activeSponsors] = await db
      .select({ count: count() })
      .from(venueActiveSponsors)
      .where(and(eq(venueActiveSponsors.venueId, ctx.user.id), eq(venueActiveSponsors.isActive, true)));

    const [pendingApps] = await db
      .select({ count: count() })
      .from(venueSponsorApplications)
      .where(and(eq(venueSponsorApplications.venueId, ctx.user.id), eq(venueSponsorApplications.status, 'pending')));

    // Calculate total potential revenue from active packages
    const activePackages = await db
      .select({ price: venueSponsorPackages.price, filledSlots: venueSponsorPackages.filledSlots })
      .from(venueSponsorPackages)
      .where(and(eq(venueSponsorPackages.venueId, ctx.user.id), eq(venueSponsorPackages.isActive, true)));

    const totalRevenue = activePackages.reduce((sum, pkg) => sum + (parseFloat(pkg.price) * pkg.filledSlots), 0);

    return {
      totalPackages: packageCount?.count || 0,
      activeSponsors: activeSponsors?.count || 0,
      pendingApplications: pendingApps?.count || 0,
      estimatedRevenue: totalRevenue,
    };
  }),

  // ─── MESSAGING (Venue <-> Sponsor) ─────────────────────────

  /**
   * Get messages for a specific application
   */
  getMessages: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Verify user has access to this application
      const [application] = await db
        .select()
        .from(venueSponsorApplications)
        .where(eq(venueSponsorApplications.id, input.applicationId))
        .limit(1);

      if (!application) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Application not found' });
      }

      // Check if user is the venue owner or the applicant
      const isApplicant = application.applicantUserId === ctx.user.id;
      const [venueProfile] = await db
        .select()
        .from(venueProfiles)
        .where(eq(venueProfiles.id, application.packageId))
        .limit(1);

      // Get the package to find the venue
      const [pkg] = await db
        .select()
        .from(venueSponsorPackages)
        .where(eq(venueSponsorPackages.id, application.packageId))
        .limit(1);

      const isVenueOwner = pkg && ctx.user.id === pkg.venueId;

      if (!isApplicant && !isVenueOwner) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to view these messages' });
      }

      const msgs = await db
        .select()
        .from(venueSponsorMessages)
        .where(eq(venueSponsorMessages.applicationId, input.applicationId))
        .orderBy(venueSponsorMessages.createdAt);

      return msgs;
    }),

  /**
   * Send a message in a sponsor application thread
   */
  sendMessage: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
      content: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Verify user has access
      const [application] = await db
        .select()
        .from(venueSponsorApplications)
        .where(eq(venueSponsorApplications.id, input.applicationId))
        .limit(1);

      if (!application) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Application not found' });
      }

      const isApplicant = application.applicantUserId === ctx.user.id;
      const [pkg] = await db
        .select()
        .from(venueSponsorPackages)
        .where(eq(venueSponsorPackages.id, application.packageId))
        .limit(1);
      const isVenueOwner = pkg && ctx.user.id === pkg.venueId;

      if (!isApplicant && !isVenueOwner) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to send messages here' });
      }

      const senderRole = isVenueOwner ? 'venue' : 'sponsor';

      const [msg] = await db.insert(venueSponsorMessages).values({
        applicationId: input.applicationId,
        senderUserId: ctx.user.id,
        senderRole,
        content: input.content,
      }).$returningId();

      // Send notification to the other party
      const recipientUserId = isVenueOwner ? application.applicantUserId : pkg!.venueId;
      if (recipientUserId) {
        try {
          await notifySponsorMessage({ recipientUserId, senderRole });
        } catch (_) {}
      }

      return { id: msg.id, success: true };
    }),

  // ─── SPONSOR DASHBOARD (for applicants) ─────────────────────────

  /**
   * Get all applications submitted by the current user (sponsor dashboard)
   */
  getSponsorDashboardApplications: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

    const applications = await db
      .select()
      .from(venueSponsorApplications)
      .where(eq(venueSponsorApplications.applicantUserId, ctx.user.id))
      .orderBy(desc(venueSponsorApplications.createdAt));

    // Enrich with package info
    if (applications.length === 0) return [];

    const packageIds = [...new Set(applications.map(a => a.packageId))];
    const packages = await db
      .select()
      .from(venueSponsorPackages)
      .where(inArray(venueSponsorPackages.id, packageIds));

    const packageMap = new Map(packages.map(p => [p.id, p]));

    // Get venue names
    const venueIds = [...new Set(packages.map(p => p.venueId))];
    const venues = venueIds.length > 0 ? await db
      .select({ id: venueProfiles.id, organizationName: venueProfiles.organizationName })
      .from(venueProfiles)
      .where(inArray(venueProfiles.id, venueIds)) : [];
    const venueMap = new Map(venues.map(v => [v.id, v.organizationName]));

    return applications.map(app => {
      const pkg = packageMap.get(app.packageId);
      return {
        ...app,
        packageName: pkg?.name || 'Unknown Package',
        packageType: pkg?.packageType || 'custom',
        tier: pkg?.tier || 'custom',
        venueName: pkg ? (venueMap.get(pkg.venueId) || 'Unknown Venue') : 'Unknown Venue',
        price: pkg?.price || '0',
      };
    });
  }),

  /**
   * Get active sponsorships for the current user
   */
  getSponsorDashboardActiveSponsors: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

    // Find active sponsors via applications submitted by this user
    const myApplications = await db
      .select()
      .from(venueSponsorApplications)
      .where(eq(venueSponsorApplications.applicantUserId, ctx.user.id));
    const myAppIds = myApplications.map(a => a.id);
    if (myAppIds.length === 0) return [];

    const active = await db
      .select()
      .from(venueActiveSponsors)
      .where(and(
        inArray(venueActiveSponsors.applicationId, myAppIds),
        eq(venueActiveSponsors.isActive, true)
      ))
      .orderBy(desc(venueActiveSponsors.createdAt));

    if (active.length === 0) return [];

    const packageIds = [...new Set(active.map(a => a.packageId))];
    const packages = await db
      .select()
      .from(venueSponsorPackages)
      .where(inArray(venueSponsorPackages.id, packageIds));
    const packageMap = new Map(packages.map(p => [p.id, p]));

    const venueIds = [...new Set(packages.map(p => p.venueId))];
    const venues = venueIds.length > 0 ? await db
      .select({ id: venueProfiles.id, organizationName: venueProfiles.organizationName })
      .from(venueProfiles)
      .where(inArray(venueProfiles.id, venueIds)) : [];
    const venueMap = new Map(venues.map(v => [v.id, v.organizationName]));

    return active.map(s => {
      const pkg = packageMap.get(s.packageId);
      return {
        ...s,
        packageName: pkg?.name || 'Unknown',
        packageType: pkg?.packageType || 'custom',
        tier: pkg?.tier || 'custom',
        venueName: pkg ? (venueMap.get(pkg.venueId) || 'Unknown Venue') : 'Unknown Venue',
        price: pkg?.price || '0',
      };
    });
  }),
});
