import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { AdminProfileNavigation } from '../../../server/services/adminProfileNavigation';

export function AdminUserProfileLink({ name, profile }: {
  name: string | null;
  profile?: AdminProfileNavigation;
}) {
  const label = name?.trim() || profile?.profileName || 'Unnamed user';
  const statusLabel = profile?.status === 'team_member'
    ? 'Team member — no standalone profile'
    : profile?.status === 'unavailable'
      ? 'Profile unavailable'
      : 'No public profile created';
  if (profile?.status !== 'available' || !profile.href) {
    return <div>
      <span>{label}</span>
      <p className="mt-0.5 text-xs text-gray-500">{statusLabel}</p>
    </div>;
  }
  return <div>
    <a
      href={profile.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View ${profile.profileName || label}'s profile (opens in a new tab)`}
      className="inline-flex items-center gap-1.5 rounded text-purple-700 underline underline-offset-2 hover:text-purple-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
    >
      {label}
      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    </a>
    {profile.profileName && profile.profileName !== label && <p className="mt-0.5 text-xs text-gray-500">{profile.profileName}</p>}
  </div>;
}
