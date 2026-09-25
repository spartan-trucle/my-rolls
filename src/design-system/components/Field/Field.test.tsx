import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";
import styles from "./Field.module.css";

describe("Field", () => {
  it("labels its input", () => {
    render(<Field label="Máy ảnh" placeholder="Nikon FM2" />);
    const input = screen.getByLabelText("Máy ảnh");
    expect(input).toHaveAttribute("placeholder", "Nikon FM2");
    expect(input).toHaveClass(styles.input);
  });

  it("describes the input with its hint", () => {
    render(<Field label="ISO" hint="Số in trên hộp phim" />);
    expect(screen.getByLabelText("ISO")).toHaveAccessibleDescription("Số in trên hộp phim");
  });

  it("shows the error instead of the hint and marks the input invalid", () => {
    render(<Field label="ISO" hint="Số in trên hộp phim" error="Nhiều quá. Đẩy +3 à?" />);
    const input = screen.getByLabelText("ISO");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Nhiều quá. Đẩy +3 à?");
    expect(screen.getByText("Nhiều quá. Đẩy +3 à?")).toHaveClass(styles.hint, styles.error);
    expect(screen.queryByText("Số in trên hộp phim")).not.toBeInTheDocument();
  });

  it("uses the mono face for film data", () => {
    render(<Field label="ISO" mono />);
    expect(screen.getByLabelText("ISO")).toHaveClass(styles.mono);
  });

  it("keeps a caller's id and puts className on the wrapper", () => {
    const { container } = render(<Field label="Tên cuộn" id="roll-name" className="extra" />);
    expect(screen.getByLabelText("Tên cuộn")).toHaveAttribute("id", "roll-name");
    expect(container.firstElementChild).toHaveClass(styles.field, "extra");
  });

  it("works as a controlled input", async () => {
    function Controlled() {
      const [value, setValue] = useState("");
      return <Field label="Tên cuộn" value={value} onChange={(e) => setValue(e.target.value)} />;
    }
    render(<Controlled />);
    await userEvent.type(screen.getByLabelText("Tên cuộn"), "Đà Lạt");
    expect(screen.getByLabelText("Tên cuộn")).toHaveValue("Đà Lạt");
  });
});
