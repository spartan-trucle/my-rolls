import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const RollForm = vi.hoisted(() => vi.fn(({ mode }: { mode: string }) => <div data-testid="roll-form">{mode}</div>));

vi.mock("@/features/rolls/components/RollForm", () => ({ RollForm }));

import NewRollPage from "./page";

describe("NewRollPage", () => {
  it("renders RollForm in \"new\" mode by default", async () => {
    render(await NewRollPage({ params: Promise.resolve({}), searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("roll-form")).toHaveTextContent("new");
  });

  it("renders RollForm in \"past\" mode for ?mode=past", async () => {
    render(await NewRollPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ mode: "past" }) }));

    expect(screen.getByTestId("roll-form")).toHaveTextContent("past");
  });

  it("treats any other mode value as \"new\"", async () => {
    render(await NewRollPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ mode: "whatever" }) }));

    expect(screen.getByTestId("roll-form")).toHaveTextContent("new");
  });
});
