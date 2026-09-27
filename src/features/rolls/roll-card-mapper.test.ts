import { describe, expect, it } from "vitest";
import type { IRollEntry } from "./core";
import { toRollCardProps } from "./roll-card-mapper";

const baseEntry: IRollEntry = {
  id: "roll-1",
  name: "Đà Lạt, tháng 10",
  canisterColor: "gold",
  boxIso: 200,
  shotIso: 200,
  exposures: 36,
  format: "35mm",
  locations: null,
  shotFrom: new Date("2025-10-12T12:00:00Z"),
  shotTo: null,
  notes: null,
  memory: null,
  version: 1,
  createdAt: new Date("2025-10-12T12:00:00Z"),
  pushPull: "0",
  stock: { id: "stock-1", brand: "Kodak", name: "Gold 200", iso: 200, canisterColor: "gold" },
  camera: { brand: "Pentax", model: "K1000" },
  lens: null,
};

describe("toRollCardProps", () => {
  it("maps a full roll to RollCard props", () => {
    expect(toRollCardProps(baseEntry)).toEqual({
      href: "/rolls/roll-1",
      name: "Đà Lạt, tháng 10",
      stock: "gold",
      iso: 200,
      film: "Kodak Gold 200",
      exposures: 36,
      camera: "Pentax K1000",
      date: "12.10.25",
    });
  });

  it("falls back to the stock's name when the roll has no name", () => {
    const entry = { ...baseEntry, name: null };
    expect(toRollCardProps(entry).name).toBe("Kodak Gold 200");
  });

  it("falls back to the gold canister for an unknown or missing canister colour", () => {
    expect(toRollCardProps({ ...baseEntry, canisterColor: null }).stock).toBeUndefined();
    expect(toRollCardProps({ ...baseEntry, canisterColor: "chartreuse" }).stock).toBeUndefined();
  });

  it("leaves out camera and film when there's no stock or camera joined", () => {
    const entry = { ...baseEntry, name: "Cuộn bí ẩn", boxIso: null, stock: null, camera: null };
    const props = toRollCardProps(entry);
    expect(props.film).toBeUndefined();
    expect(props.camera).toBeUndefined();
    expect(props.iso).toBeUndefined();
  });
});
