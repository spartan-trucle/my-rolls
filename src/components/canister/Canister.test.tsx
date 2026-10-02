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

  it("draws a custom hex body and the roll name on a light label band", () => {
    const { container } = render(<Canister color="#a1b2c3" size="shelf" label="Đà Lạt, tháng 10" sticker="C-41 · 200" />);
    const can = container.firstElementChild as HTMLElement;
    expect(can.style.getPropertyValue("--rc-stock")).toBe("#a1b2c3");
    expect(screen.getByText("Đà Lạt, tháng 10")).toBeInTheDocument();
    expect(screen.getByText("C-41 · 200")).toBeInTheDocument();
  });

  it("never writes an unsafe colour into the style (Review Focus 4)", () => {
    const { container } = render(<Canister color={"red;background:url(x)"} />);
    expect((container.firstElementChild as HTMLElement).getAttribute("style")).not.toContain("url(");
  });

  it("shows the catalogue photo instead of the drawing when given one", () => {
    render(<Canister color="gold" size="shelf" photoSrc="https://img/c.webp" label="Hội An" />);
    expect(document.querySelector("img")?.getAttribute("src")).toBe("https://img/c.webp");
    expect(screen.queryByText("Hội An")).not.toBeInTheDocument();
  });

  it("keeps today's small canister for the bag strip (no label, ISO on the band)", () => {
    render(<Canister color="mono" iso={400} label="ignored on sm" />);
    expect(screen.getByText("400")).toBeInTheDocument();
    expect(screen.queryByText("ignored on sm")).not.toBeInTheDocument();
  });

  it("is decorative: the whole drawing is hidden from assistive tech", () => {
    const { container } = render(<Canister color="gold" size="shelf" label="Hội An" sticker="C-41 · 400" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
