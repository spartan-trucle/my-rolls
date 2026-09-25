import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";

const updateDisplayNameAction = vi.hoisted(() => vi.fn());
const signOutToSignUpAction = vi.hoisted(() => vi.fn());

vi.mock("./actions", () => ({ updateDisplayNameAction }));
vi.mock("@/lib/sign-out-action", () => ({ signOutToSignUpAction }));

import { ProfileContent } from "./ProfileContent";

describe("ProfileContent", () => {
  afterEach(() => {
    updateDisplayNameAction.mockReset();
    signOutToSignUpAction.mockReset();
  });

  it("renders one heading, the step label, and a Fraunces-initial avatar fallback with no image", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Chào bạn mới!" })).toBeInTheDocument();
    expect(screen.getByText("Bước 2 / 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Ảnh đại diện từ Google")).toHaveTextContent("T");
  });

  it("renders the Google avatar image when there is one", () => {
    renderWithIntl(
      <ProfileContent
        name="Trúc Lê"
        email="truc@gmail.com"
        image="https://lh3.googleusercontent.com/a/avatar.jpg"
      />,
    );

    expect(screen.getByAltText("Ảnh đại diện từ Google")).toBeInTheDocument();
  });

  it("prefills the name field with the session name and shows the hint", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} />);

    expect(screen.getByLabelText("Tên hiển thị")).toHaveValue("Trúc Lê");
    expect(screen.getByText("Bạn bè thấy tên này khi mở cuộn bạn chia sẻ.")).toBeInTheDocument();
  });

  it("shows the email read-only, marked from Google", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} />);

    expect(screen.getByText("truc@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("từ Google")).toBeInTheDocument();
  });

  it("keeps the primary 'Tiếp tục' button out of the name-update form's own subtree (Stage F fix 5): it lives in AuthLayout's pinned actions slot and is wired back to the form only through the HTML form attribute", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} />);

    const continueButton = screen.getByRole("button", { name: "Tiếp tục" });
    expect(continueButton.closest("form")).toBeNull();
    expect(continueButton).toHaveAttribute("form");
  });

  it("shows the empty-name error under the field instead of the hint", async () => {
    const user = userEvent.setup();
    updateDisplayNameAction.mockResolvedValue({ errorCode: "empty" });
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} />);

    await user.click(screen.getByRole("button", { name: "Tiếp tục" }));

    expect(await screen.findByText("Bạn chưa đặt tên. Thử lại nhé.")).toBeInTheDocument();
    expect(screen.queryByText("Bạn bè thấy tên này khi mở cuộn bạn chia sẻ.")).not.toBeInTheDocument();
  });

  it("shows the too-long error under the field", async () => {
    const user = userEvent.setup();
    updateDisplayNameAction.mockResolvedValue({ errorCode: "tooLong" });
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} />);

    await user.click(screen.getByRole("button", { name: "Tiếp tục" }));

    expect(
      await screen.findByText("Tên dài quá, đẩy +3 à? Ngắn lại dưới 50 ký tự nhé."),
    ).toBeInTheDocument();
  });

  it("renders both the phone and desktop switch-account copies (CSS shows one per breakpoint)", () => {
    renderWithIntl(<ProfileContent name="Trúc Lê" email="truc@gmail.com" image={null} />);

    expect(screen.getByText("Dùng tài khoản Google khác")).toBeInTheDocument();
    expect(screen.getByText("Dùng tài khoản khác")).toBeInTheDocument();
  });
});
