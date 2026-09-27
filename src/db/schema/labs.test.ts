import { getTableColumns, getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { lab, labBranch } from "./labs";

describe("labs schema", () => {
  it("names the tables lab and lab_branch, singular", () => {
    expect(getTableName(lab)).toBe("lab");
    expect(getTableName(labBranch)).toBe("lab_branch");
  });

  it("lab: owner_id nullable (seeded vs private, LAB-1, LAB-2), D5 columns present", () => {
    const columns = getTableColumns(lab);

    expect(columns.ownerId.notNull).toBe(false);
    expect(columns.name.notNull).toBe(true);
    expect(columns.address.name).toBe("address");
    expect(columns.linkUrl.name).toBe("link_url");
    expect(columns.services.columnType).toBe("PgArray");
    expect(columns.acceptsMail.name).toBe("accepts_mail");
    expect(columns.searchText.name).toBe("search_text");
  });

  it("lab: partial unique slug index and a trigram GIN index on search_text (D8, B2)", () => {
    const indexes = getTableConfig(lab).indexes;

    expect(indexes.some((index) => index.config.name === "lab_slug_idx")).toBe(true);
    const trgmIndex = indexes.find((index) => index.config.name === "lab_search_text_trgm_idx");
    expect(trgmIndex).toBeDefined();
    expect(trgmIndex?.config.method).toBe("gin");
  });

  it("lab_branch: district holds the new phường, area_hint keeps the old quận (D5), lab_id has no foreign key (D9)", () => {
    const columns = getTableColumns(labBranch);

    expect(columns.labId.name).toBe("lab_id");
    expect(columns.labId.notNull).toBe(true);
    expect("references" in columns.labId).toBe(false);
    expect(columns.district.name).toBe("district");
    expect(columns.areaHint.name).toBe("area_hint");
    expect(columns.city.notNull).toBe(true);
    expect(columns.address.name).toBe("address");
    expect(columns.linkUrl.name).toBe("link_url");
    expect(columns.services.columnType).toBe("PgArray");
    expect(columns.acceptsMail.name).toBe("accepts_mail");
  });

  it("lab_branch: indexes lab_id and city, plus a trigram GIN index on search_text", () => {
    const indexes = getTableConfig(labBranch).indexes;

    expect(indexes.some((index) => index.config.name === "lab_branch_lab_id_idx")).toBe(true);
    expect(indexes.some((index) => index.config.name === "lab_branch_city_idx")).toBe(true);
    const trgmIndex = indexes.find(
      (index) => index.config.name === "lab_branch_search_text_trgm_idx",
    );
    expect(trgmIndex).toBeDefined();
    expect(trgmIndex?.config.method).toBe("gin");
  });
});
