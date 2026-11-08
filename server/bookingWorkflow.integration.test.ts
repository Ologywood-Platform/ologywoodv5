import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => {
  const booking = {
    id: 501,
    artistId: 7,
    venueId: 20,
    eventDate: new Date('2026-12-10T00:00:00.000Z'),
    eventTime: '20:00',
    eventDetails: 'Synthetic booking',
    status: 'pending',
    paymentStatus: 'unpaid',
    bookingSource: 'venue',
    venueName: 'The Test Room',
  } as any;
  return {
    booking,
    messages: [] as any[],
    getVenueProfileByUserId: vi.fn(),
    getVenueProfileById: vi.fn(),
    getArtistProfileById: vi.fn(),
    getArtistProfileByUserId: vi.fn(),
    getUserById: vi.fn(),
    getSubscriptionByUserId: vi.fn(),
    createBooking: vi.fn(),
    getBookingById: vi.fn(),
    updateBooking: vi.fn(),
    createMessage: vi.fn(),
    getMessagesByBookingId: vi.fn(),
    getMessageById: vi.fn(),
    markMessageAsRead: vi.fn(),
    markMessagesAsRead: vi.fn(),
    ensureScheduleSchema: vi.fn(),
    checkBookingScheduleRequest: vi.fn(),
    confirmScheduledBooking: vi.fn(),
    cancelScheduledBooking: vi.fn(),
    riderDefault: vi.fn(),
    sendBookingRequestEmail: vi.fn(),
    sendBookingCancellationEmail: vi.fn(),
    sendClientBookingNotificationToArtist: vi.fn(),
    sendClientBookingConfirmationEmail: vi.fn(),
    sendBookingConfirmationEmail: vi.fn(),
    notifyBookingRequest: vi.fn(),
    notifyBookingConfirmed: vi.fn(),
    notifyBookingCancelled: vi.fn(),
    notifyNewMessage: vi.fn(),
  };
});

vi.mock('./db', () => ({
  getVenueProfileByUserId: state.getVenueProfileByUserId,
  getVenueProfileById: state.getVenueProfileById,
  getArtistProfileById: state.getArtistProfileById,
  getArtistProfileByUserId: state.getArtistProfileByUserId,
  getUserById: state.getUserById,
  getSubscriptionByUserId: state.getSubscriptionByUserId,
  createBooking: state.createBooking,
  getBookingById: state.getBookingById,
  updateBooking: state.updateBooking,
  createMessage: state.createMessage,
  getMessagesByBookingId: state.getMessagesByBookingId,
  getMessageById: state.getMessageById,
  markMessageAsRead: state.markMessageAsRead,
  markMessagesAsRead: state.markMessagesAsRead,
}));
vi.mock('./services/scheduleSchemaService', () => ({ ensureScheduleSchema: state.ensureScheduleSchema }));
vi.mock('./services/bookingScheduleService', () => ({
  checkBookingScheduleRequest: state.checkBookingScheduleRequest,
  confirmScheduledBooking: state.confirmScheduledBooking,
  cancelScheduledBooking: state.cancelScheduledBooking,
  setScheduledAvailability: vi.fn(),
  deleteScheduledAvailability: vi.fn(),
}));
vi.mock('./services/riderTemplateService', () => ({ getDefaultRiderForArtist: state.riderDefault }));
vi.mock('./email', () => ({
  sendBookingRequestEmail: state.sendBookingRequestEmail,
  sendBookingCancellationEmail: state.sendBookingCancellationEmail,
  sendClientBookingNotificationToArtist: state.sendClientBookingNotificationToArtist,
  sendClientBookingConfirmationEmail: state.sendClientBookingConfirmationEmail,
  sendBookingReminder: vi.fn(),
  sendAvailabilityUpdateNotification: vi.fn(),
}));
vi.mock('./services/emailService', () => ({ sendBookingConfirmationEmail: state.sendBookingConfirmationEmail }));
vi.mock('./services/notificationService', () => ({
  notifyBookingRequest: state.notifyBookingRequest,
  notifyBookingConfirmed: state.notifyBookingConfirmed,
  notifyBookingCancelled: state.notifyBookingCancelled,
  notifyNewMessage: state.notifyNewMessage,
  notifyBookingCompleted: vi.fn(),
}));

import { appRouter } from './routers';

const venueContext = { user: { id: 5, role: 'venue', email: 'venue@test.invalid', name: 'Venue User' }, req: { headers: {} }, res: {} } as any;
const artistContext = { user: { id: 7, role: 'artist', email: 'artist@test.invalid', name: 'Artist User' }, req: { headers: {} }, res: {} } as any;
const outsiderContext = { user: { id: 999, role: 'artist', email: 'outsider@test.invalid', name: 'Outsider User' }, req: { headers: {} }, res: {} } as any;

beforeEach(() => {
  vi.clearAllMocks();
  state.messages.splice(0, state.messages.length);
  Object.assign(state.booking, {
    id: 501,
    artistId: 7,
    venueId: 20,
    eventDate: new Date('2026-12-10T00:00:00.000Z'),
    eventTime: '20:00',
    eventDetails: 'Synthetic booking',
    status: 'pending',
    paymentStatus: 'unpaid',
    bookingSource: 'venue',
    venueName: 'The Test Room',
  });
  state.getVenueProfileByUserId.mockImplementation(async (userId: number) => userId === 5 ? ({ id: 20, userId: 5, organizationName: 'The Test Room', location: 'Atlanta' }) : null);
  state.getVenueProfileById.mockResolvedValue({ id: 20, userId: 5, organizationName: 'The Test Room', location: 'Atlanta' });
  state.getArtistProfileById.mockResolvedValue({ id: 7, userId: 7, artistName: 'Test Artist' });
  state.getArtistProfileByUserId.mockImplementation(async (userId: number) => userId === 7 ? ({ id: 7, userId: 7, artistName: 'Test Artist' }) : null);
  state.getUserById.mockImplementation(async (id: number) => ({ id, name: id === 7 ? 'Artist User' : 'Venue User', email: id === 7 ? 'artist@test.invalid' : 'venue@test.invalid' }));
  state.getSubscriptionByUserId.mockResolvedValue({ tier: 'professional' });
  state.ensureScheduleSchema.mockResolvedValue(undefined);
  state.checkBookingScheduleRequest.mockResolvedValue({ scheduleStartAt: new Date('2026-12-10T20:00:00.000Z'), scheduleEndAt: new Date('2026-12-10T22:00:00.000Z'), scheduleTimezone: 'America/New_York', scheduleAllDay: false, preparationMinutes: 0, travelMinutes: 0 });
  state.createBooking.mockImplementation(async (data: any) => ({ ...state.booking, ...data, id: 501 }));
  state.getBookingById.mockResolvedValue(state.booking);
  state.updateBooking.mockImplementation(async (_id: number, updates: any) => Object.assign(state.booking, updates));
  state.createMessage.mockImplementation(async (data: any) => {
    const message = { id: state.messages.length + 1, createdAt: new Date(), isRead: false, ...data };
    state.messages.push(message);
    return message;
  });
  state.getMessagesByBookingId.mockImplementation(async (bookingId: number) => state.messages.filter((message) => message.bookingId === bookingId));
  state.getMessageById.mockImplementation(async (messageId: number) => state.messages.find((message) => message.id === messageId));
  state.markMessageAsRead.mockImplementation(async (messageId: number) => {
    const message = state.messages.find((item) => item.id === messageId);
    if (message) message.isRead = true;
  });
  state.markMessagesAsRead.mockImplementation(async (bookingId: number, recipientUserId: number) => {
    for (const message of state.messages) {
      if (message.bookingId === bookingId && message.recipientId === recipientUserId) message.isRead = true;
    }
  });
  state.confirmScheduledBooking.mockImplementation(async () => { state.booking.status = 'confirmed'; return { changed: true }; });
  state.cancelScheduledBooking.mockImplementation(async () => { state.booking.status = 'cancelled'; return { changed: true }; });
  state.riderDefault.mockResolvedValue({ id: 88 });
  for (const fn of [state.sendBookingRequestEmail, state.sendClientBookingNotificationToArtist, state.sendClientBookingConfirmationEmail, state.sendBookingConfirmationEmail, state.notifyBookingRequest, state.notifyBookingConfirmed, state.notifyBookingCancelled, state.notifyNewMessage]) fn.mockResolvedValue(undefined);
});

describe('booking workflow runtime integration', () => {
  it('creates a venue booking, returns its ID, and notifies the artist with that ID', async () => {
    const result = await appRouter.createCaller(venueContext).booking.create({
      artistId: 7, eventDate: '2026-12-10', eventTime: '20:00', venueName: 'The Test Room',
      eventDetails: 'Synthetic booking', totalFee: 800, riderTemplateId: 88,
    });
    expect(result).toEqual({ success: true, bookingId: 501 });
    expect(state.createBooking).toHaveBeenCalledWith(expect.objectContaining({ artistId: 7, venueId: 20, status: 'pending', riderTemplateId: 88 }));
    expect(state.notifyBookingRequest).toHaveBeenCalledWith(expect.objectContaining({ artistUserId: 7, bookingId: 501 }));
    expect(state.sendBookingRequestEmail).toHaveBeenCalledOnce();
  });

  it('creates a client booking with the rider and confirms both client and artist notification paths', async () => {
    const result = await appRouter.createCaller(venueContext).booking.clientCreate({
      artistId: 7, eventDate: '2026-12-11', eventType: 'festival', venueName: 'Client Venue',
      venueAddress: '123 Main St, Atlanta, GA', clientName: 'Client User', clientEmail: 'client@test.invalid',
      clientPhone: '4045550100', eventDetails: 'Client request', totalFee: 500,
    });
    expect(result).toEqual({ success: true, bookingId: 501 });
    expect(state.createBooking).toHaveBeenCalledWith(expect.objectContaining({ bookingSource: 'client_booking', riderTemplateId: 88, venueId: 5 }));
    expect(state.notifyBookingRequest).toHaveBeenCalledWith(expect.objectContaining({ bookingId: 501, artistUserId: 7 }));
    expect(state.sendClientBookingNotificationToArtist).toHaveBeenCalledWith(expect.objectContaining({ bookingId: 501, clientEmail: 'client@test.invalid' }));
    expect(state.sendClientBookingConfirmationEmail).toHaveBeenCalledWith(expect.objectContaining({ bookingId: 501, clientEmail: 'client@test.invalid' }));
  });

  it('runs confirmed then cancelled transitions and emits real-ID notifications', async () => {
    const caller = appRouter.createCaller(artistContext);
    await expect(caller.booking.updateStatus({ id: 501, status: 'confirmed' })).resolves.toEqual({ success: true });
    expect(state.booking.status).toBe('confirmed');
    expect(state.confirmScheduledBooking).toHaveBeenCalledWith(501, 7, 'artist');
    expect(state.notifyBookingConfirmed).toHaveBeenCalledWith(expect.objectContaining({ bookingId: 501, recipientUserId: 7 }));
    expect(state.notifyBookingConfirmed).toHaveBeenCalledWith(expect.objectContaining({ bookingId: 501, recipientUserId: 5 }));

    await expect(caller.booking.updateStatus({ id: 501, status: 'cancelled' })).resolves.toEqual({ success: true });
    expect(state.booking.status).toBe('cancelled');
    expect(state.cancelScheduledBooking).toHaveBeenCalledWith(501, 7, 'artist');
    expect(state.notifyBookingCancelled).toHaveBeenCalledWith(expect.objectContaining({ bookingId: 501, cancelledBy: 'Artist' }));
    expect(state.notifyBookingCancelled).toHaveBeenCalledTimes(2);
  });

  it('sends, retrieves, and marks a booking message read through the real router', async () => {
    const artistCaller = appRouter.createCaller(artistContext);
    const venueCaller = appRouter.createCaller(venueContext);

    await expect(artistCaller.message.send({ bookingId: 501, receiverId: 5, messageText: 'Please confirm the load-in time.' })).resolves.toEqual({ success: true });
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toMatchObject({ bookingId: 501, senderId: 7, recipientId: 5, content: 'Please confirm the load-in time.' });
    expect(state.notifyNewMessage).toHaveBeenCalledWith(expect.objectContaining({ recipientUserId: 5, bookingId: 501, preview: 'Please confirm the load-in time.' }));

    const thread = await venueCaller.message.getForBooking({ bookingId: 501 });
    expect(thread).toHaveLength(1);
    expect(thread[0]).toMatchObject({ senderId: 7, recipientId: 5 });

    await expect(venueCaller.message.markAsRead({ id: state.messages[0].id })).resolves.toEqual({ success: true });
    expect(state.messages[0].isRead).toBe(true);
    await expect(venueCaller.message.markBookingAsRead({ bookingId: 501 })).resolves.toEqual({ success: true });
    expect(state.markMessagesAsRead).toHaveBeenCalledWith(501, 5);
  });

  it('rejects a message recipient who is not the other booking participant', async () => {
    const artistCaller = appRouter.createCaller(artistContext);
    await expect(artistCaller.message.send({ bookingId: 501, receiverId: 999, messageText: 'This must not be delivered.' })).rejects.toThrow('other booking participant');
    expect(state.createMessage).not.toHaveBeenCalled();
    expect(state.notifyNewMessage).not.toHaveBeenCalled();
  });

  it('rejects invalid payment/message IDs before database access', async () => {
    const caller = appRouter.createCaller(artistContext);
    await expect(caller.booking.createDepositPayment({ bookingId: 0, depositAmount: 100 })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(caller.message.getUnreadCount({ bookingId: 0 })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(state.getBookingById).not.toHaveBeenCalled();
  });

  it('does not expose a booking rider to an authenticated non-party', async () => {
    await expect(appRouter.createCaller(outsiderContext).booking.getRider({ bookingId: 501 })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
