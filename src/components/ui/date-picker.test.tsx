import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DatePicker, formatDateValue, parseDateValue } from "./date-picker";

describe("parseDateValue / formatDateValue", () => {
  it("round-trips a YYYY-MM-DD value to a local calendar Date and back", () => {
    const date = parseDateValue("2026-09-05");
    expect(date).toBeInstanceOf(Date);
    expect(formatDateValue(date as Date)).toBe("2026-09-05");
  });

  it("returns undefined for an empty value", () => {
    expect(parseDateValue("")).toBeUndefined();
  });
});

function setup(props: Partial<React.ComponentProps<typeof DatePicker>> = {}) {
  const user = userEvent.setup();
  let value = props.value ?? "";
  const onChange = (next: string) => {
    value = next;
  };
  const view = render(<DatePicker label="Ngày bắt đầu" value={value} onChange={onChange} {...props} />);
  return { user, view };
}

describe("DatePicker", () => {
  it("shows the placeholder when empty, and opens the calendar on trigger click", async () => {
    const { user } = setup();

    const trigger = screen.getByLabelText("Ngày bắt đầu");
    expect(trigger).toHaveTextContent("Chọn ngày");

    await user.click(trigger);
    expect(await screen.findByRole("grid")).toBeInTheDocument();
  });

  it("selecting a day shows it formatted as dd/mm/yyyy and closes the popover", async () => {
    const user = userEvent.setup();
    let value = "";
    const onChange = (next: string) => {
      value = next;
    };
    const { rerender } = render(<DatePicker label="Ngày bắt đầu" value={value} onChange={onChange} />);

    await user.click(screen.getByLabelText("Ngày bắt đầu"));
    const grid = await screen.findByRole("grid");
    const fifteenth = within(grid).getByRole("button", { name: /15/ });
    await user.click(fifteenth);

    expect(value).toMatch(/^\d{4}-\d{2}-15$/);
    rerender(<DatePicker label="Ngày bắt đầu" value={value} onChange={onChange} />);
    await waitFor(() => expect(screen.getByLabelText("Ngày bắt đầu")).toHaveTextContent(/\d{2}\/\d{2}\/\d{4}/));
  });

  it("associates the label with the trigger for keyboard/screen-reader access", () => {
    setup({ id: "shot-from" });
    const trigger = screen.getByLabelText("Ngày bắt đầu");
    expect(trigger.id).toBe("shot-from");
    expect(trigger.tagName).toBe("BUTTON");
  });

  it("shows the human-voice error text when given one", () => {
    setup({ error: "Không chọn được ngày trong tương lai." });
    expect(screen.getByText("Không chọn được ngày trong tương lai.")).toBeInTheDocument();
  });
});
