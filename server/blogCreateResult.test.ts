import { describe, expect, it, vi } from "vitest";
import { normalizeBlogInsertId } from "./services/blogAdminService";

const testState = vi.hoisted(() => ({
  db: undefined as any,
  inserted: [] as Record<string, unknown>[],
}));

vi.mock("./db", () => ({
  getDb: vi.fn(async () => testState.db),
}));

import { blogRouter } from "./routers/blog";

const input = {
  title: "EDU draft",
  slug: "edu-draft",
  excerpt: "A draft excerpt",
  content: "Draft content",
  category: "guide" as const,
  tags: [],
  status: "draft" as const,
};

function createContext() {
  return {
    user: {
      id: 42,
      openId: "approved-blogger",
      email: "blogger@example.com",
      name: "Approved Blogger",
      role: "blogger",
    },
    req: {} as any,
    res: {} as any,
  } as any;
}

function mockInsert(result: unknown) {
  const values = vi.fn(async (row: Record<string, unknown>) => {
    testState.inserted.push(row);
    return result;
  });
  testState.inserted = [];
  testState.db = { insert: vi.fn(() => ({ values })) };
  return { values };
}

describe("blog insert result IDs", () => {
  it.each([
    [[{ insertId: 10 }, []], 10],
    [{ insertId: "11" }, 11],
    [{ insertId: 12n }, 12],
  ])("normalizes supported result shape %#", (result, expected) => {
    expect(normalizeBlogInsertId(result)).toBe(expected);
  });

  it.each([
    undefined,
    null,
    {},
    { insertId: true },
    { insertId: 0 },
    { insertId: -1 },
    { insertId: 1.5 },
    { insertId: Number.MAX_SAFE_INTEGER + 1 },
    { insertId: "not-an-id" },
    { insertId: "1.5" },
    [{ insertId: undefined }, []],
  ])("rejects unsupported ID %#", (result) => {
    expect(normalizeBlogInsertId(result)).toBeUndefined();
  });

  it.each([
    [[{ insertId: 10 }, []], 10],
    [{ insertId: "11" }, 11],
  ])("creates exactly one authorized draft for result shape %#", async (result, expectedId) => {
    const { values } = mockInsert(result);

    const created = await blogRouter.createCaller(createContext()).create(input);

    expect(created).toEqual({ success: true, postId: expectedId });
    expect(values).toHaveBeenCalledTimes(1);
    expect(testState.inserted).toHaveLength(1);
    expect(testState.inserted[0]).toMatchObject({
      title: input.title,
      slug: input.slug,
      content: input.content,
      status: "draft",
      publishedAt: null,
      authorId: 42,
      authorName: "Approved Blogger",
    });
  });

  it.each([undefined, { insertId: true }, [{ insertId: 0 }, []]])(
    "does not claim success for unsupported result %#",
    async (result) => {
      const { values } = mockInsert(result);

      await expect(blogRouter.createCaller(createContext()).create(input)).rejects.toThrow(
        "Blog post was created but its identifier could not be confirmed.",
      );
      expect(values).toHaveBeenCalledTimes(1);
      expect(testState.inserted).toHaveLength(1);
    },
  );
});

function mockUpdate(publishedAt: Date | null = null, exists = true) {
  const where = vi.fn(async () => [{ affectedRows: 1 }]);
  const set = vi.fn(() => ({ where }));
  const selectWhere = vi.fn(async () => exists ? [{ publishedAt }] : []);
  const select = vi.fn(() => ({ from: vi.fn(() => ({ where: selectWhere })) }));
  testState.db = { update: vi.fn(() => ({ set })), select };
  return { set, where, select };
}

describe('native blog editor save contract', () => {
  it('accepts the editor draft status without publishing or querying publication history', async () => {
    const { set, where, select } = mockUpdate();
    await expect(blogRouter.createCaller(createContext()).update({ id: 10, title: 'Updated draft', status: 'draft' })).resolves.toEqual({ success: true });
    expect(set).toHaveBeenCalledWith({ title: 'Updated draft', status: 'draft' });
    expect(where).toHaveBeenCalledTimes(1); expect(select).not.toHaveBeenCalled();
  });
  it('leaves status and publication dates untouched for metadata-only updates', async () => {
    const { set, select } = mockUpdate();
    await blogRouter.createCaller(createContext()).update({ id: 10, excerpt: 'New summary' });
    expect(set).toHaveBeenCalledWith({ excerpt: 'New summary' }); expect(select).not.toHaveBeenCalled();
  });
  it('sets the initial timestamp only for an explicitly published existing post', async () => {
    const { set } = mockUpdate();
    await blogRouter.createCaller(createContext()).update({ id: 10, status: 'published' });
    expect(set).toHaveBeenCalledWith({ status: 'published', publishedAt: expect.any(Date) });
  });
  it('does not restamp a previously published post', async () => {
    const { set } = mockUpdate(new Date('2026-01-01T00:00:00Z'));
    await blogRouter.createCaller(createContext()).update({ id: 10, status: 'published' });
    expect(set).toHaveBeenCalledWith({ status: 'published' });
  });
  it('does not clear historical publication dates when returning to draft', async () => {
    const { set } = mockUpdate(new Date('2026-01-01T00:00:00Z'));
    await blogRouter.createCaller(createContext()).update({ id: 10, status: 'draft' });
    expect(set).toHaveBeenCalledWith({ status: 'draft' });
  });
  it('does not claim to publish a missing post', async () => {
    const { set } = mockUpdate(null, false);
    await expect(blogRouter.createCaller(createContext()).update({ id: 10, status: 'published' })).rejects.toThrow('Post not found');
    expect(set).not.toHaveBeenCalled();
  });
  it.each([{ authorId: 999 }, { status: 'archived' }])('still rejects unauthorized or unsupported update fields %#', async extra => {
    const { set } = mockUpdate();
    await expect(blogRouter.createCaller(createContext()).update({ id: 10, ...extra } as any)).rejects.toThrow();
    expect(set).not.toHaveBeenCalled();
  });
});
