import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, ButtonLink } from "./Button";
import styles from "./Button.module.css";

describe("Button", () => {
  it("is a type=button outline button named by its children", () => {
    render(<Button>Tải cuộn lên</Button>);
    const button = screen.getByRole("button", { name: "Tải cuộn lên" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass(styles.button, styles.outline);
  });

  it("takes a variant and a size", () => {
    render(<Button variant="primary" size="sm">Chia sẻ</Button>);
    expect(screen.getByRole("button")).toHaveClass(styles.primary, styles.sm);
  });

  it("keeps an explicit type", () => {
    render(<Button type="submit">Lưu</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("puts a decorative icon before the label", () => {
    render(<Button icon="upload">Tải lên</Button>);
    const button = screen.getByRole("button", { name: "Tải lên" });
    expect(button.firstElementChild?.tagName.toLowerCase()).toBe("svg");
    expect(button.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(button).not.toHaveClass(styles.iconOnly);
  });

  it("becomes a square icon-only button named by aria-label", () => {
    render(<Button icon="share" aria-label="Chia sẻ" />);
    expect(screen.getByRole("button", { name: "Chia sẻ" })).toHaveClass(styles.iconOnly);
  });

  it("shrinks the icon to 18px in the small size", () => {
    const { container } = render(<Button icon="share" aria-label="Chia sẻ" size="sm" />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "18");
  });

  it("calls onClick, and not when disabled", async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Lưu</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<Button onClick={onClick} disabled>Lưu</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("requires aria-label on icon-only buttons (type check)", () => {
    // @ts-expect-error an icon-only button needs an aria-label
    render(<Button icon="share" />);
  });
});

describe("ButtonLink", () => {
  it("is a link with the button's classes, outline by default", () => {
    render(<ButtonLink href="/sign-up">Đăng ký</ButtonLink>);
    const link = screen.getByRole("link", { name: "Đăng ký" });
    expect(link).toHaveAttribute("href", "/sign-up");
    expect(link).toHaveClass(styles.button, styles.outline);
  });

  it("takes a variant, a size and a decorative icon", () => {
    render(<ButtonLink href="/sign-up" variant="primary" size="sm" icon="upload">Bắt đầu</ButtonLink>);
    const link = screen.getByRole("link", { name: "Bắt đầu" });
    expect(link).toHaveClass(styles.primary, styles.sm);
    expect(link.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(link.firstElementChild).toHaveAttribute("width", "18");
  });
});
