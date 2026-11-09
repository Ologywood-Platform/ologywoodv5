import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import { scheduleAppointmentSchema, scheduleDateSchema, scheduleTimezoneSchema } from '../../shared/schedule';
import {
  cancelScheduleAppointment, createScheduleAppointment, getScheduleAgenda, getScheduleContext, updateScheduleAppointment,
} from '../services/scheduleService';

const safeId = z.number().int().safe().positive();
const ownerInput = z.object({ ownerUserId: safeId.optional() }).strict();
const appointmentInput = scheduleAppointmentSchema.extend({ ownerUserId: safeId.optional() }).strict();
const revisionInput = ownerInput.extend({ id: safeId, expectedRevision: safeId }).strict();

async function safe<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (error) {
    if (error instanceof TRPCError && ['FORBIDDEN', 'NOT_FOUND', 'CONFLICT', 'BAD_REQUEST'].includes(error.code)) throw error;
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Schedule is temporarily unavailable. Please try again.' });
  }
}
export const scheduleRouter = router({
  context: protectedProcedure.input(ownerInput.optional()).query(({ ctx, input }) =>
    safe(() => getScheduleContext(ctx.user.id, input?.ownerUserId))),
  agenda: protectedProcedure.input(ownerInput.extend({
    fromDate: scheduleDateSchema, toDate: scheduleDateSchema, timezone: scheduleTimezoneSchema,
  }).strict()).query(({ ctx, input }) => safe(() => getScheduleAgenda(ctx.user.id, input))),
  create: protectedProcedure.input(appointmentInput).mutation(({ ctx, input }) =>
    safe(() => createScheduleAppointment(ctx.user.id, input))),
  update: protectedProcedure.input(appointmentInput.extend({
    id: safeId, expectedRevision: safeId,
  }).strict()).mutation(({ ctx, input }) => safe(() => updateScheduleAppointment(ctx.user.id, input))),
  cancel: protectedProcedure.input(revisionInput).mutation(({ ctx, input }) =>
    safe(() => cancelScheduleAppointment(ctx.user.id, input))),
});
