import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import { BagCanisterStrip } from "./BagCanisterStrip";

describe("BagCanisterStrip", () => {
  it("renders nothing when there are no unloaded rolls", () => {
    const { container } = renderWithIntl(<BagCanisterStrip canisters={[]} unloadedRolls={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("draws one canister per unloaded roll, across stocks", () => {
    renderWithIntl(
      <BagCanisterStrip
        canisters={[
          { stockId: "s1", canisterColor: "gold", iso: 200, qty: 3 },
          { stockId: "s2", canisterColor: "green", iso: 400, qty: 2 },
        ]}
        unloadedRolls={5}
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("shows the '5 cuộn chờ nạp' note", () => {
    renderWithIntl(
      <BagCanisterStrip canisters={[{ stockId: "s1", canisterColor: "gold", iso: 200, qty: 5 }]} unloadedRolls={5} />,
    );

    expect(screen.getByText("5 cuộn chờ nạp")).toBeInTheDocument();
  });
});
