import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";

const signInWithGoogle = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-client", () => ({ signInWithGoogle }));

import { GoogleButton } from "./GoogleButton";

describe("GoogleButton", () => {
  afterEach(() => {
    signInWithGoogle.mockReset();
  });

  it("shows the given label", () => {
    signInWithGoogle.mockReturnValue(new Promise(() => {}));
    renderWithIntl(<GoogleButton label="Đăng nhập bằng Google" />);

    expect(screen.getByRole("button", { name: "Đăng nhập bằng Google" })).toBeInTheDocument();
  });

  it("calls signInWithGoogle once and disables itself while pending", async () => {
    const user = userEvent.setup();
    signInWithGoogle.mockReturnValue(new Promise(() => {})); // never resolves: the browser is "redirecting"
    renderWithIntl(<GoogleButton label="Đăng nhập bằng Google" />);
    const button = screen.getByRole("button", { name: "Đăng nhập bằng Google" });

    await user.click(button);

    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    await user.click(button);
    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it("shows a human error and re-enables when signInWithGoogle resolves with an error", async () => {
    const user = userEvent.setup();
    signInWithGoogle.mockResolvedValue({ data: null, error: { message: "network down" } });
    renderWithIntl(<GoogleButton label="Đăng nhập bằng Google" />);

    await user.click(screen.getByRole("button", { name: "Đăng nhập bằng Google" }));

    expect(await screen.findByText("Không đăng nhập được. Thử lại nhé.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng nhập bằng Google" })).toBeEnabled();
  });

  it("shows the same human error when signInWithGoogle rejects", async () => {
    const user = userEvent.setup();
    signInWithGoogle.mockRejectedValue(new Error("boom"));
    renderWithIntl(<GoogleButton label="Đăng nhập bằng Google" />);

    await user.click(screen.getByRole("button", { name: "Đăng nhập bằng Google" }));

    expect(await screen.findByText("Không đăng nhập được. Thử lại nhé.")).toBeInTheDocument();
  });

  it("re-enables after the user comes back from Google via the bfcache (a pageshow with persisted: true)", async () => {
    const user = userEvent.setup();
    signInWithGoogle.mockReturnValue(new Promise(() => {})); // never resolves: the browser navigated away
    renderWithIntl(<GoogleButton label="Đăng nhập bằng Google" />);
    const button = screen.getByRole("button", { name: "Đăng nhập bằng Google" });

    await user.click(button);
    expect(button).toBeDisabled();

    act(() => {
      window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    });

    expect(button).toBeEnabled();
    expect(button).toHaveAttribute("aria-busy", "false");
  });

  it("does not touch a normal (non-bfcache) pageshow", async () => {
    const user = userEvent.setup();
    signInWithGoogle.mockReturnValue(new Promise(() => {}));
    renderWithIntl(<GoogleButton label="Đăng nhập bằng Google" />);
    const button = screen.getByRole("button", { name: "Đăng nhập bằng Google" });

    await user.click(button);
    act(() => {
      window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: false }));
    });

    expect(button).toBeDisabled();
  });

  it("clears a previous error on a fresh attempt", async () => {
    const user = userEvent.setup();
    signInWithGoogle.mockResolvedValueOnce({ data: null, error: { message: "network down" } });
    renderWithIntl(<GoogleButton label="Đăng nhập bằng Google" />);
    const button = screen.getByRole("button", { name: "Đăng nhập bằng Google" });
    await user.click(button);
    expect(await screen.findByText("Không đăng nhập được. Thử lại nhé.")).toBeInTheDocument();

    signInWithGoogle.mockReturnValue(new Promise(() => {}));
    await user.click(button);

    expect(screen.queryByText("Không đăng nhập được. Thử lại nhé.")).not.toBeInTheDocument();
  });
});
