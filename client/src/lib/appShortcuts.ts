/**
 * App Shortcuts Configuration
 * Defines quick action shortcuts for the PWA home screen context menu
 */

export interface AppShortcut {
  name: string;
  short_name?: string;
  description: string;
  url: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
  }>;
}

export const appShortcuts: AppShortcut[] = [
  {
    name: 'Browse Artists',
    short_name: 'Browse',
    description: 'Find and book talented artists',
    url: '/artists',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  },
  {
    name: 'My Bookings',
    short_name: 'Bookings',
    description: 'View and manage your bookings',
    url: '/bookings',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  },
  {
    name: 'Venue Directory',
    short_name: 'Venues',
    description: 'Explore available venues',
    url: '/venues',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  },
  {
    name: 'Messages',
    short_name: 'Messages',
    description: 'Check your messages',
    url: '/messages',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  },
];

/**
 * Get app shortcuts for manifest.json
 */
export function getManifestShortcuts() {
  return appShortcuts.map((shortcut) => ({
    name: shortcut.name,
    short_name: shortcut.short_name || shortcut.name,
    description: shortcut.description,
    url: shortcut.url,
    icons: shortcut.icons,
  }));
}
