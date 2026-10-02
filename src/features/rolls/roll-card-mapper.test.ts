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
  memory: null,
  version: 1,
  createdAt: new Date("2025-10-12T12:00:00Z"),
  pushPull: "0",
  stock: { id: "stock-1", brand: "Kodak", name: "Gold 200", iso: 200, canisterColor: "gold", type: null },
  camera: { brand: "Pentax", model: "K1000", type: null },
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

  it("falls back to the stock's name when the roll has no name and no unnamedRollLabel was given (no roll number)", () => {
    const entry = { ...baseEntry, name: null };
    expect(toRollCardProps(entry).name).toBe("Kodak Gold 200");
  });

  it("N1: reads 'Cuộn #{number}' for an unnamed roll when the caller passes unnamedRollLabel", () => {
    const entry = { ...baseEntry, name: null, number: 16 };
    expect(toRollCardProps(entry, { unnamedRollLabel: "Cuộn #16" }).name).toBe("Cuộn #16");
  });

  it("prefers a real name over unnamedRollLabel", () => {
    const entry = { ...baseEntry, number: 16 };
    expect(toRollCardProps(entry, { unnamedRollLabel: "Cuộn #16" }).name).toBe("Đà Lạt, tháng 10");
  });

  it("R2-4: formats the date at month precision via formatRollDate's second argument", () => {
    const entry = {
      ...baseEntry,
      shotFrom: new Date("2025-10-01T00:00:00Z"),
      datePrecision: "month" as const,
    };
    expect(toRollCardProps(entry).date).toBe("10.2025");
  });

  it("falls back to the gold canister for an unknown or missing canister colour", () => {
    expect(toRollCardProps({ ...baseEntry, canisterColor: null }).stock).toBeUndefined();
    expect(toRollCardProps({ ...baseEntry, canisterColor: "chartreuse" }).stock).toBeUndefined();
  });

  it("folds a non-zero push/pull into the date, since RollCard has no badge slot of its own", () => {
    expect(toRollCardProps({ ...baseEntry, pushPull: "+1" }).date).toBe("12.10.25 · +1");
    expect(toRollCardProps({ ...baseEntry, pushPull: "−⅓" }).date).toBe("12.10.25 · −⅓");
  });

  it("leaves the date alone at 0 stops (nothing to flag) or when push/pull can't be computed", () => {
    expect(toRollCardProps({ ...baseEntry, pushPull: "0" }).date).toBe("12.10.25");
    expect(toRollCardProps({ ...baseEntry, pushPull: null }).date).toBe("12.10.25");
  });

  it("leaves out camera and film when there's no stock or camera joined", () => {
    const entry = { ...baseEntry, name: "Cuộn bí ẩn", boxIso: null, stock: null, camera: null };
    const props = toRollCardProps(entry);
    expect(props.film).toBeUndefined();
    expect(props.camera).toBeUndefined();
    expect(props.iso).toBeUndefined();
  });
});
