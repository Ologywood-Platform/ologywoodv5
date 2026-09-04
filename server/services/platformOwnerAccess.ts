export type PlatformOwnerIdentity = {
  id?: number;
  openId?: string | null;
  email?: string | null;
};

export type PlatformOwnerConfiguration = {
  openId?: string;
  legacyOpenId?: string;
  email?: string;
};

const DEFAULT_PLATFORM_OWNER_EMAIL = 'garychisolm30@gmail.com';

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

export function isPlatformOwner(
  user: PlatformOwnerIdentity,
  configuration: PlatformOwnerConfiguration = {},
): boolean {
  const ownerOpenId = configuration.openId ?? process.env.OWNER_OPEN_ID ?? '';
  const legacyOwnerOpenId = configuration.legacyOpenId ?? process.env.OWNER_NAME ?? '';
  const ownerEmail = configuration.email
    ?? process.env.OWNER_EMAIL
    ?? DEFAULT_PLATFORM_OWNER_EMAIL;

  if (ownerOpenId && user.openId === ownerOpenId) return true;
  if (legacyOwnerOpenId && user.openId === legacyOwnerOpenId) return true;
  return normalize(ownerEmail).length > 0
    && normalize(user.email) === normalize(ownerEmail);
}
