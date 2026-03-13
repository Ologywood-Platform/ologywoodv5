// Artist Types
export interface Artist {
  id: number;
  userId: number;
  artistName: string;
  genre: string[] | null;
  bio: string | null;
  location: string | null;
  feeRangeMin: number | null;
  feeRangeMax: number | null;
  touringPartySize: number | null;
  profilePhotoUrl: string | null;
  mediaGallery: MediaGallery | null;
  createdAt: Date;
  updatedAt: Date;
}

// Venue Types
export interface Venue {
  id: number;
  userId: number;
  organizationName: string;
  contactName: string | null;
  contactPhone: string | null;
  location: string | null;
  bio: string | null;
  isListed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Media Gallery
export interface MediaGallery {
  photos: string[];
  videos: string[];
}

// Booking Types
export interface Booking {
  id: number;
  artistId: number;
  venueId: number;
  eventDate: Date;
  eventName: string;
  status: BookingStatus;
  totalFee: number;
  depositPaid: number;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// User Types
export interface User {
  id: number;
  email: string;
  emailVerified: boolean;
  name: string | null;
  role: 'user' | 'admin' | 'artist' | 'venue' | 'fan' | 'blogger' | null;
  createdAt: Date;
  updatedAt: Date;
}

// Suggested Artist
export interface SuggestedArtist {
  id: number;
  name: string;
  genres: string[];
  location: string | null;
  profilePhotoUrl: string | null;
  rating: number;
  followers: number;
  isFollowing: boolean;
}

// Contract Types
export interface Contract {
  id: number;
  bookingId: number;
  contractData: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

// Signature Types
export interface Signature {
  id: number;
  contractId: number;
  signerRole: 'artist' | 'venue';
  signatureData: string | null;
  signedAt: Date | null;
  createdAt: Date;
}
