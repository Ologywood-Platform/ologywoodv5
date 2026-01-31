import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const calendarRouter = router({
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      eventType: z.enum(['booking', 'availability', 'unavailable', 'personal', 'synced']),
      startDate: z.string(),
      startTime: z.string().optional(),
      endDate: z.string().optional(),
      endTime: z.string().optional(),
      location: z.string().optional(),
      bookingId: z.number().optional(),
      color: z.string().optional(),
      isAllDay: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await db.createCalendarEvent({
        userId: ctx.user.id,
        userType: ctx.user.role as 'artist' | 'venue',
        ...input,
      });
    }),
  
  getByUserId: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await db.getCalendarEventsByUserId(ctx.user.id, input.startDate, input.endDate);
    }),
  
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const event = await db.getCalendarEventById(input.id);
      if (!event || event.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
      }
      return event;
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      startDate: z.string().optional(),
      startTime: z.string().optional(),
      endDate: z.string().optional(),
      endTime: z.string().optional(),
      location: z.string().optional(),
      color: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const event = await db.getCalendarEventById(input.id);
      if (!event || event.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
      }
      const { id, ...updateData } = input;
      return await db.updateCalendarEvent(id, updateData);
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const event = await db.getCalendarEventById(input.id);
      if (!event || event.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
      }
      const deleted = await db.deleteCalendarEvent(input.id);
      return { success: deleted };
    }),
});
