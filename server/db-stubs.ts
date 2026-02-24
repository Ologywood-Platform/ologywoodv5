/**
 * Stub implementations for functions used by non-MVP routers
 * These are temporary placeholders to prevent build errors
 * The proper fix would be to fully remove non-MVP routers
 */

export async function removeSavedEvent(userId: number, eventId: number) {
  return null;
}

export async function getVenueProfileByToken(token: string): Promise<any> {
  return { userId: 0, organizationName: '' };
}

export async function getUserById(userId: number): Promise<any | null> {
  return null;
}

export async function setAvailability(data: any) {
  return null;
}

export async function getVenuesWhoFavoritedArtist(artistId: number) {
  return [];
}

export async function deleteAvailability(availabilityId: number) {
  return null;
}

export async function getUserSavedEvents(userId: number) {
  return [];
}

export async function getArtistEventHistory(artistId: number) {
  return [];
}

export async function getEventHistoryById(historyId: number) {
  return null;
}

export async function getEmailPreferences(userId: number): Promise<{ userId: number; frequency: string; bookingUpdates: boolean; newOpportunities: boolean; platformNews: boolean; weeklyDigest: boolean; reminders: boolean } | null> {
  return null;
}

export async function createEmailPreferences(userId: number): Promise<{ userId: number; frequency: string; bookingUpdates: boolean; newOpportunities: boolean; platformNews: boolean; weeklyDigest: boolean; reminders: boolean } | null> {
  return null;
}

export async function getArtistEvents(artistId: number) {
  return [];
}

export async function getArtistPublicEvents(artistId: number) {
  return [];
}

export async function getArtistUpcomingEvents(artistId: number) {
  return [];
}

export async function getEventPhotos(eventHistoryId: number) {
  return [];
}

export async function addEventPhoto(data: any) {
  return null;
}

export async function deleteEventPhoto(photoId: number) {
  return null;
}

export async function deleteEventRecurrence(recurrenceId: number) {
  return null;
}

export async function getEventRecurrence(eventId: number) {
  return null;
}

export async function searchPublicEvents(filters: any) {
  return [];
}

export async function saveEvent(eventId: number, userId: number) {
  return null;
}

export async function isEventSaved(userId: number, eventId: number) {
  return false;
}

export async function getFavoritedArtistsAvailability(venueId: number, startDate: Date, endDate: Date): Promise<{ id: number; artistId: number; artistName: string; date: string; status: string }[]> {
  return [];
}

export async function getPaymentHistory(bookingId: number) {
  return [];
}

export async function recordRefund(refundId: string, bookingId: number, reason?: string) {
  return { success: true, refundId };
}

export async function getVenueBookingsByDateRange(venueId: number, startDate: Date, endDate: Date): Promise<{ id: number; artistId: number; artistName: string; eventDate: string; eventTime: string; status: string }[]> {
  return [];
}
