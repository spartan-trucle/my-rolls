import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import { OnboardingFrame } from "./OnboardingFrame";

/**
 * Fix 4 (owner review): the footer must never cover the content above it.
 * `OnboardingFrame` fixes this by making the middle region the only
 * scroller (`overflow-y-auto`) inside a fixed-height (`h-dvh`) frame, with
 * the footer as a sibling flex item sized to its own content — these are
 * structural assertions (class names / DOM shape), not pixel positions,
 * since jsdom doesn't lay anything out.
 */
describe("OnboardingFrame", () => {
  it("keeps the footer out of the scrollable content region", () => {
    renderWithIntl(
      <OnboardingFrame step={1} skipHref="/" footer={<button type="button">Bắt đầu</button>}>
        <p>Nội dung</p>
      </OnboardingFrame>,
    );

    const footerButton = screen.getByRole("button", { name: "Bắt đầu" });
    const content = screen.getByText("Nội dung");

    const scrollRegion = content.closest(".overflow-y-auto");
    expect(scrollRegion).not.toBeNull();
    expect(scrollRegion?.contains(footerButton)).toBe(false);
  });

  it("sizes the frame to a fixed viewport height rather than growing past it", () => {
    const { container } = renderWithIntl(
      <OnboardingFrame step={1} skipHref="/" footer={<button type="button">Bắt đầu</button>}>
        <p>Nội dung</p>
      </OnboardingFrame>,
    );

    expect(container.querySelector(".h-dvh")).not.toBeNull();
    expect(container.querySelector(".min-h-dvh")).toBeNull();
  });
});
