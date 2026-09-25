import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorButton } from "./ErrorButton";

describe("ErrorButton", () => {
  it("throws in the browser when clicked, for PostHog's exception autocapture to catch (G1 check)", () => {
    render(<ErrorButton />);
    const button = screen.getByRole("button", { name: /throw in browser/i });

    // React 19 re-throws synchronously from `fireEvent.click` in a way jsdom
    // surfaces as a window `error` event rather than a thrown call
    // expression — listen for it instead of wrapping the click in `toThrow`.
    let caught: unknown;
    const onError = (event: ErrorEvent) => {
      caught = event.error;
      event.preventDefault();
    };
    window.addEventListener("error", onError);

    try {
      fireEvent.click(button);
    } finally {
      window.removeEventListener("error", onError);
    }

    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe("Cuộn dev/errors: thrown in the browser");
  });
});
