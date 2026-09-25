import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "./Icon";
import { ICON_NAMES, ICON_PATHS } from "./icons";

describe("Icon", () => {
  it("has the eleven artifact icons", () => {
    expect(ICON_NAMES).toEqual([
      "roll", "film", "camera", "print", "keeper", "oops", "friends", "share", "upload", "note", "menu",
    ]);
  });

  it("is hidden from assistive tech when it has no label", () => {
    const { container } = render(<Icon name="share" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("is announced as an image when labelled", () => {
    render(<Icon name="keeper" label="Tấm ưng" />);
    expect(screen.getByRole("img", { name: "Tấm ưng" })).toBeInTheDocument();
  });

  it("defaults to 20px and takes a size", () => {
    const { container, rerender } = render(<Icon name="film" />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "20");
    rerender(<Icon name="film" size={14} />);
    expect(container.querySelector("svg")).toHaveAttribute("height", "14");
  });

  it("draws the artifact paths in currentColor with a 1.75 stroke", () => {
    const { container } = render(<Icon name="roll" />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("stroke-width", "1.75");
    expect(svg.querySelectorAll("path")).toHaveLength(ICON_PATHS.roll.length);
  });
});
