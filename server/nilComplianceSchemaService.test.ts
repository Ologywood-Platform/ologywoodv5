import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ensureNilComplianceSchema,
  resetNilComplianceSchemaForTests,
} from "./services/nilComplianceSchemaService";

describe("NIL compliance runtime schema compatibility", () => {
  beforeEach(() => resetNilComplianceSchemaForTests());

  it("creates only the approved additive tables and repairs missing contract columns once", async () => {
    const execute = vi.fn(async (query: unknown) => {
      if (typeof query === "string" && query === "SHOW COLUMNS FROM `contracts`") {
        return [[{ Field: "id" }, { Field: "templateVersion" }], []];
      }
      if (typeof query === "string" && query === "SHOW COLUMNS FROM `ology_live_session_contracts`") {
        const error = new Error("Table 'ologywood.ology_live_session_contracts' doesn't exist") as Error & { cause?: { code: string } };
        error.cause = { code: "ER_NO_SUCH_TABLE" };
        throw error;
      }
      return [[], []];
    });

    const db = { execute };
    await ensureNilComplianceSchema(db);

    expect(execute).toHaveBeenCalledTimes(8);
    expect(execute.mock.calls.filter(([query]) => typeof query !== "string")).toHaveLength(3);
    const stringQueries = execute.mock.calls
      .map(([query]) => typeof query === "string" ? query : "")
      .filter(Boolean);
    expect(stringQueries).toContain("SHOW COLUMNS FROM `contracts`");
    expect(stringQueries).toContain("SHOW COLUMNS FROM `ology_live_session_contracts`");
    expect(stringQueries).toEqual(expect.arrayContaining([
      "ALTER TABLE `contracts` ADD COLUMN `nilTermsVersion` varchar(64)",
      "ALTER TABLE `contracts` ADD COLUMN `complianceSnapshot` json",
      "ALTER TABLE `contracts` ADD COLUMN `contentHash` varchar(64)",
    ]));
    expect(stringQueries.some((query) => query.includes("DROP TABLE") || query.includes("DROP COLUMN"))).toBe(false);

    await ensureNilComplianceSchema(db);
    expect(execute).toHaveBeenCalledTimes(8);
  });
});
