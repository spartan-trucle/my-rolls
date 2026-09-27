import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Canister } from "./Canister";

describe("Canister", () => {
  it("prints the ISO on the label band", () => {
    render(<Canister color="green" iso={400} />);
    expect(screen.getByText("400")).toBeInTheDocument();
  });

  it("renders no label text when iso is null", () => {
    const { container } = render(<Canister color="gold" iso={null} />);
    expect(container.querySelector("span")?.textContent).toBe("");
  });

  it("falls back to the gold stock colour when color is null", () => {
    const { container } = render(<Canister color={null} iso={200} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--rc-stock")).toBe("var(--stock-gold)");
  });
});
