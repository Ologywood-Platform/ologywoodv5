export type LibraryPurchaseCandidate = {
  id: number;
  releaseId: number;
  hiddenFromLibrary?: boolean | null;
  purchasedAt?: Date | string | null;
  release?: {
    audioFileKey?: string | null;
  } | null;
};

function purchaseTime(value: Date | string | null | undefined) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

/**
 * Purchase history remains one row per completed checkout. The music library,
 * however, represents playable releases rather than transactions. Keep the
 * newest visible entitlement for each release so buying the same song twice
 * still produces one player item without deleting either purchase record.
 */
export function selectUniquePlayablePurchases<T extends LibraryPurchaseCandidate>(purchases: readonly T[]): T[] {
  const newestFirst = [...purchases].sort((left, right) => {
    const timeDifference = purchaseTime(right.purchasedAt) - purchaseTime(left.purchasedAt);
    return timeDifference || right.id - left.id;
  });

  const uniqueByRelease = new Map<number, T>();
  for (const purchase of newestFirst) {
    if (purchase.hiddenFromLibrary || !purchase.release?.audioFileKey) continue;
    if (!uniqueByRelease.has(purchase.releaseId)) {
      uniqueByRelease.set(purchase.releaseId, purchase);
    }
  }

  return Array.from(uniqueByRelease.values());
}
