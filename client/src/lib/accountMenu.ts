import { toSlug } from '@/lib/slugify';

export type AccountMenuItem = {
  id: 'profile' | 'artist-dashboard' | 'team-workspace' | 'my-ology' | 'workspace' | 'settings';
  label: string;
  href: string;
};

type TeamWorkspaceContext = {
  artistName?: string | null;
  role?: string | null;
} | null;

export function getAccountMenuItems({
  userRole,
  isCreatorOwner,
  artistName,
  teamContext,
}: {
  userRole?: string | null;
  isCreatorOwner: boolean;
  artistName?: string | null;
  teamContext?: TeamWorkspaceContext;
}): AccountMenuItem[] {
  const isCollaborator = !!teamContext && teamContext.role !== 'owner';
  const profileName = isCollaborator ? teamContext?.artistName : artistName;
  const profileHref = profileName
    ? `/artist/${toSlug(profileName)}`
    : isCreatorOwner
      ? '/profile/edit'
      : userRole === 'venue'
        ? '/venue-dashboard'
        : '/settings';

  const items: AccountMenuItem[] = [
    { id: 'profile', label: 'My Profile', href: profileHref },
  ];

  if (isCollaborator) {
    items.push({ id: 'team-workspace', label: 'Team Workspace', href: '/workspace' });
  } else if (isCreatorOwner) {
    items.push({ id: 'artist-dashboard', label: 'Artist Dashboard', href: '/dashboard' });
  }

  items.push({ id: 'my-ology', label: 'My Ology', href: '/my-ology' });
  if (!isCollaborator) {
    items.push({ id: 'workspace', label: 'Workspace', href: '/workspace' });
  }
  items.push({ id: 'settings', label: 'Account Settings', href: '/settings' });

  return items;
}
