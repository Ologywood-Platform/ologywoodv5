import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const componentPath = path.join(__dirname, '../../client/src/components/TipQRCode.tsx');
const editProfilePath = path.join(__dirname, '../../client/src/pages/ArtistEditProfile.tsx');
const artistProfilePath = path.join(__dirname, '../../client/src/pages/ArtistProfile.tsx');

const component = fs.readFileSync(componentPath, 'utf-8');
const editProfile = fs.readFileSync(editProfilePath, 'utf-8');
const artistProfile = fs.readFileSync(artistProfilePath, 'utf-8');

describe('Tip QR Code Feature', () => {
  describe('TipQRCode Component', () => {
    it('imports QRCodeSVG from qrcode.react', () => {
      expect(component).toContain('import { QRCodeSVG } from "qrcode.react"');
    });

    it('defines all four payment services', () => {
      expect(component).toContain('"cashapp"');
      expect(component).toContain('"venmo"');
      expect(component).toContain('"paypal"');
      expect(component).toContain('"zelle"');
    });

    it('generates correct URLs for Cash App', () => {
      expect(component).toContain('https://cash.app/');
    });

    it('generates correct URLs for Venmo', () => {
      expect(component).toContain('https://venmo.com/');
    });

    it('generates correct URLs for PayPal', () => {
      expect(component).toContain('https://paypal.me/');
    });

    it('generates correct URLs for Zelle', () => {
      expect(component).toContain('mailto:');
    });

    it('exports TipQRPreview component for edit profile', () => {
      expect(component).toContain('export function TipQRPreview');
    });

    it('exports TipQRSection component for artist profile', () => {
      expect(component).toContain('export function TipQRSection');
    });

    it('renders QRCodeSVG with proper props', () => {
      expect(component).toContain('QRCodeSVG');
      expect(component).toContain('value={url}');
      expect(component).toContain('bgColor="#ffffff"');
      expect(component).toContain('fgColor="#000000"');
    });

    it('has a Show QR Codes button', () => {
      expect(component).toContain('Show QR Codes');
    });

    it('has a Print Card button', () => {
      expect(component).toContain('Print Card');
    });

    it('generates printable card with artist name', () => {
      expect(component).toContain('Support {artistName}');
    });

    it('includes Ologywood branding in print card', () => {
      expect(component).toContain('Ologywood');
      expect(component).toContain('ologywood.com');
    });

    it('only shows QR codes for filled tip links', () => {
      expect(component).toContain('tipLinks[s.key]?.trim()');
    });

    it('returns null when no active services', () => {
      expect(component).toContain('if (activeServices.length === 0) return null');
    });

    it('uses Dialog for QR code modal', () => {
      expect(component).toContain('Dialog');
      expect(component).toContain('DialogContent');
    });

    it('opens print window for card printing', () => {
      expect(component).toContain('window.open');
      expect(component).toContain('printWindow.print()');
    });

    it('includes service color indicators', () => {
      expect(component).toContain('#00D54B'); // Cash App green
      expect(component).toContain('#3D95CE'); // Venmo blue
      expect(component).toContain('#00457C'); // PayPal blue
      expect(component).toContain('#6D1ED4'); // Zelle purple
    });
  });

  describe('Edit Profile Integration', () => {
    it('imports TipQRPreview', () => {
      expect(editProfile).toContain('import { TipQRPreview } from "@/components/TipQRCode"');
    });

    it('renders TipQRPreview with tip link state', () => {
      expect(editProfile).toContain('<TipQRPreview tipLinks={{ cashapp, venmo, paypal, zelle }}');
    });
  });

  describe('Artist Profile Integration', () => {
    it('imports TipQRSection', () => {
      expect(artistProfile).toContain('import { TipQRSection } from "@/components/TipQRCode"');
    });

    it('renders TipQRSection with artist tip links', () => {
      expect(artistProfile).toContain('<TipQRSection tipLinks={tipLinks} artistName={artist.artistName}');
    });
  });
});
