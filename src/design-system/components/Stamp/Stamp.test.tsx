import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stamp } from "./Stamp";
import styles from "./Stamp.module.css";

describe("Stamp", () => {
  it("renders a neutral text stamp", () => {
    render(<Stamp>ISO 400</Stamp>);
    expect(screen.getByText("ISO 400")).toHaveClass(styles.stamp, styles.neutral);
  });

  it("takes a tone, solid and tilt", () => {
    render(<Stamp tone="oops" solid tilt>oops</Stamp>);
    expect(screen.getByText("oops")).toHaveClass(styles.oops, styles.solid, styles.tilt);
  });

  it("names an icon + number stamp by its label, so the number isn't read alone", () => {
    render(<Stamp tone="keeper" icon="keeper" label="5 tấm ưng">5</Stamp>);
    const stamp = screen.getByRole("img", { name: "5 tấm ưng" });
    expect(stamp).toHaveClass(styles.keeper, styles.hasIcon);
    expect(stamp).toHaveAttribute("title", "5 tấm ưng");
    expect(stamp.querySelector("svg")).toHaveAttribute("width", "14");
  });

  it("requires a label on icon stamps (type check)", () => {
    // @ts-expect-error an icon stamp needs a label
    render(<Stamp icon="oops">3</Stamp>);
  });
});
