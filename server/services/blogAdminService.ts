import {
  isPlatformOwner,
  type PlatformOwnerConfiguration,
  type PlatformOwnerIdentity,
} from './platformOwnerAccess';

export type BlogManagementIdentity = PlatformOwnerIdentity & {
  role: string;
};

export type BlogStatusCounts = {
  total: number;
  published: number;
  drafts: number;
  archived: number;
};

export function canManageBlog(
  user: BlogManagementIdentity,
  ownerConfiguration: PlatformOwnerConfiguration | string = {},
): boolean {
  const configuration = typeof ownerConfiguration === 'string'
    ? { openId: ownerConfiguration }
    : ownerConfiguration;
  return user.role === 'admin'
    || user.role === 'blogger'
    || isPlatformOwner(user, configuration);
}

function toCount(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function normalizeBlogStatusCounts(row: Record<string, unknown> | undefined): BlogStatusCounts {
  return {
    total: toCount(row?.total),
    published: toCount(row?.published),
    drafts: toCount(row?.drafts),
    archived: toCount(row?.archived),
  };
}
