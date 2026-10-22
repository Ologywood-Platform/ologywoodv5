export const VIDEO_PORTFOLIO_MANAGEMENT_MAX_IDS = 100;

export type VideoPortfolioManagementContext = {
  ownerAccountId: number;
  artistProfileId: number;
};

export type VideoPortfolioManagedStatus = 'active' | 'processing';

export type VideoPortfolioManagementItem = {
  id: number;
  title: string;
  sortOrder: number;
  status: VideoPortfolioManagedStatus;
  thumbnailUrl?: string;
};

export type VideoPortfolioManagementState = {
  artistProfileId: number;
  items: VideoPortfolioManagementItem[];
  revision: string;
};

export type EditVideoPortfolioTitleInput = {
  id: number;
  title: string;
  expectedTitle: string;
};

export type SaveVideoPortfolioOrderInput = {
  ids: number[];
  expectedRevision: string;
};

export function isPositiveSafeId(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

export function isValidVideoPortfolioOrderIds(value: unknown): value is number[] {
  return Array.isArray(value)
    && value.length <= VIDEO_PORTFOLIO_MANAGEMENT_MAX_IDS
    && value.every(isPositiveSafeId)
    && new Set(value).size === value.length;
}
