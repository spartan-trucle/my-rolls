import { describe, expect, it } from "vitest";
import type { IRollEntry } from "@/features/rolls/core";
import { toCanisterProps } from "./to-canister-props";

const base: IRollEntry = {
  id: "roll-1",
  number: 7,
  name: "Đà Lạt, tháng 10",
  canisterColor: "gold",
  canisterStyle: "stock",
  boxIso: 200,
  shotIso: 200,
  exposures: 36,
  format: "35mm",
  locations: null,
  shotFrom: null,
  shotTo: null,
  memory: null,
  version: 1,
  createdAt: new Date("2025-10-12T12:00:00Z"),
  pushPull: "0",
  stock: { id: "s", brand: "Kodak", name: "Gold 200", iso: 200, canisterColor: "green", canisterPhotoUrl: null, type: "color-negative" },
  camera: null,
  lens: null,
};

describe("toCanisterProps (CAN-2)", () => {
  it("passes a drawn roll's own hex through as the raw colour", () => {
    const props = toCanisterProps({ ...base, canisterStyle: "drawn", canisterColor: "#a1b2c3" }, "Cuộn #7");
    expect(props).toEqual({ size: "shelf", color: "#a1b2c3", label: "Đà Lạt, tháng 10", sticker: "C-41 · 200", photoSrc: undefined });
  });

  it("falls back to the stock's colour when a drawn roll's colour is unsafe", () => {
    expect(toCanisterProps({ ...base, canisterStyle: "drawn", canisterColor: "red;x" }, "x").color).toBe("green");
  });

  it("uses the stock's family slug for the stock style, never a var(…) string", () => {
    expect(toCanisterProps(base, "x").color).toBe("green");
  });

  it("uses the roll's colour when the stock has none", () => {
    const entry = { ...base, canisterColor: "rose", stock: { ...base.stock!, canisterColor: null } };
    expect(toCanisterProps(entry, "x").color).toBe("rose");
  });

  it("gives the photo style no photoSrc when the stock has no photo", () => {
    const props = toCanisterProps({ ...base, canisterStyle: "photo" }, "x");
    expect(props.photoSrc).toBeUndefined();
    expect(props.color).toBe("green");
  });

  it("shows the stock's photo for the photo style", () => {
    const entry = { ...base, canisterStyle: "photo" as const, stock: { ...base.stock!, canisterPhotoUrl: "https://img/c.webp" } };
    expect(toCanisterProps(entry, "x").photoSrc).toBe("https://img/c.webp");
  });

  it("labels an unnamed roll with the caller's fallback and builds the sticker from the stock ISO when the box ISO is missing", () => {
    const props = toCanisterProps({ ...base, name: null, boxIso: null, stock: { ...base.stock!, iso: 400, type: "bw" } }, "Cuộn #7");
    expect(props.label).toBe("Cuộn #7");
    expect(props.sticker).toBe("B&W · 400");
  });

  it("draws gold with no sticker for a roll with no stock", () => {
    const props = toCanisterProps({ ...base, canisterColor: null, boxIso: null, stock: null }, "x");
    expect(props.color).toBeNull();
    expect(props.sticker).toBeNull();
  });
});
