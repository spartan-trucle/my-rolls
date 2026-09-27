import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";

const updateNameAction = vi.hoisted(() => vi.fn());

vi.mock("./actions", () => ({ updateNameAction }));

import { NameForm } from "./NameForm";

describe("NameForm", () => {
  afterEach(() => {
    updateNameAction.mockReset();
  });

  it("renders a heading and a back link to /profile", () => {
    renderWithIntl(<NameForm name="Trúc Lê" />);

    expect(screen.getByRole("heading", { level: 1, name: "Sửa tên hiển thị" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "‹ Hồ sơ" })).toHaveAttribute("href", "/profile");
  });

  it("prefills the name field with the current name and shows the hint", () => {
    renderWithIntl(<NameForm name="Trúc Lê" />);

    expect(screen.getByLabelText("Tên hiển thị")).toHaveValue("Trúc Lê");
    expect(screen.getByText("Bạn bè thấy tên này khi mở cuộn bạn chia sẻ.")).toBeInTheDocument();
  });

  it("shows the empty-name error under the field instead of the hint", async () => {
    const user = userEvent.setup();
    updateNameAction.mockResolvedValue({ errorCode: "empty" });
    renderWithIntl(<NameForm name="Trúc Lê" />);

    await user.click(screen.getByRole("button", { name: "Lưu" }));

    expect(await screen.findByText("Bạn chưa đặt tên. Thử lại nhé.")).toBeInTheDocument();
    expect(screen.queryByText("Bạn bè thấy tên này khi mở cuộn bạn chia sẻ.")).not.toBeInTheDocument();
  });

  it("shows the too-long error under the field", async () => {
    const user = userEvent.setup();
    updateNameAction.mockResolvedValue({ errorCode: "tooLong" });
    renderWithIntl(<NameForm name="Trúc Lê" />);

    await user.click(screen.getByRole("button", { name: "Lưu" }));

    expect(
      await screen.findByText("Tên dài quá, đẩy +3 à? Ngắn lại dưới 50 ký tự nhé."),
    ).toBeInTheDocument();
  });
});
