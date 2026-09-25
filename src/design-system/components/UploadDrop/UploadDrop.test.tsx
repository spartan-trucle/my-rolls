import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UploadDrop } from "./UploadDrop";
import styles from "./UploadDrop.module.css";

const copy = { title: "Thả cuộn vào đây", hint: "hoặc chạm để chọn ảnh scan" };
const scan = () => new File(["x"], "01.jpg", { type: "image/jpeg" });

describe("UploadDrop", () => {
  it("shows its title and hint and names the file input with them", () => {
    render(<UploadDrop {...copy} onFiles={vi.fn()} />);
    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.hint)).toBeInTheDocument();
    const input = screen.getByLabelText(new RegExp(copy.title));
    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAttribute("multiple");
    expect(input).toHaveAttribute("accept", "image/*");
  });

  it("takes an accept list", () => {
    render(<UploadDrop {...copy} onFiles={vi.fn()} accept="image/jpeg,image/png" />);
    expect(screen.getByLabelText(new RegExp(copy.title))).toHaveAttribute("accept", "image/jpeg,image/png");
  });

  it("hands picked files to onFiles as an array", async () => {
    const onFiles = vi.fn();
    render(<UploadDrop {...copy} onFiles={onFiles} />);
    const files = [scan(), scan()];
    await userEvent.upload(screen.getByLabelText(new RegExp(copy.title)), files);
    expect(onFiles).toHaveBeenCalledWith(files);
  });

  it("highlights while files hover and clears on leave", () => {
    const { container } = render(<UploadDrop {...copy} onFiles={vi.fn()} />);
    const zone = container.firstElementChild!;
    fireEvent.dragOver(zone);
    expect(zone).toHaveClass(styles.over);
    fireEvent.dragLeave(zone);
    expect(zone).not.toHaveClass(styles.over);
  });

  it("hands dropped files to onFiles and clears the highlight", () => {
    const onFiles = vi.fn();
    const { container } = render(<UploadDrop {...copy} onFiles={onFiles} />);
    const zone = container.firstElementChild!;
    const file = scan();
    fireEvent.dragOver(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(zone).not.toHaveClass(styles.over);
  });

  it("ignores a drop with no files", () => {
    const onFiles = vi.fn();
    const { container } = render(<UploadDrop {...copy} onFiles={onFiles} />);
    fireEvent.drop(container.firstElementChild!, { dataTransfer: { files: [] } });
    expect(onFiles).not.toHaveBeenCalled();
  });
});
