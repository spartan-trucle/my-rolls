import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getRoll = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() => vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }));
const RollPage = vi.hoisted(() => vi.fn(({ roll }: { roll: { id: string } }) => <div data-testid="roll-page">{roll.id}</div>));

vi.mock("@/features/rolls/actions", () => ({ getRoll }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/features/rolls/components/RollPage", () => ({ RollPage }));

import RollDetailPage from "./page";

describe("RollDetailPage", () => {
  it("renders RollPage with the fetched roll", async () => {
    getRoll.mockResolvedValue({ id: "roll-1" });

    render(
      await RollDetailPage({ params: Promise.resolve({ id: "roll-1" }), searchParams: Promise.resolve({}) }),
    );

    expect(getRoll).toHaveBeenCalledWith("roll-1");
    expect(screen.getByTestId("roll-page")).toHaveTextContent("roll-1");
  });

  it("404s for a missing or another user's roll", async () => {
    getRoll.mockResolvedValue(null);

    await expect(
      RollDetailPage({ params: Promise.resolve({ id: "missing" }), searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
