import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/vi.json";
import type { IRollEntry } from "@/features/rolls/core";
import { renderWithIntl as render } from "@/i18n/test-utils";

// `getTranslations` needs Next's request scope; the real messages through next-intl's own translator stand in.
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  return {
    getTranslations: async (namespace: "rolls.page" | "catalogue.types" | "frames" | "notes" | "mistakes") =>
      createTranslator({ locale: "vi", messages, namespace }),
  };
});

vi.mock("@/features/scan-sets/components/RollScans", () => ({
  RollScans: (props: {
    rollId: string;
    rollLabel: string;
    frameCount: number;
    rollPushPullThirds: number | null;
    scanSet: { id: string } | null;
    initialOpenUpload?: boolean;
  }) => (
    <div data-testid="upload-section">{`${props.rollId}|${props.rollLabel}|${props.frameCount}|${String(props.initialOpenUpload)}|${props.rollPushPullThirds}|${props.scanSet?.id ?? "none"}`}</div>
  ),
}));

// The header's canister editor (CAN-2) is a client component that refreshes the route after saving.
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

vi.mock("@/features/collection/components/RollViews", () => ({
  RollViews: (props: { rollId: string; frames: Array<{ id: string }>; view: string; filter: string; edgeText: string }) => (
    <div data-testid="frame-grid">{`${props.frames.map((f) => f.id).join(",")}|${props.view}|${props.filter}|${props.edgeText}`}</div>
  ),
}));

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
  });

  it("mounts the upload section for this roll, numbered after its frames (Phase 2 F1)", async () => {
    render(
      await RollPage({
        roll: makeRoll({ name: null, number: 16, frameCount: 12, boxIso: 200, shotIso: 400 }),
        openUpload: true,
        scanSet: { id: "set-1" } as never,
      }),
    );
    expect(screen.getByTestId("upload-section")).toHaveTextContent(`${makeRoll({}).id}|Cuộn #16|12|true|3|set-1`);
    expect(screen.queryByText("Sắp có")).not.toBeInTheDocument();
    expect(screen.queryAllByText("Chờ scan")).toHaveLength(0);
  });

  it("shows the frames grid and the frame, tấm ưng and oops counts once scans are in (RollFrames board)", async () => {
    const frames = [
      { id: "f1", isKeeper: true, isOops: false },
      { id: "f2", isKeeper: true, isOops: true },
      { id: "f3", isKeeper: false, isOops: false },
    ];
    render(await RollPage({ roll: makeRoll({ frameCount: 3 }), frames: frames as never }));
    expect(screen.getByTestId("frame-grid")).toHaveTextContent("f1,f2,f3|strip|all|GOLD 200 · CUỘN 16");
    expect(screen.getByText("3 tấm")).toBeInTheDocument();
    expect(screen.getByLabelText("2 tấm ưng")).toBeInTheDocument();
    expect(screen.getByLabelText("1 oops")).toBeInTheDocument();
  });

  it("shows the roll's frames in the view and filter it was given (COL-1, COL-2)", async () => {
    const frames = [{ id: "f1", isKeeper: false, isOops: false }];
    render(await RollPage({ roll: makeRoll({ frameCount: 1, number: 14 }), frames: frames as never, view: "grid", filter: "oops" }));
    expect(screen.getByTestId("frame-grid")).toHaveTextContent("f1|grid|oops|GOLD 200 · CUỘN 14");
  });

  it("previews the memory and the latest notes, linking to the notes page (NOTE-1)", async () => {
    const notes = [
      { id: "n1", body: "đo sáng vùng tối", frameId: null, framePosition: null, createdAt: new Date("2026-10-12T03:00:00Z"), updatedAt: new Date() },
    ];
    render(await RollPage({ roll: makeRoll({ memory: "Đi Đà Lạt với nhóm bạn" }), notes: notes as never }));
    expect(screen.getByText("Đi Đà Lạt với nhóm bạn")).toBeInTheDocument();
    expect(screen.getByText("đo sáng vùng tối")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ghi chú · 1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ Thêm ghi chú" })).toHaveAttribute("href", `/rolls/${makeRoll({}).id}/notes`);
  });

  it("stamps roll-level mistakes on the header (NOTE-2)", async () => {
    const mistakes = [
      { id: "m1", frameId: null, type: "wrong_iso", note: null },
      { id: "m2", frameId: "f1", type: "light_leak", note: null },
    ];
    render(await RollPage({ roll: makeRoll({}), mistakes: mistakes as never }));
    expect(screen.getByText("Sai ISO")).toBeInTheDocument();
    expect(screen.queryByText("Lọt sáng")).not.toBeInTheDocument();
  });

  it("has no frames section before any scans", async () => {
    render(await RollPage({ roll: makeRoll({}) }));
    expect(screen.queryByTestId("frame-grid")).not.toBeInTheDocument();
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

  it("R1: shows the just-saved banner only when justSaved is true", async () => {
    const { rerender } = render(await RollPage({ roll: makeRoll({}) }));
    expect(screen.queryByText("Đã lên kệ.")).not.toBeInTheDocument();

    rerender(await RollPage({ roll: makeRoll({}), justSaved: true }));
    expect(screen.getByText("Đã lên kệ.")).toBeInTheDocument();
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

  it("CAN-2: the header's canister is the canister editor's trigger", async () => {
    render(await RollPage({ roll: makeRoll({ name: "Đà Lạt" }) }));

    const trigger = screen.getByRole("button", { name: "Đổi vỏ cuộn" });
    expect(within(trigger).getByText("Đổi vỏ")).toBeInTheDocument();
    expect(trigger.closest("[aria-hidden='true']")).toBeNull();
  });
});
