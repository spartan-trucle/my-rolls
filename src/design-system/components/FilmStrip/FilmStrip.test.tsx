import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilmStrip, type FilmFrame } from "./FilmStrip";
import styles from "./FilmStrip.module.css";

const labels = { strip: "Dải phim cuộn 14", keeper: "Tấm ưng", oops: "Oops" };
const frames: FilmFrame[] = [
  { src: "/1.webp", alt: "Chợ Đà Lạt buổi sáng" },
  { src: "/2.webp", alt: "Hồ Xuân Hương", flag: "keeper" },
  { alt: "Khung 3, trống" },
  { src: "/4.webp", alt: "Hở sáng", number: "4A", flag: "oops" },
];

describe("FilmStrip", () => {
  it("is a named list with one item per frame", () => {
    render(<FilmStrip frames={frames} labels={labels} />);
    const list = screen.getByRole("list", { name: labels.strip });
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
  });

  it("renders the named list as its root, with no landmark of its own (R20: the landing page styles `> div > ul`)", () => {
    const { container } = render(<FilmStrip frames={frames} labels={labels} />);
    expect(container.firstElementChild?.tagName).toBe("UL");
    expect(container.firstElementChild).toHaveAttribute("aria-label", labels.strip);
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("hands a frame's click to onClick, so the caller knows which button opened it", async () => {
    let seen: EventTarget | null = null;
    render(<FilmStrip frames={[{ ...frames[0], onClick: (e) => (seen = e.currentTarget) }]} labels={labels} />);
    const button = screen.getByRole("button", { name: "Chợ Đà Lạt buổi sáng" });
    await userEvent.click(button);
    expect(seen).toBe(button);
  });

  it("shows scans with their alt and blank frames as a named image", () => {
    render(<FilmStrip frames={frames} labels={labels} />);
    expect(screen.getByRole("img", { name: "Chợ Đà Lạt buổi sáng" })).toHaveAttribute("src", "/1.webp");
    expect(screen.getByRole("img", { name: "Khung 3, trống" })).toHaveClass(styles.blank);
  });

  it("flags keepers and oops with labelled stamps", () => {
    render(<FilmStrip frames={frames} labels={labels} />);
    expect(screen.getByRole("img", { name: "Tấm ưng" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Oops" })).toBeInTheDocument();
  });

  it("prints frame numbers on the edge, defaulting to position", () => {
    const { container } = render(<FilmStrip frames={frames} labels={labels} edgeText="COLOR 200 · ROLL 14" />);
    const edges = container.querySelectorAll(`.${styles.edge}`);
    expect(edges[0]).toHaveTextContent("1▸1A");
    expect(edges[6]).toHaveTextContent("4A▸4AA");
    expect(edges[1]).toHaveTextContent("COLOR 200 · ROLL 14");
    expect(edges[0]).toHaveAttribute("aria-hidden", "true");
  });

  it("sizes frames and sprocket holes from frameWidth", () => {
    const { container } = render(<FilmStrip frames={[frames[0]]} labels={labels} frameWidth={150} />);
    expect(screen.getByRole("list").style.getPropertyValue("--rc-frame-w")).toBe("150px");
    // max(4, round(150 / 24)) = 6 holes per rail, two rails
    expect(container.querySelectorAll(`.${styles.hole}`)).toHaveLength(12);
  });

  it("makes a frame with onClick a button named by its alt", async () => {
    const onClick = vi.fn();
    render(<FilmStrip frames={[{ ...frames[0], onClick }]} labels={labels} />);
    await userEvent.click(screen.getByRole("button", { name: "Chợ Đà Lạt buổi sáng" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("has no buttons when no frame is clickable", () => {
    render(<FilmStrip frames={frames} labels={labels} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
