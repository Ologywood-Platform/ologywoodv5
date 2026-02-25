import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const clientSrc = join(__dirname, '..', 'client', 'src');

describe('Venue Dashboard - Book Artist Button', () => {
  it('Book Artist button has an onClick handler that navigates to booking creation', () => {
    const filePath = join(clientSrc, 'pages', 'VenueDashboard.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Find the Book Artist button and verify it has an onClick
    const bookArtistIndex = content.indexOf('Book Artist');
    expect(bookArtistIndex).toBeGreaterThan(-1);

    // Get the surrounding context (the Button component wrapping "Book Artist")
    const buttonStart = content.lastIndexOf('<Button', bookArtistIndex);
    const buttonSection = content.substring(buttonStart, bookArtistIndex + 50);

    expect(buttonSection).toContain('onClick');
    expect(buttonSection).toContain('booking/create');
    expect(buttonSection).toContain('artistId');
  });

  it('View Profile button has an onClick handler', () => {
    const filePath = join(clientSrc, 'pages', 'VenueDashboard.tsx');
    const content = readFileSync(filePath, 'utf-8');

    const viewProfileIndex = content.indexOf('View Profile');
    expect(viewProfileIndex).toBeGreaterThan(-1);

    const buttonStart = content.lastIndexOf('<Button', viewProfileIndex);
    const buttonSection = content.substring(buttonStart, viewProfileIndex + 30);

    expect(buttonSection).toContain('onClick');
    expect(buttonSection).toContain('handleViewArtist');
  });

  it('BookingCreate page accepts artistId query param', () => {
    const filePath = join(clientSrc, 'pages', 'BookingCreate.tsx');
    const content = readFileSync(filePath, 'utf-8');

    expect(content).toContain("params.get('artistId')");
    expect(content).toContain('useSearch');
  });

  it('booking/create route is registered in App.tsx', () => {
    const filePath = join(clientSrc, 'App.tsx');
    const content = readFileSync(filePath, 'utf-8');

    expect(content).toContain('booking/create');
    expect(content).toContain('BookingCreate');
  });
});
