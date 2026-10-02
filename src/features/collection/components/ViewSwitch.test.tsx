import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import { ViewSwitch } from "./ViewSwitch";

vi.mock("../actions", () => ({ trackViewSwitchAction: vi.fn() }));
const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

// jsdom can't navigate; stop the link's default action once React has seen the click.
const stopNavigation = (event: MouseEvent) => event.preventDefault();

describe("ViewSwitch (COL-1, COL-3, plan D7)", () => {
  beforeEach(() => document.addEventListener("click", stopNavigation));
  afterEach(() => {
    document.removeEventListener("click", stopNavigation);
    push.mockReset();
    for (const name of ["cuon_library_view", "cuon_roll_view"]) document.cookie = `${name}=; max-age=0; path=/`;
  });

  it("marks the current view, remembers the one picked in a cookie, and reports the switch", async () => {
    const track = vi.fn().mockResolvedValue(undefined);
    render(<ViewSwitch surface="library" current="shelf" hrefs={{ shelf: "/?view=shelf", grid: "/?view=grid" }} track={track} />);
    expect(screen.getByRole("group", { name: "Cách xem" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kệ/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Lưới/ })).not.toHaveAttribute("aria-current");
    await userEvent.click(screen.getByRole("link", { name: /Lưới/ }));
    expect(document.cookie).toContain("cuon_library_view=grid");
    expect(track).toHaveBeenCalledWith({ surface: "library", view: "grid" });
    expect(push).toHaveBeenCalledWith("/?view=grid");
  });

  it("writes the cookie, then pushes at once, without waiting on the analytics action (Ruling R31)", async () => {
    const track = vi.fn(() => new Promise<void>(() => {})); // never settles
    const cookieAtPush: string[] = [];
    push.mockImplementation(() => cookieAtPush.push(document.cookie));
    render(<ViewSwitch surface="roll" current="strip" hrefs={{ strip: "/rolls/r?view=strip", grid: "/rolls/r?view=grid" }} track={track} />);
    await userEvent.click(screen.getByRole("link", { name: /Lưới/ }));
    expect(push).toHaveBeenCalledExactlyOnceWith("/rolls/r?view=grid");
    expect(cookieAtPush[0]).toContain("cuon_roll_view=grid");
    expect(track).toHaveBeenCalledWith({ surface: "roll", view: "grid" });
  });

  it("does nothing when the current view is clicked", async () => {
    const track = vi.fn().mockResolvedValue(undefined);
    render(<ViewSwitch surface="library" current="shelf" hrefs={{ shelf: "/?view=shelf", grid: "/?view=grid" }} track={track} />);
    await userEvent.click(screen.getByRole("link", { name: /Kệ/ }));
    expect(track).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(document.cookie).not.toContain("cuon_library_view");
  });

  it.each(["{Control>}", "{Meta>}"])("leaves a %s click to the browser (new tab), neither saving nor pushing", async (key) => {
    const track = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ViewSwitch surface="library" current="shelf" hrefs={{ shelf: "/?view=shelf", grid: "/?view=grid" }} track={track} />);
    await user.keyboard(key);
    await user.click(screen.getByRole("link", { name: /Lưới/ }));
    expect(track).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(document.cookie).not.toContain("cuon_library_view");
  });

  it("labels the roll page's views Dải phim and Lưới", () => {
    render(<ViewSwitch surface="roll" current="strip" hrefs={{ strip: "?view=strip", grid: "?view=grid" }} track={vi.fn()} />);
    expect(screen.getByRole("link", { name: /Dải phim/ })).toHaveAttribute("href", "?view=strip");
    expect(screen.getByRole("link", { name: /Lưới/ })).toHaveAttribute("href", "?view=grid");
  });

  it("renders a view that isn't built yet as a disabled, unfocusable link (Ruling R7)", async () => {
    const track = vi.fn().mockResolvedValue(undefined);
    render(
      <ViewSwitch
        surface="library"
        current="shelf"
        hrefs={{ shelf: "/?view=shelf", grid: "/?view=grid" }}
        disabled={["grid"]}
        track={track}
      />,
    );
    const grid = screen.getByRole("link", { name: /Lưới/ });
    expect(grid).toHaveAttribute("aria-disabled", "true");
    expect(grid).not.toHaveAttribute("href");
    expect(grid).not.toHaveAttribute("tabindex");
    await userEvent.click(grid);
    expect(track).not.toHaveBeenCalled();
  });

  it.each([
    ["rejects", () => Promise.reject(new Error("offline"))],
    ["throws", () => {
      throw new Error("stale action id");
    }],
  ])("still switches, and remembers, when the analytics action %s", async (_, impl) => {
    const track = vi.fn(impl);
    render(<ViewSwitch surface="library" current="shelf" hrefs={{ shelf: "/?view=shelf", grid: "/?view=grid" }} track={track} />);
    await userEvent.click(screen.getByRole("link", { name: /Lưới/ }));
    expect(track).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith("/?view=grid");
    expect(document.cookie).toContain("cuon_library_view=grid");
  });
});
