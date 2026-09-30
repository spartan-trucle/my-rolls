import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/vi.json";
import type { IRollEntry } from "@/features/rolls/core";

// `getTranslations` needs Next's request scope; the real messages through next-intl's own translator stand in.
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  return {
    getTranslations: async (namespace: "rolls.page" | "catalogue.types" | "common") =>
      createTranslator({ locale: "vi", messages, namespace }),
  };
});

import { RollPage } from "./RollPage";

function makeRoll(overrides: Partial<IRollEntry>): IRollEntry {
  return {
    id: "roll-1",
    number: 16,
    name: null,
    canisterColor: "gold",
    boxIso: 200,
    shotIso: 200,
    exposures: 36,
    format: "35mm",
    locations: null,
    shotFrom: new Date("2025-10-12T12:00:00Z"),
    shotTo: null,
    datePrecision: "day",
    notes: null,
    memory: null,
    version: 1,
    createdAt: new Date("2025-10-12T12:00:00Z"),
    pushPull: "0",
    stock: { id: "stock-1", brand: "Kodak", name: "Gold 200", iso: 200, canisterColor: "gold", type: "color-negative" },
    camera: { brand: "Pentax", model: "K1000", type: "slr" },
    lens: null,
    ...overrides,
  };
}

describe("RollPage", () => {
  it("shows the stock, camera and \"chờ scan\" state", async () => {
    render(await RollPage({ roll: makeRoll({}) }));

    expect(screen.getByText("Kodak Gold 200 · Màu âm")).toBeInTheDocument();
    expect(screen.getByText("Pentax K1000 · Máy cơ SLR")).toBeInTheDocument();
    expect(screen.getAllByText("Chờ scan").length).toBeGreaterThan(0);
    expect(screen.getByText("Sắp có")).toBeInTheDocument();
  });

  it("R2/N1: an unnamed roll shows 'Cuộn #N' as its title and offers to name it", async () => {
    render(await RollPage({ roll: makeRoll({ name: null, number: 16 }) }));

    expect(screen.getByRole("heading", { name: "Cuộn #16" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đặt tên cho cuộn" })).toHaveAttribute("href", "/rolls/roll-1/edit");
  });

  it("an unnamed roll shows its number once — no 'Cuộn N' kicker over 'Cuộn #N'", async () => {
    render(await RollPage({ roll: makeRoll({ name: null, number: 3 }) }));

    expect(screen.getByRole("heading", { name: "Cuộn #3" })).toBeInTheDocument();
    expect(screen.queryByText("Cuộn 3")).toBeNull();
  });

  it("a named roll keeps its number as the kicker", async () => {
    render(await RollPage({ roll: makeRoll({ name: "Đà Lạt mùa mưa", number: 3 }) }));

    expect(screen.getByRole("heading", { name: "Đà Lạt mùa mưa" })).toBeInTheDocument();
    expect(screen.getByText("Cuộn 3")).toBeInTheDocument();
  });

  it("links back to the shelf once, from the top — no second 'Về kệ' button", async () => {
    render(await RollPage({ roll: makeRoll({}) }));

    expect(screen.getByRole("link", { name: "‹ Kệ" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: "Về kệ" })).toBeNull();
  });

  it("R1: shows the just-saved toast only when justSaved is true", async () => {
    const { rerender } = render(await RollPage({ roll: makeRoll({}) }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    rerender(await RollPage({ roll: makeRoll({}), justSaved: true }));
    expect(screen.getByRole("status")).toHaveTextContent("Đã lên kệ.");
  });

  it("R4: links to the edit route from the details heading", async () => {
    render(await RollPage({ roll: makeRoll({}) }));

    const editLinks = screen.getAllByRole("link", { name: "Sửa" });
    expect(editLinks.some((link) => link.getAttribute("href") === "/rolls/roll-1/edit")).toBe(true);
  });

  it("shows the stock and camera type as a Vietnamese label, never the raw slug", async () => {
    render(await RollPage({ roll: makeRoll({}) }));

    expect(screen.queryByText(/color-negative/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bslr\b/)).not.toBeInTheDocument();
  });

  it("falls back to just brand and name when the type is unknown or missing", async () => {
    render(
      await RollPage({
        roll: makeRoll({
          stock: { id: "stock-1", brand: "Kodak", name: "Gold 200", iso: 200, canisterColor: "gold", type: null },
          camera: { brand: "Pentax", model: "K1000", type: null },
        }),
      }),
    );

    expect(screen.getAllByText("Kodak Gold 200").length).toBeGreaterThan(0);
    expect(screen.getByText("Pentax K1000")).toBeInTheDocument();
  });

  it("shows the roll's own name, falling back to the stock's name otherwise", async () => {
    render(await RollPage({ roll: makeRoll({ name: "Đà Lạt" }) }));

    expect(screen.getByRole("heading", { name: "Đà Lạt" })).toBeInTheDocument();
  });

  it("shows the push/pull badge when it isn't 0 (R8: 'Đẩy +1', not just '+1')", async () => {
    render(await RollPage({ roll: makeRoll({ boxIso: 200, shotIso: 400, pushPull: "+1" }) }));

    expect(screen.getByText("Đẩy +1")).toBeInTheDocument();
  });

  it("R8: a pull shows 'Kéo', not 'Đẩy'", async () => {
    render(await RollPage({ roll: makeRoll({ boxIso: 400, shotIso: 200, pushPull: "−1" }) }));

    expect(screen.getByText("Kéo −1")).toBeInTheDocument();
  });

  it("shows shot-from and shot-to dates, formatted dd.mm.yy", async () => {
    render(
      await RollPage({
        roll: makeRoll({ shotFrom: new Date("2025-10-12T12:00:00Z"), shotTo: new Date("2025-10-20T12:00:00Z") }),
      }),
    );

    expect(screen.getByText("12.10.25")).toBeInTheDocument();
    expect(screen.getByText("20.10.25")).toBeInTheDocument();
  });
});
