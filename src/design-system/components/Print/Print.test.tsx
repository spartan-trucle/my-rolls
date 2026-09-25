import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Print } from "./Print";
import styles from "./Print.module.css";

const photo = { src: "/p.webp", alt: "Đồi thông lúc bình minh" };

describe("Print", () => {
  it("is a figure with the photo, 240px wide at 3/2 by default", () => {
    const { container } = render(<Print {...photo} />);
    const figure = container.querySelector("figure")!;
    expect(figure).toHaveClass(styles.print, styles.classic);
    expect(figure).toHaveStyle({ width: "240px" });
    const img = screen.getByRole("img", { name: photo.alt });
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveStyle({ aspectRatio: "3/2" });
  });

  it("takes a width, aspect and tilt", () => {
    const { container } = render(<Print {...photo} width="100%" aspect="2/3" tilt="left" />);
    const figure = container.querySelector("figure")!;
    expect(figure).toHaveStyle({ width: "100%" });
    expect(figure.style.getPropertyValue("--rc-tilt")).toBe("var(--tilt-left)");
    expect(screen.getByRole("img")).toHaveStyle({ aspectRatio: "2/3" });
  });

  it("writes the caption and date on the border", () => {
    render(<Print {...photo} caption="đồi thông, 5:40 sáng" date="12.10.25" />);
    expect(screen.getByText("đồi thông, 5:40 sáng")).toHaveClass(styles.caption);
    expect(screen.getByText("12.10.25")).toHaveClass(styles.date);
  });

  it("writes an oops caption in red pen", () => {
    render(<Print {...photo} caption="chớp mắt" oops />);
    expect(screen.getByText("chớp mắt")).toHaveClass(styles.oopsCaption);
  });

  it("keeps the instant border even with no caption, and drops it when borderless", () => {
    const { container, rerender } = render(<Print {...photo} format="instant" />);
    expect(container.querySelector(`.${styles.foot}`)).toBeInTheDocument();
    rerender(<Print {...photo} format="borderless" caption="bị cắt" />);
    expect(container.querySelector(`.${styles.foot}`)).not.toBeInTheDocument();
    expect(screen.queryByText("bị cắt")).not.toBeInTheDocument();
  });

  it.each([
    ["tape", styles.tape],
    ["tape-corner", styles.tapeCorner],
    ["pin", styles.pin],
  ] as const)("attaches with %s as decoration", (attach, cls) => {
    const { container } = render(<Print {...photo} attach={attach} />);
    const deco = container.querySelector(`.${cls}`);
    expect(deco).toHaveAttribute("aria-hidden", "true");
  });
});
