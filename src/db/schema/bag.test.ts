import { getTableColumns, getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { bagItem } from "./bag";

describe("bag schema", () => {
  it("names the table bag_item, singular", () => {
    expect(getTableName(bagItem)).toBe("bag_item");
  });

  it("kind is camera | lens | stock, ref_id has no foreign key (D3, D9)", () => {
    const columns = getTableColumns(bagItem);

    expect(columns.userId.name).toBe("user_id");
    expect(columns.userId.notNull).toBe(true);
    expect(columns.kind.notNull).toBe(true);
    expect(columns.kind.enumValues).toEqual(["camera", "lens", "stock"]);
    expect(columns.refId.name).toBe("ref_id");
    expect(columns.refId.notNull).toBe(true);
    expect("references" in columns.refId).toBe(false);
    expect(columns.deletedAt.name).toBe("deleted_at");
  });

  it("indexes user_id for owner-scoped listBag queries, partial on deleted_at (D9)", () => {
    const indexes = getTableConfig(bagItem).indexes;
    const userIdIndex = indexes.find((index) => index.config.name === "bag_item_user_id_idx");

    expect(userIdIndex).toBeDefined();
    expect(userIdIndex?.config.where).toBeDefined();
  });
});
