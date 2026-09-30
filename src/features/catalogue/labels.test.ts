import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/vi.json";
import { cameraFormatLabelKey, cameraTypeLabelKey, stockTypeLabelKey } from "./labels";

interface IStockSeed {
  type?: string | null;
}

interface ICameraSeed {
  type?: string | null;
}

function readSeed<T>(fileName: string): T[] {
  const raw = readFileSync(join(process.cwd(), "data", "catalogue", fileName), "utf-8");
  return JSON.parse(raw) as T[];
}

/**
 * Every `type` the seed actually uses (B3) must have a label — iterating
 * the JSON, not a hardcoded list, so a newly seeded type with no label
 * fails this test instead of silently rendering nothing (or, before this
 * fix, the raw English slug) to users.
 */
describe("stockTypeLabelKey", () => {
  const stocks = readSeed<IStockSeed>("stocks.json");
  const seededTypes = [...new Set(stocks.map((stock) => stock.type).filter((type): type is string => !!type))];

  it("covers every seeded stock type", () => {
    expect(seededTypes.length).toBeGreaterThan(0);

    for (const type of seededTypes) {
      const key = stockTypeLabelKey(type);
      expect(key, `no label key for stock type "${type}"`).not.toBeNull();
      expect(
        (messages.catalogue.types as Record<string, string>)[key as string],
        `no vi.json label for stock type "${type}" (key "${key}")`,
      ).toBeTruthy();
    }
  });

  it("returns null for null, undefined and an unknown value", () => {
    expect(stockTypeLabelKey(null)).toBeNull();
    expect(stockTypeLabelKey(undefined)).toBeNull();
    expect(stockTypeLabelKey("not-a-real-type")).toBeNull();
  });
});

describe("cameraTypeLabelKey", () => {
  const cameras = readSeed<ICameraSeed>("cameras.json");
  const seededTypes = [...new Set(cameras.map((camera) => camera.type).filter((type): type is string => !!type))];

  it("covers every seeded camera type", () => {
    expect(seededTypes.length).toBeGreaterThan(0);

    for (const type of seededTypes) {
      const key = cameraTypeLabelKey(type);
      expect(key, `no label key for camera type "${type}"`).not.toBeNull();
      expect(
        (messages.catalogue.types as Record<string, string>)[key as string],
        `no vi.json label for camera type "${type}" (key "${key}")`,
      ).toBeTruthy();
    }
  });

  it("returns null for null, undefined and an unknown value", () => {
    expect(cameraTypeLabelKey(null)).toBeNull();
    expect(cameraTypeLabelKey(undefined)).toBeNull();
    expect(cameraTypeLabelKey("not-a-real-type")).toBeNull();
  });
});

describe("cameraFormatLabelKey", () => {
  it("E3 (Round 2): maps 'other' to 'formatOther', with a vi.json label", () => {
    expect(cameraFormatLabelKey("other")).toBe("formatOther");
    expect(messages.catalogue.types.formatOther).toBeTruthy();
  });

  it("returns null for every literal format (rendered as-is) and for null/undefined", () => {
    expect(cameraFormatLabelKey("35mm")).toBeNull();
    expect(cameraFormatLabelKey("120")).toBeNull();
    expect(cameraFormatLabelKey(null)).toBeNull();
    expect(cameraFormatLabelKey(undefined)).toBeNull();
  });
});
