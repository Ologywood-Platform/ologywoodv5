/**
 * Artist Domain Types
 * Centralized type definitions for artist-related entities
 */

export interface ArtistProfile {
  id: number;
  userId: number;
  artistName: string;
  bio?: string | null;
  genre: string[];
  location?: string | null;
  feeRangeMin?: number | null;
  feeRangeMax?: number | null;
  touringPartySize?: number | null;
  profilePhotoUrl?: string | null;
  mediaGallery?: string[] | null;
  websiteUrl?: string | null;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    spotify?: string;
    twitter?: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateArtistProfileInput {
  artistName: string;
  bio?: string;
  genre: string[];
  location?: string;
  feeRangeMin?: number;
  feeRangeMax?: number;
  touringPartySize?: number;
  profilePhotoUrl?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    spotify?: string;
    twitter?: string;
  };
}

export interface UpdateArtistProfileInput {
  artistName?: string;
  bio?: string;
  genre?: string[];
  location?: string;
  feeRangeMin?: number;
  feeRangeMax?: number;
  touringPartySize?: number;
  profilePhotoUrl?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    spotify?: string;
    twitter?: string;
  };
}
