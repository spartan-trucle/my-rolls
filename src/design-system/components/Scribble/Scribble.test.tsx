import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Scribble } from "./Scribble";
import styles from "./Scribble.module.css";

describe("Scribble", () => {
  it("renders the note with no arrow by default", () => {
    const { container } = render(<Scribble>hở sáng chỗ này</Scribble>);
    expect(screen.getByText("hở sáng chỗ này")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass(styles.scribble);
  });

  it("draws a decorative arrow after the text for right and down", () => {
    const { container } = render(<Scribble arrow="right">nhìn nè</Scribble>);
    const root = container.firstElementChild!;
    expect(root.lastElementChild?.tagName.toLowerCase()).toBe("svg");
    expect(root.lastElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("draws the arrow before the text for left", () => {
    const { container } = render(<Scribble arrow="left">nhìn nè</Scribble>);
    const root = container.firstElementChild!;
    expect(root).toHaveClass(styles.left);
    expect(root.firstElementChild?.tagName.toLowerCase()).toBe("svg");
  });

  it("takes the down arrow, pin tone and small size", () => {
    const { container } = render(<Scribble arrow="down" tone="pin" size="sm">chớp mắt</Scribble>);
    expect(container.firstElementChild).toHaveClass(styles.down, styles.pin, styles.sm);
  });
});
