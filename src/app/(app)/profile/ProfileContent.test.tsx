import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";

const signOutAction = vi.hoisted(() => vi.fn());

vi.mock("@/lib/sign-out-action", () => ({ signOutAction }));

import { ProfileContent } from "./ProfileContent";

const CREATED_AT = new Date(2026, 8, 25);

describe("ProfileContent", () => {
  afterEach(() => {
    signOutAction.mockReset();
  });

  it("renders the uppercase 'Hồ sơ' header label (not a heading)", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} createdAt={CREATED_AT} />);

    expect(screen.getByText("Hồ sơ")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Hồ sơ" })).not.toBeInTheDocument();
  });

  it("renders the display name as the one h1", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} createdAt={CREATED_AT} />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Trúc Lê" })).toBeInTheDocument();
  });

  it("shows a Fraunces-initial avatar fallback when there is no Google image", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} createdAt={CREATED_AT} />);

    expect(screen.getByLabelText("Ảnh đại diện từ Google")).toHaveTextContent("T");
  });

  it("renders the Google avatar image when there is one", () => {
    renderWithIntl(
      <ProfileContent
        name="Trúc Lê"
        email="truc@gmail.com"
        image="https://lh3.googleusercontent.com/a/avatar.jpg"
        createdAt={CREATED_AT}
      />,
    );

    expect(screen.getByAltText("Ảnh đại diện từ Google")).toBeInTheDocument();
  });

  it("shows the email next to the Google 'G' mark", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} createdAt={CREATED_AT} />);

    expect(screen.getByText("truc@gmail.com")).toBeInTheDocument();
  });

  it("shows the join date formatted dd.mm.yy", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} createdAt={CREATED_AT} />);

    expect(screen.getByText("Vào Cuộn từ 25.09.26")).toBeInTheDocument();
  });

  it("renders the 'Cài đặt' settings heading", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} createdAt={CREATED_AT} />);

    expect(screen.getByRole("heading", { level: 2, name: "Cài đặt" })).toBeInTheDocument();
  });

  it("renders the Sáng / Tối theme segmented control", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} createdAt={CREATED_AT} />);

    expect(screen.getByRole("group", { name: "Giao diện" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sáng" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tối" })).toBeInTheDocument();
  });

  it("links 'Sửa tên hiển thị' to /profile/name instead of an inline form", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} createdAt={CREATED_AT} />);

    expect(screen.getByRole("link", { name: /Sửa tên hiển thị/ })).toHaveAttribute("href", "/profile/name");
    expect(screen.queryByLabelText("Tên hiển thị")).not.toBeInTheDocument();
  });

  it("renders a full-width, outline sign-out button inside its own form", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} createdAt={CREATED_AT} />);

    const button = screen.getByRole("button", { name: "Đăng xuất" });
    expect(button.closest("form")).not.toBeNull();
  });

  it("does not render stats, bag, keepers, language or delete-account rows", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} createdAt={CREATED_AT} />);

    expect(screen.queryByText("Túi của tôi")).not.toBeInTheDocument();
    expect(screen.queryByText("Tấm ưng gần đây")).not.toBeInTheDocument();
    expect(screen.queryByText("Ngôn ngữ")).not.toBeInTheDocument();
    expect(screen.queryByText("Xoá tài khoản")).not.toBeInTheDocument();
    expect(screen.queryByText("cuộn")).not.toBeInTheDocument();
  });

  it("does not render a bottom tab bar", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} createdAt={CREATED_AT} />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
