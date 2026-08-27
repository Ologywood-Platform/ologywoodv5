import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  buildMerchFanUpdate,
  buildMerchShareText,
  buildMerchShareUrls,
} from '../client/src/lib/merchShare';

const details = {
  title: 'T-Shirt Testing',
  sellerName: 'Adonis',
  priceDisplay: '$12.00',
  url: 'https://www.ologywood.com/merch/t-shirt-testing-5',
};

describe('custom merch share panel', () => {
  it('builds encoded product sharing URLs for every supported destination', () => {
    const urls = buildMerchShareUrls(details);

    expect(new URL(urls.facebook).searchParams.get('u')).toBe(details.url);
    expect(new URL(urls.x).searchParams.get('url')).toBe(details.url);
    expect(new URL(urls.x).searchParams.get('text')).toContain('T-Shirt Testing by Adonis — $12.00');
    expect(new URL(urls.linkedin).searchParams.get('url')).toBe(details.url);
    expect(new URL(urls.whatsapp).searchParams.get('text')).toContain(details.url);
    expect(urls.email).toContain(encodeURIComponent(details.url));
    expect(urls.sms).toContain(encodeURIComponent(details.url));
  });

  it('creates concise product text and a prefilled fan update without sending it', () => {
    expect(buildMerchShareText(details)).toBe('T-Shirt Testing by Adonis — $12.00');
    expect(buildMerchFanUpdate(details)).toEqual({
      subject: 'New merch: T-Shirt Testing',
      body: 'I just added T-Shirt Testing to my OlogyWood shop.\n\n$12.00\n\nShop now: https://www.ologywood.com/merch/t-shirt-testing-5',
    });
  });

  it('renders the real crawler image and limits Send to Fans to the artist owner', () => {
    const dialogSource = fs.readFileSync(
      path.resolve(__dirname, '../client/src/components/MerchShareDialog.tsx'),
      'utf8',
    );

    expect(dialogSource).toContain('/api/og-image/merch/${item.id}');
    expect(dialogSource).toContain("user?.id === item.userId && item.userType === 'artist'");
    expect(dialogSource).toContain('Nothing is sent automatically');
    expect(dialogSource).toContain('initialSubject={fanUpdate.subject}');
    expect(dialogSource).toContain('initialBody={fanUpdate.body}');
    expect(dialogSource).toContain('Facebook');
    expect(dialogSource).toContain('LinkedIn');
    expect(dialogSource).toContain('WhatsApp');
    expect(dialogSource).toContain('More Options');
  });

  it('prefills the existing fan composer while preserving its confirmation step', () => {
    const composerSource = fs.readFileSync(
      path.resolve(__dirname, '../client/src/components/SendUpdateDialog.tsx'),
      'utf8',
    );

    expect(composerSource).toContain('initialSubject?: string');
    expect(composerSource).toContain('initialBody?: string');
    expect(composerSource).toContain('setSubject(initialSubject || "")');
    expect(composerSource).toContain('setBody(initialBody || "")');
    expect(composerSource).toContain('Confirm Send');
  });
});
