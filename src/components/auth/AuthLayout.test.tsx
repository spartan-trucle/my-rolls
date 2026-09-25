import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import { AuthLayout } from "./AuthLayout";

describe("AuthLayout", () => {
  it("renders the given content and actions", () => {
    renderWithIntl(
      <AuthLayout actions={<button type="button">Đi tiếp</button>}>
        <h1>Tiêu đề trang</h1>
      </AuthLayout>,
    );

    expect(screen.getByRole("heading", { name: "Tiêu đề trang" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đi tiếp" })).toBeInTheDocument();
  });

  it("renders the phone strip when given one", () => {
    renderWithIntl(
      <AuthLayout actions={null} phoneStrip={<p>Dải phim</p>}>
        <h1>Tiêu đề</h1>
      </AuthLayout>,
    );

    expect(screen.getByText("Dải phim")).toBeInTheDocument();
  });

  it("renders no phone strip when none is given", () => {
    renderWithIntl(
      <AuthLayout actions={null}>
        <h1>Tiêu đề</h1>
      </AuthLayout>,
    );

    expect(screen.queryByText("Dải phim")).not.toBeInTheDocument();
  });

  it("labels the desktop photo panel from messages (auth.layout.photoPanelLabel)", () => {
    renderWithIntl(
      <AuthLayout actions={null}>
        <h1>Tiêu đề</h1>
      </AuthLayout>,
    );

    expect(screen.getByLabelText("Ảnh từ cộng đồng")).toBeInTheDocument();
  });

  it("shows the two D20 sample photos on the desktop panel, captioned from messages", () => {
    renderWithIntl(
      <AuthLayout actions={null}>
        <h1>Tiêu đề</h1>
      </AuthLayout>,
    );

    expect(screen.getByAltText("Đồi thông lúc bình minh")).toBeInTheDocument();
    expect(screen.getByAltText("Sườn đồi bị lọt sáng")).toBeInTheDocument();
  });

  it("renders the Cuộn wordmark once for the phone header and once for the desktop panel", () => {
    renderWithIntl(
      <AuthLayout actions={null}>
        <h1>Tiêu đề</h1>
      </AuthLayout>,
    );

    expect(screen.getAllByText("Cuộn")).toHaveLength(2);
  });

  it("renders a theme toggle reachable by role (the phone header's)", () => {
    renderWithIntl(
      <AuthLayout actions={null}>
        <h1>Tiêu đề</h1>
      </AuthLayout>,
    );

    expect(screen.getByRole("button", { name: "Chuyển sang giao diện tối" })).toBeInTheDocument();
  });

  it("renders a second theme toggle for the desktop corner (hidden below 1024px, so not role-queryable in jsdom)", () => {
    const { container } = renderWithIntl(
      <AuthLayout actions={null}>
        <h1>Tiêu đề</h1>
      </AuthLayout>,
    );

    expect(container.querySelectorAll("button")).toHaveLength(2);
  });
});
