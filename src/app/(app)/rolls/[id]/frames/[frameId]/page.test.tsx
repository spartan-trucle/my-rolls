import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getRoll = vi.hoisted(() => vi.fn());
const listRollFramesAction = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() => vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
}));
const FrameView = vi.hoisted(() =>
  vi.fn(({ index, rollLabel }: { index: number; rollLabel: string }) => <div data-testid="frame-view">{`${index}|${rollLabel}`}</div>),
);

vi.mock("@/features/rolls/actions", () => ({ getRoll }));
vi.mock("@/features/frames/actions", () => ({ listRollFramesAction }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/features/frames/components/FrameView", () => ({ FrameView }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string, values?: { number?: number }) => (key === "titleFallback" ? `Cuộn #${values?.number}` : key),
}));

import FramePage from "./page";

const params = (frameId: string) => ({ params: Promise.resolve({ id: "r1", frameId }), searchParams: Promise.resolve({}) });

describe("FramePage", () => {
  it("renders the frame at its index in the roll's frames", async () => {
    getRoll.mockResolvedValue({ id: "r1", name: null, number: 16 });
    listRollFramesAction.mockResolvedValue([{ id: "f1" }, { id: "f2" }]);
    render(await FramePage(params("f2")));
    expect(listRollFramesAction).toHaveBeenCalledWith("r1");
    expect(screen.getByTestId("frame-view")).toHaveTextContent("1|Cuộn #16");
  });

  it("404s for a frame not on this roll, or a roll that isn't the caller's", async () => {
    getRoll.mockResolvedValue({ id: "r1", name: "Đà Lạt", number: 16 });
    listRollFramesAction.mockResolvedValue([{ id: "f1" }]);
    await expect(FramePage(params("f9"))).rejects.toThrow("NEXT_NOT_FOUND");
    getRoll.mockResolvedValue(null);
    await expect(FramePage(params("f1"))).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
