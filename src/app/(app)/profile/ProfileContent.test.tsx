import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";

const updateNameAction = vi.hoisted(() => vi.fn());
const signOutAction = vi.hoisted(() => vi.fn());

vi.mock("./actions", () => ({ updateNameAction }));
vi.mock("@/lib/sign-out-action", () => ({ signOutAction }));

import { ProfileContent } from "./ProfileContent";

describe("ProfileContent", () => {
  afterEach(() => {
    updateNameAction.mockReset();
    signOutAction.mockReset();
  });

  it("renders one heading titled 'Hồ sơ'", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Hồ sơ" })).toBeInTheDocument();
  });

  it("shows a Fraunces-initial avatar fallback when there is no Google image", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} />);

    expect(screen.getByLabelText("Ảnh đại diện từ Google")).toHaveTextContent("T");
  });

  it("renders the Google avatar image when the session has one", () => {
    renderWithIntl(
      <ProfileContent
        name="Trúc Lê"
        email="truc@gmail.com"
        image="https://lh3.googleusercontent.com/a/avatar.jpg"
      />,
    );

    expect(screen.getByAltText("Ảnh đại diện từ Google")).toBeInTheDocument();
  });

  it("prefills the name field with the current name and shows the hint", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} />);

    expect(screen.getByLabelText("Tên hiển thị")).toHaveValue("Trúc Lê");
    expect(screen.getByText("Bạn bè thấy tên này khi mở cuộn bạn chia sẻ.")).toBeInTheDocument();
  });

  it("shows the email read-only, marked from Google", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} />);

    expect(screen.getByText("truc@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("từ Google")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).toBeNull();
  });

  it("shows the empty-name error under the field instead of the hint", async () => {
    const user = userEvent.setup();
    updateNameAction.mockResolvedValue({ errorCode: "empty" });
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} />);

    await user.click(screen.getByRole("button", { name: "Lưu" }));

    expect(await screen.findByText("Bạn chưa đặt tên. Thử lại nhé.")).toBeInTheDocument();
    expect(screen.queryByText("Bạn bè thấy tên này khi mở cuộn bạn chia sẻ.")).not.toBeInTheDocument();
  });

  it("shows the too-long error under the field", async () => {
    const user = userEvent.setup();
    updateNameAction.mockResolvedValue({ errorCode: "tooLong" });
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} />);

    await user.click(screen.getByRole("button", { name: "Lưu" }));

    expect(
      await screen.findByText("Tên dài quá, đẩy +3 à? Ngắn lại dưới 50 ký tự nhé."),
    ).toBeInTheDocument();
  });

  it("shows a saved confirmation instead of the hint after a successful save", async () => {
    const user = userEvent.setup();
    updateNameAction.mockResolvedValue({ savedName: "Trúc Lê" });
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} />);

    await user.click(screen.getByRole("button", { name: "Lưu" }));

    expect(await screen.findByText("Đã lưu.")).toBeInTheDocument();
  });

  it("renders the theme toggle", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} />);

    expect(screen.getByRole("button", { name: "Chuyển sang giao diện tối" })).toBeInTheDocument();
  });

  it("renders a sign-out button inside its own form", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} />);

    const button = screen.getByRole("button", { name: "Đăng xuất" });
    expect(button.closest("form")).not.toBeNull();
  });
});
