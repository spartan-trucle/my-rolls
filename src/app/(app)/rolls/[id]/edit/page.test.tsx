import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getRoll = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() => vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }));
const RollForm = vi.hoisted(() =>
  vi.fn(({ mode, roll }: { mode: string; roll: { id: string } }) => <div data-testid="roll-form">{mode}:{roll.id}</div>),
);

vi.mock("@/features/rolls/actions", () => ({ getRoll }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/features/rolls/components/RollForm", () => ({ RollForm }));

import EditRollPage from "./page";

describe("EditRollPage", () => {
  it("renders RollForm in past mode when the roll has any dates", async () => {
    getRoll.mockResolvedValue({ id: "roll-1", shotFrom: new Date("2026-09-01"), datePrecision: "day" });

    render(await EditRollPage({ params: Promise.resolve({ id: "roll-1" }), searchParams: Promise.resolve({}) }));

    expect(getRoll).toHaveBeenCalledWith("roll-1");
    expect(screen.getByTestId("roll-form")).toHaveTextContent("past:roll-1");
  });

  it("renders RollForm in new mode when the roll has no dates at all", async () => {
    getRoll.mockResolvedValue({ id: "roll-2", shotFrom: null, datePrecision: null });

    render(await EditRollPage({ params: Promise.resolve({ id: "roll-2" }), searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("roll-form")).toHaveTextContent("new:roll-2");
  });

  it("404s for a missing or another user's roll", async () => {
    getRoll.mockResolvedValue(null);

    await expect(EditRollPage({ params: Promise.resolve({ id: "missing" }), searchParams: Promise.resolve({}) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
