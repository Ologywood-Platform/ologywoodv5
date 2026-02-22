/**
 * Stub implementations for functions used by non-MVP routers
 * These are temporary placeholders to prevent build errors
 * The proper fix would be to fully remove non-MVP routers
 */

export async function removeSavedEvent(userId: number, eventId: number) {
  return null;
}

export async function getVenueProfileByToken(token: string) {
  return null;
}

export async function getUserById(userId: number) {
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

export async function getEmailPreferences(userId: number) {
  return null;
}

export async function createEmailPreferences(userId: number) {
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

export async function addEventPhoto(eventId: number, photoUrl: string) {
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
