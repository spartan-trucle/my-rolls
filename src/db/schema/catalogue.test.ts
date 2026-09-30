import { getTableColumns, getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { camera, lens, stock } from "./catalogue";

/**
 * Shape tests only (no database) — same style as `auth.test.ts`. The
 * data-layer tests against a real PGlite Postgres (D21) live with B2–B6,
 * where they can exercise search and privacy.
 */
describe("catalogue schema", () => {
  it("names the tables in English, singular", () => {
    expect(getTableName(stock)).toBe("stock");
    expect(getTableName(camera)).toBe("camera");
    expect(getTableName(lens)).toBe("lens");
  });

  it("stock: owner_id nullable (seeded vs private), formats is an array, iso/type/status optional (CAT-1, CAT-2, D4)", () => {
    const columns = getTableColumns(stock);

    expect(columns.ownerId.notNull).toBe(false);
    expect(columns.ownerId.name).toBe("owner_id");
    expect(columns.brand.notNull).toBe(true);
    expect(columns.name.notNull).toBe(true);
    expect(columns.iso.notNull).toBe(false);
    expect(columns.formats.columnType).toBe("PgArray");
    expect(columns.formats.notNull).toBe(false);
    expect(columns.type.notNull).toBe(false);
    expect(columns.status.notNull).toBe(false);
    expect(columns.searchText.name).toBe("search_text");
    expect(columns.deletedAt.name).toBe("deleted_at");
  });

  it("stock: id defaults to uuid_generate_v4() (D9)", () => {
    const columns = getTableColumns(stock);

    expect(columns.id.hasDefault).toBe(true);
    expect(columns.id.getSQLType()).toBe("uuid");
  });

  it("stock: partial unique index on slug scoped to seeded rows, and a trigram GIN index on search_text (D8, B2)", () => {
    const indexes = getTableConfig(stock).indexes;

    const slugIndex = indexes.find((index) => index.config.name === "stock_slug_idx");
    expect(slugIndex).toBeDefined();
    expect(slugIndex?.config.unique).toBe(true);
    expect(slugIndex?.config.where).toBeDefined();

    const trgmIndex = indexes.find(
      (index) => index.config.name === "stock_search_text_trgm_idx",
    );
    expect(trgmIndex).toBeDefined();
    expect(trgmIndex?.config.method).toBe("gin");

    const ownerIndex = indexes.find((index) => index.config.name === "stock_owner_id_idx");
    expect(ownerIndex).toBeDefined();
    expect(ownerIndex?.config.where).toBeDefined();
  });

  it("camera: fixed_stock_id is nullable with no foreign key, for single-use cameras (D20, D9)", () => {
    const columns = getTableColumns(camera);

    expect(columns.fixedStockId.name).toBe("fixed_stock_id");
    expect(columns.fixedStockId.notNull).toBe(false);
    // House rule D9: no `references()` on any Phase 1 table.
    expect("references" in columns.fixedStockId).toBe(false);
  });

  it("camera: same seeded/private split, slug and search_text as stock", () => {
    const columns = getTableColumns(camera);

    expect(columns.ownerId.notNull).toBe(false);
    expect(columns.brand.notNull).toBe(true);
    expect(columns.model.notNull).toBe(true);
    expect(columns.searchText.name).toBe("search_text");

    const indexes = getTableConfig(camera).indexes;
    expect(indexes.some((index) => index.config.name === "camera_slug_idx")).toBe(true);
    expect(
      indexes.some((index) => index.config.name === "camera_search_text_trgm_idx"),
    ).toBe(true);
  });

  it("lens: custom entries only — owner_id is required, no slug or search_text column (D3)", () => {
    const columns = getTableColumns(lens);

    expect(columns.ownerId.notNull).toBe(true);
    expect(columns.brand.notNull).toBe(true);
    expect(columns.model.notNull).toBe(false);
    expect(columns.focalLength.name).toBe("focal_length");
    expect(Object.keys(columns)).not.toContain("slug");
    expect(Object.keys(columns)).not.toContain("searchText");
  });
});
