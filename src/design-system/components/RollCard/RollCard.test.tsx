import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RollCard } from "./RollCard";
import styles from "./RollCard.module.css";

const roll = {
  name: "Đà Lạt, cuộn tháng 10",
  stock: "green" as const,
  iso: 400,
  film: "Portra 400",
  exposures: 36,
  camera: "Nikon FM2",
  date: "12.10.25",
};

describe("RollCard", () => {
  it("shows the name and film data, with exposures once as EXP", () => {
    render(<RollCard {...roll} />);
    expect(screen.getByText(roll.name)).toHaveClass(styles.name);
    expect(screen.getByText("Portra 400 · ISO 400 · 36 EXP")).toHaveClass(styles.meta);
    expect(screen.getByText("Nikon FM2 · 12.10.25")).toHaveClass(styles.meta);
  });

  it("leaves out missing meta parts", () => {
    render(<RollCard name="Cuộn bí ẩn" iso={200} />);
    expect(screen.getByText("ISO 200")).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });

  it("draws a decorative canister in the stock colour with the ISO on its label", () => {
    const { container } = render(<RollCard {...roll} />);
    const can = container.querySelector(`.${styles.can}`) as HTMLElement;
    expect(can).toHaveAttribute("aria-hidden", "true");
    expect(can.style.getPropertyValue("--rc-stock")).toBe("var(--stock-green)");
    expect(can).toHaveTextContent("400");
  });

  it("defaults to the gold canister", () => {
    const { container } = render(<RollCard name="Cuộn" />);
    const can = container.querySelector(`.${styles.can}`) as HTMLElement;
    expect(can.style.getPropertyValue("--rc-stock")).toBe("var(--stock-gold)");
  });

  it("shows oops and keeper counts as labelled stamps", () => {
    render(<RollCard {...roll} oops={{ count: 3, label: "3 oops" }} keepers={{ count: 5, label: "5 tấm ưng" }} />);
    expect(screen.getByRole("img", { name: "3 oops" })).toHaveTextContent("3");
    expect(screen.getByRole("img", { name: "5 tấm ưng" })).toHaveTextContent("5");
  });

  it("becomes a link when given href", () => {
    render(<RollCard {...roll} href="/rolls/14" />);
    const link = screen.getByRole("link", { name: /Đà Lạt, cuộn tháng 10/ });
    expect(link).toHaveAttribute("href", "/rolls/14");
    expect(link).toHaveClass(styles.card);
  });

  it("is not a link without href", () => {
    render(<RollCard {...roll} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
