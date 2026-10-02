import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import { ViewSwitch } from "./ViewSwitch";

vi.mock("../actions", () => ({ rememberViewAction: vi.fn() }));

// jsdom can't navigate; stop the link's default action once React has seen the click.
const stopNavigation = (event: MouseEvent) => event.preventDefault();

describe("ViewSwitch (COL-1, COL-3, plan D7)", () => {
  beforeEach(() => document.addEventListener("click", stopNavigation));
  afterEach(() => document.removeEventListener("click", stopNavigation));

  it("marks the current view and remembers the one picked", async () => {
    const remember = vi.fn().mockResolvedValue(undefined);
    render(<ViewSwitch surface="library" current="shelf" hrefs={{ shelf: "/?view=shelf", grid: "/?view=grid" }} remember={remember} />);
    expect(screen.getByRole("group", { name: "Cách xem" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kệ/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Lưới/ })).not.toHaveAttribute("aria-current");
    await userEvent.click(screen.getByRole("link", { name: /Lưới/ }));
    expect(remember).toHaveBeenCalledWith({ surface: "library", view: "grid" });
  });

  it("labels the roll page's views Dải phim and Lưới", () => {
    render(<ViewSwitch surface="roll" current="strip" hrefs={{ strip: "?view=strip", grid: "?view=grid" }} remember={vi.fn()} />);
    expect(screen.getByRole("link", { name: /Dải phim/ })).toHaveAttribute("href", "?view=strip");
    expect(screen.getByRole("link", { name: /Lưới/ })).toHaveAttribute("href", "?view=grid");
  });

  it("renders a view that isn't built yet as a disabled, unfocusable link (Ruling R7)", async () => {
    const remember = vi.fn().mockResolvedValue(undefined);
    render(
      <ViewSwitch
        surface="library"
        current="shelf"
        hrefs={{ shelf: "/?view=shelf", grid: "/?view=grid" }}
        disabled={["grid"]}
        remember={remember}
      />,
    );
    const grid = screen.getByRole("link", { name: /Lưới/ });
    expect(grid).toHaveAttribute("aria-disabled", "true");
    expect(grid).not.toHaveAttribute("href");
    expect(grid).not.toHaveAttribute("tabindex");
    await userEvent.click(grid);
    expect(remember).not.toHaveBeenCalled();
  });

  it("never lets a failed remember break the switch", async () => {
    const remember = vi.fn().mockRejectedValue(new Error("offline"));
    render(<ViewSwitch surface="library" current="shelf" hrefs={{ shelf: "/?view=shelf", grid: "/?view=grid" }} remember={remember} />);
    await userEvent.click(screen.getByRole("link", { name: /Lưới/ }));
    expect(remember).toHaveBeenCalledOnce();
  });
});
