import { getTableColumns, getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { roll } from "./rolls";

describe("rolls schema", () => {
  it("names the table roll, singular", () => {
    expect(getTableName(roll)).toBe("roll");
  });

  it("only stock and camera are required; every other ROLL-1 field is optional (D1)", () => {
    const columns = getTableColumns(roll);

    expect(columns.stockId.notNull).toBe(true);
    expect(columns.cameraBagItemId.notNull).toBe(true);
    expect(columns.lensId.notNull).toBe(false);
    expect(columns.boxIso.notNull).toBe(false);
    expect(columns.shotIso.notNull).toBe(false);
    expect(columns.exposures.notNull).toBe(false);
    expect(columns.format.notNull).toBe(false);
    expect(columns.locations.columnType).toBe("PgArray");
    expect(columns.locations.notNull).toBe(false);
    expect(columns.shotFrom.notNull).toBe(false);
    expect(columns.shotTo.notNull).toBe(false);
    expect(columns.name.notNull).toBe(false);
  });

  it("points at the owner's bag item for the camera, not the catalogue model (D2)", () => {
    const columns = getTableColumns(roll);

    expect(columns.cameraBagItemId.name).toBe("camera_bag_item_id");
    expect("references" in columns.cameraBagItemId).toBe(false);
    expect("references" in columns.stockId).toBe(false);
    expect("references" in columns.lensId).toBe(false);
  });

  it("has no push_pull column — it's computed, not stored (D17)", () => {
    expect(Object.keys(getTableColumns(roll))).not.toContain("pushPull");
  });

  it("carries a nullable per-user number and a day|month date precision (Round 2, R2-4, R2-5)", () => {
    const columns = getTableColumns(roll);

    expect(columns.number.notNull).toBe(false);
    expect(columns.number.dataType).toBe("number");
    expect(columns.datePrecision.name).toBe("date_precision");
    expect(columns.datePrecision.notNull).toBe(false);
    expect(columns.datePrecision.enumValues).toEqual(["day", "month"]);
  });

  it("never reuses a live roll number for the same user (R2-5)", () => {
    const indexes = getTableConfig(roll).indexes;
    const numberIndex = indexes.find((index) => index.config.name === "roll_user_id_number_idx");

    expect(numberIndex).toBeDefined();
    expect(numberIndex?.config.unique).toBe(true);
    expect(numberIndex?.config.where).toBeDefined();
  });

  it("carries version for share-image cache busting, and user_id for owner scoping (D9)", () => {
    const columns = getTableColumns(roll);

    expect(columns.version.notNull).toBe(true);
    expect(columns.version.default).toBe(1);
    expect(columns.userId.notNull).toBe(true);
  });

  it("indexes (user_id, created_at) partial on deleted_at for listRolls (D15, D9)", () => {
    const indexes = getTableConfig(roll).indexes;
    const userIdIndex = indexes.find(
      (index) => index.config.name === "roll_user_id_created_at_idx",
    );

    expect(userIdIndex).toBeDefined();
    expect(userIdIndex?.config.where).toBeDefined();
  });
});
