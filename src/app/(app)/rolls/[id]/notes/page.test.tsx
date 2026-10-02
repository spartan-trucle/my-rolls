import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getRoll = vi.hoisted(() => vi.fn());
const listRollNotesAction = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() => vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
}));
const NotesMemory = vi.hoisted(() => vi.fn(({ rollTitle, memory }: { rollTitle: string; memory: string | null }) => <div data-testid="notes">{`${rollTitle}|${memory}`}</div>));

vi.mock("@/features/rolls/actions", () => ({ getRoll }));
vi.mock("@/features/notes/actions", () => ({ listRollNotesAction }));
vi.mock("@/features/notes/components/NotesMemory", () => ({ NotesMemory }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string, v?: { number?: number }) => (key === "titleFallback" ? `Cuộn #${v?.number}` : key),
}));

import NotesPage from "./page";

describe("NotesPage", () => {
  it("renders the roll's memory and notes", async () => {
    getRoll.mockResolvedValue({ id: "r1", name: "Đà Lạt, tháng 10", number: 16, memory: "Đi Đà Lạt" });
    listRollNotesAction.mockResolvedValue([]);
    render(await NotesPage({ params: Promise.resolve({ id: "r1" }), searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("notes")).toHaveTextContent("Đà Lạt, tháng 10|Đi Đà Lạt");
    expect(listRollNotesAction).toHaveBeenCalledWith("r1");
  });

  it("404s for someone else's roll", async () => {
    getRoll.mockResolvedValue(null);
    await expect(NotesPage({ params: Promise.resolve({ id: "x" }), searchParams: Promise.resolve({}) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
