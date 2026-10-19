/** Profile presentation only: never used to sort purchases or personal libraries. */
export const RELEASE_ORDER_KINDS = ['music', 'content_singles'] as const;
export type ReleaseOrderKind = typeof RELEASE_ORDER_KINDS[number];
export const RELEASE_ORDER_MAX_ITEMS = 10_000;
export interface ReleaseOrderItem { id: number; title: string }
export interface ReleaseOrderState {
  kind: ReleaseOrderKind;
  revision: number;
  custom: boolean;
  items: ReleaseOrderItem[];
}
export interface SaveReleaseOrderInput {
  kind: ReleaseOrderKind;
  expectedRevision: number;
  ids: number[];
  reset?: boolean;
}

export function validReleaseOrderIds(value: unknown): value is number[] {
  return Array.isArray(value) && value.length <= RELEASE_ORDER_MAX_ITEMS &&
    value.every(id => Number.isSafeInteger(id) && id > 0) && new Set(value).size === value.length;
}

/** Replace only eligible slots; unpublished/other release types stay in place.
 * Missing references are ignored; newly published singles follow saved singles.
 * The caller supplies the ordinary newest-first baseline.
 */
export function applyReleaseOrder<T extends { id: number }>(
  rows: readonly T[], ids: readonly number[], eligible: (row: T) => boolean = () => true,
): T[] {
  const selected = rows.filter(eligible);
  const byId = new Map(selected.map(row => [row.id, row]));
  const seen = new Set<number>();
  const ordered: T[] = [];
  for (const id of ids) {
    const row = byId.get(id);
    if (row && !seen.has(id)) { ordered.push(row); seen.add(id); }
  }
  for (const row of selected) if (!seen.has(row.id)) { ordered.push(row); seen.add(row.id); }
  let index = 0;
  return rows.map(row => eligible(row) ? ordered[index++] : row);
}

export function moveReleaseOrderItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= next.length || to >= next.length) return next;
  const [item] = next.splice(from, 1); next.splice(to, 0, item); return next;
}

export function sameReleaseOrder(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}
