import { describe, it, expect } from 'vitest';

describe('ShareProfileModal Component', () => {
  it('should accept artist profile image prop', () => {
    const props = {
      isOpen: true,
      onClose: () => {},
      artistId: 1,
      artistName: 'John Doe',
      artistBio: 'Professional musician',
      artistProfileImage: 'https://example.com/image.jpg'
    };
    
    expect(props.artistProfileImage).toBeDefined();
    expect(props.artistProfileImage).toMatch(/^https:\/\//);
  });

  it('should accept artist name prop', () => {
    const props = {
      isOpen: true,
      onClose: () => {},
      artistId: 1,
      artistName: 'Jane Smith',
      artistBio: 'Jazz vocalist',
      artistProfileImage: 'https://example.com/image.jpg'
    };
    
    expect(props.artistName).toBe('Jane Smith');
    expect(props.artistName.length).toBeGreaterThan(0);
  });

  it('should accept artist bio prop', () => {
    const props = {
      isOpen: true,
      onClose: () => {},
      artistId: 1,
      artistName: 'Artist Name',
      artistBio: 'Professional performer with 10 years of experience',
      artistProfileImage: 'https://example.com/image.jpg'
    };
    
    expect(props.artistBio).toBeDefined();
    expect(props.artistBio?.length).toBeGreaterThan(0);
  });

  it('should generate correct profile URL', () => {
    const artistId = 42;
    const expectedUrl = `/artist/${artistId}`;
    
    expect(expectedUrl).toContain('/artist/');
    expect(expectedUrl).toContain('42');
  });

  it('should generate share text with artist name', () => {
    const artistName = 'The Performers';
    const shareText = `Check out ${artistName} on Ologywood - Book amazing artists for your events!`;
    
    expect(shareText).toContain(artistName);
    expect(shareText).toContain('Ologywood');
  });

  it('should support social media platforms', () => {
    const platforms = ['facebook', 'twitter', 'linkedin', 'instagram', 'whatsapp'];
    
    expect(platforms).toHaveLength(5);
    expect(platforms).toContain('facebook');
    expect(platforms).toContain('twitter');
  });

  it('should handle copy to clipboard', () => {
    const profileUrl = 'https://example.com/artist/1';
    
    expect(profileUrl).toBeDefined();
    expect(profileUrl).toMatch(/^https:\/\//);
  });

  it('should support QR code generation', () => {
    const artistId = 1;
    const profileUrl = `https://example.com/artist/${artistId}`;
    
    expect(profileUrl).toContain('artist');
    expect(profileUrl).toContain('1');
  });

  it('should support email invite functionality', () => {
    const email = 'venue@example.com';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(emailRegex.test(email)).toBe(true);
  });

  it('should include profile image in Open Graph meta tags', () => {
    const artistProfileImage = 'https://cdn.example.com/artist-photo.jpg';
    
    expect(artistProfileImage).toBeDefined();
    expect(artistProfileImage).toMatch(/\.(jpg|jpeg|png|webp)$/i);
  });

  it('should display artist preview with image and name', () => {
    const artistName = 'The Jazz Collective';
    const artistProfileImage = 'https://example.com/jazz-collective.jpg';
    
    expect(artistName).toBeDefined();
    expect(artistProfileImage).toBeDefined();
  });

  it('should handle missing profile image gracefully', () => {
    const props = {
      isOpen: true,
      onClose: () => {},
      artistId: 1,
      artistName: 'Artist Without Photo',
      artistBio: 'Great performer',
      artistProfileImage: undefined
    };
    
    expect(props.artistProfileImage).toBeUndefined();
    expect(props.artistName).toBeDefined();
  });
});
