import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import { Landing } from "./Landing";

// Vitest loads the CSS Modules with plain class names but ignores media
// queries, so both the phone and the desktop compositions count as visible
// here; in a browser only one of them shows at a time.
function renderLanding() {
  return renderWithIntl(<Landing />);
}

describe("Landing", () => {
  it("has one page heading, the hero line", () => {
    renderLanding();
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Mọi cuộn phim,mọi cú lỡ tay.");
  });

  it("names the product Cuộn, not the design system's working name", () => {
    const { container } = renderLanding();
    expect(container).toHaveTextContent("Cuộn cho mỗi cuộn phim một mái nhà");
    expect(container).not.toHaveTextContent("Roll Call");
  });

  it("has a section heading for the story, the shelf and sign-up", () => {
    renderLanding();
    const titles = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(titles).toEqual([
      "Từ bấm máy đến chia sẻ.",
      "Mọi cuộn phim, chung một kệ.",
      "Cuộn phim tiếp theo của bạn xứng đáng có một mái nhà.",
    ]);
  });

  it("sends every sign-up call to action to /sign-up and sign-in to /sign-in", () => {
    renderLanding();
    for (const name of ["Bắt đầu cuộn phim đầu tiên", "Đăng ký"]) {
      for (const link of screen.getAllByRole("link", { name })) {
        expect(link).toHaveAttribute("href", "/sign-up");
      }
    }
    for (const link of screen.getAllByRole("link", { name: "Đăng nhập" })) {
      expect(link).toHaveAttribute("href", "/sign-in");
    }
  });

  it("asks for no email: sign-up is Google only (AUTH-1)", () => {
    renderLanding();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Miễn phí. Chỉ cần một tài khoản Google.")).toBeInTheDocument();
  });

  it("links in-page only to sections that exist", () => {
    const { container } = renderLanding();
    const anchors = [...container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
    expect(anchors.length).toBeGreaterThan(0);
    for (const anchor of anchors) {
      const id = anchor.getAttribute("href")!.slice(1);
      expect(container.querySelector(`#${id}`), `#${id}`).not.toBeNull();
    }
  });

  it("reads the rolling strip once: its looping copy is hidden from assistive tech", () => {
    const { container } = renderLanding();
    const strips = [...container.querySelectorAll('ul[aria-label="Cuộn 14, Đà Lạt"]')];
    const hidden = strips.filter((strip) => strip.closest('[aria-hidden="true"]'));
    expect(strips).toHaveLength(4);
    expect(hidden).toHaveLength(2);
    expect(screen.getAllByRole("list", { name: "Cuộn 14, Đà Lạt" })).toHaveLength(2);
  });

  it("uses the glossary words for keepers and oops", () => {
    renderLanding();
    expect(screen.getByRole("img", { name: "5 tấm ưng" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "9 oops" })).toBeInTheDocument();
    // The shelf totals only show on desktop.
    expect(screen.getByRole("img", { name: "18 tấm ưng", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "13 oops", hidden: true })).toBeInTheDocument();
  });

  it("draws a generic canister with the film data as text, named for screen readers", () => {
    renderLanding();
    const canisters = screen.getAllByRole("img", { name: "Một cuộn phim màu 35mm, ISO 200, 36 kiểu" });
    expect(canisters.length).toBeGreaterThan(0);
    for (const canister of canisters) {
      expect(canister.tagName.toLowerCase()).toBe("svg");
      expect(canister).toHaveTextContent("200");
    }
  });

  it("shows the story as four described illustrations whose mock controls can't be focused", () => {
    renderLanding();
    const story = screen.getByRole("list", { name: "Cách Cuộn hoạt động, kể thành một câu chuyện ngắn" });
    expect(within(story).getAllByRole("listitem")).toHaveLength(4);
    expect(within(story).getByRole("img", { name: "Chia sẻ cuộn phim với bạn bè" })).toBeInTheDocument();

    const mockButton = within(story).getByText("Chia sẻ cuộn này").closest("button");
    expect(mockButton?.closest("[inert]")).not.toBeNull();
  });

  it("keeps stickers decorative", () => {
    const { container } = renderLanding();
    const stickers = [...container.querySelectorAll('img[src*="/landing/stickers/"]')];
    expect(stickers.length).toBeGreaterThan(0);
    for (const sticker of stickers) expect(sticker).toHaveAttribute("alt", "");
  });

  it("links the footer to the terms and privacy pages", () => {
    renderLanding();
    const footer = screen.getByRole("navigation", { name: "Chân trang" });
    expect(within(footer).getByRole("link", { name: "Điều khoản" })).toHaveAttribute("href", "/terms");
    expect(within(footer).getByRole("link", { name: "Quyền riêng tư" })).toHaveAttribute("href", "/privacy");
  });
});
