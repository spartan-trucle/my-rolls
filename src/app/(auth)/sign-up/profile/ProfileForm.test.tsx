import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";

const updateDisplayNameAction = vi.hoisted(() => vi.fn());
const signOutToSignUpAction = vi.hoisted(() => vi.fn());

vi.mock("./actions", () => ({ updateDisplayNameAction }));
vi.mock("@/lib/sign-out-action", () => ({ signOutToSignUpAction }));

import { ProfileForm } from "./ProfileForm";

describe("ProfileForm", () => {
  afterEach(() => {
    updateDisplayNameAction.mockReset();
    signOutToSignUpAction.mockReset();
  });

  it("prefills the name field with the session name and shows the hint", () => {
    renderWithIntl(<ProfileForm name="Trúc Lê" email="truc@gmail.com" />);

    expect(screen.getByLabelText("Tên hiển thị")).toHaveValue("Trúc Lê");
    expect(screen.getByText("Bạn bè thấy tên này khi mở cuộn bạn chia sẻ.")).toBeInTheDocument();
  });

  it("shows the email read-only, marked from Google", () => {
    renderWithIntl(<ProfileForm name="Trúc Lê" email="truc@gmail.com" />);

    expect(screen.getByText("truc@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("từ Google")).toBeInTheDocument();
  });

  it("shows the empty-name error under the field instead of the hint", async () => {
    const user = userEvent.setup();
    updateDisplayNameAction.mockResolvedValue({ errorCode: "empty" });
    renderWithIntl(<ProfileForm name="Trúc Lê" email="truc@gmail.com" />);

    await user.click(screen.getByRole("button", { name: "Tiếp tục" }));

    expect(await screen.findByText("Bạn chưa đặt tên. Thử lại nhé.")).toBeInTheDocument();
    expect(screen.queryByText("Bạn bè thấy tên này khi mở cuộn bạn chia sẻ.")).not.toBeInTheDocument();
  });

  it("shows the too-long error under the field", async () => {
    const user = userEvent.setup();
    updateDisplayNameAction.mockResolvedValue({ errorCode: "tooLong" });
    renderWithIntl(<ProfileForm name="Trúc Lê" email="truc@gmail.com" />);

    await user.click(screen.getByRole("button", { name: "Tiếp tục" }));

    expect(
      await screen.findByText("Tên dài quá, đẩy +3 à? Ngắn lại dưới 50 ký tự nhé."),
    ).toBeInTheDocument();
  });

  it("renders both the phone and desktop switch-account copies (CSS shows one per breakpoint)", () => {
    renderWithIntl(<ProfileForm name="Trúc Lê" email="truc@gmail.com" />);

    expect(screen.getByText("Dùng tài khoản Google khác")).toBeInTheDocument();
    expect(screen.getByText("Dùng tài khoản khác")).toBeInTheDocument();
  });
});
