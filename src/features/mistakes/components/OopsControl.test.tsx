import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";

const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("./MistakePicker", () => ({
  MistakePicker: ({ onDone, framePosition }: { onDone: () => void; framePosition: number }) => (
    <button type="button" onClick={onDone}>{`picker for ${framePosition}`}</button>
  ),
}));

import { OopsControl } from "./OopsControl";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

describe("OopsControl (FrameView's Oops?)", () => {
  it("shows the frame's mistakes as oops stamps", () => {
    render(
      <OopsControl
        rollId="r1"
        frameId="f5"
        framePosition={5}
        mistakes={[
          { id: "1", frameId: "f5", type: "light_leak", note: null },
          { id: "2", frameId: null, type: "wrong_iso", note: null },
        ]}
      />,
    );
    expect(screen.getByText("Lọt sáng")).toBeInTheDocument();
    expect(screen.queryByText("Sai ISO")).not.toBeInTheDocument();
  });

  it("opens the picker and refreshes when it's done", async () => {
    render(<OopsControl rollId="r1" frameId="f5" framePosition={5} mistakes={[]} />);
    await userEvent.click(screen.getByRole("button", { name: /Oops\?/ }));
    await userEvent.click(screen.getByRole("button", { name: "picker for 5" }));
    expect(refresh).toHaveBeenCalled();
  });
});
