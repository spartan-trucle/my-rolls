import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/vi.json";
import type { IRollEntry } from "@/features/rolls/core";

// `getTranslations` needs Next's request scope; the real messages through next-intl's own translator stand in.
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  return {
    getTranslations: async (namespace: "rolls.page") => createTranslator({ locale: "vi", messages, namespace }),
  };
});

import { RollPage } from "./RollPage";

function makeRoll(overrides: Partial<IRollEntry>): IRollEntry {
  return {
    id: "roll-1",
    name: null,
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
    ...overrides,
  };
}

describe("RollPage", () => {
  it("shows the stock, camera and \"chờ scan\" state", async () => {
    render(await RollPage({ roll: makeRoll({}) }));

    expect(screen.getByRole("heading", { name: "Kodak Gold 200" })).toBeInTheDocument();
    expect(screen.getAllByText("Kodak Gold 200").length).toBeGreaterThan(0);
    expect(screen.getByText("Pentax K1000")).toBeInTheDocument();
    expect(screen.getAllByText("Chờ scan").length).toBeGreaterThan(0);
    expect(screen.getByText("Sắp có")).toBeInTheDocument();
  });

  it("shows the roll's own name, falling back to the stock's name otherwise", async () => {
    render(await RollPage({ roll: makeRoll({ name: "Đà Lạt" }) }));

    expect(screen.getByRole("heading", { name: "Đà Lạt" })).toBeInTheDocument();
  });

  it("shows the push/pull badge when it isn't 0", async () => {
    render(await RollPage({ roll: makeRoll({ boxIso: 200, shotIso: 400, pushPull: "+1" }) }));

    expect(screen.getByText("+1")).toBeInTheDocument();
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
