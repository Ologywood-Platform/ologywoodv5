import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const rootDir = resolve(__dirname, '../..');

describe('Tip Links Feature', () => {
  describe('Database Schema', () => {
    const schema = readFileSync(resolve(rootDir, 'drizzle/schema.ts'), 'utf-8');

    it('artist_profiles table has tipLinks JSON column', () => {
      expect(schema).toContain('tipLinks: json("tipLinks")');
    });

    it('tipLinks type includes cashapp, venmo, paypal, zelle', () => {
      expect(schema).toContain('cashapp?: string');
      expect(schema).toContain('venmo?: string');
      expect(schema).toContain('paypal?: string');
      expect(schema).toContain('zelle?: string');
    });
  });

  describe('Server Router', () => {
    const routers = readFileSync(resolve(rootDir, 'server/routers.ts'), 'utf-8');

    it('updateProfile accepts tipLinks input', () => {
      expect(routers).toContain('tipLinks: z.object({');
      expect(routers).toContain('cashapp: z.string().optional()');
      expect(routers).toContain('venmo: z.string().optional()');
      expect(routers).toContain('paypal: z.string().optional()');
      expect(routers).toContain('zelle: z.string().optional()');
    });
  });

  describe('Artist Edit Profile UI', () => {
    const editProfile = readFileSync(resolve(rootDir, 'client/src/pages/ArtistEditProfile.tsx'), 'utf-8');

    it('has tip link state variables', () => {
      expect(editProfile).toContain('setCashapp');
      expect(editProfile).toContain('setVenmo');
      expect(editProfile).toContain('setPaypal');
      expect(editProfile).toContain('setZelle');
    });

    it('has Support This Artist card section', () => {
      expect(editProfile).toContain('Support This Artist');
    });

    it('populates tip links from profile data', () => {
      expect(editProfile).toContain('profile.tipLinks');
      expect(editProfile).toContain('tips.cashapp');
      expect(editProfile).toContain('tips.venmo');
      expect(editProfile).toContain('tips.paypal');
      expect(editProfile).toContain('tips.zelle');
    });

    it('includes tipLinks in save mutation', () => {
      expect(editProfile).toContain('tipLinks: {');
      expect(editProfile).toContain('cashapp: cashapp.trim()');
      expect(editProfile).toContain('venmo: venmo.trim()');
      expect(editProfile).toContain('paypal: paypal.trim()');
      expect(editProfile).toContain('zelle: zelle.trim()');
    });

    it('shows placeholder text for each payment method', () => {
      expect(editProfile).toContain('$yourcashtag');
      expect(editProfile).toContain('@yourvenmo');
      expect(editProfile).toContain('paypal.me/yourname');
      expect(editProfile).toContain('your@email.com or phone number');
    });

    it('shows no platform fees message', () => {
      expect(editProfile).toContain('no platform fees');
    });
  });

  describe('Public Artist Profile Display', () => {
    const artistProfile = readFileSync(resolve(rootDir, 'client/src/pages/ArtistProfile.tsx'), 'utf-8');

    it('parses tipLinks from artist data', () => {
      expect(artistProfile).toContain('artist.tipLinks');
      expect(artistProfile).toContain('hasTipLinks');
    });

    it('renders Support section with artist name', () => {
      expect(artistProfile).toContain('Support {artist.artistName}');
    });

    it('generates correct Cash App links', () => {
      expect(artistProfile).toContain('cash.app/');
    });

    it('generates correct Venmo links', () => {
      expect(artistProfile).toContain('venmo.com/');
    });

    it('generates correct PayPal links', () => {
      expect(artistProfile).toContain('paypal.me/');
    });

    it('shows Zelle info as text (not a link)', () => {
      expect(artistProfile).toContain('Zelle: {tipLinks.zelle}');
    });

    it('only shows tip section when artist has tip links', () => {
      expect(artistProfile).toContain('{hasTipLinks && (');
    });

    it('shows tip directly message', () => {
      expect(artistProfile).toContain('Tip directly');
    });
  });
});
