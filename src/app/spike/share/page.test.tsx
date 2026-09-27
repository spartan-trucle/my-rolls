import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./ShareCard", () => ({ ShareCard: () => <div>ShareCard placeholder</div> }));

describe("/spike/share", () => {
  it("sets noindex metadata (D30)", async () => {
    const { metadata } = await import("./page");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renders the ShareCard", async () => {
    const { default: SharePage } = await import("./page");
    render(<SharePage />);

    expect(screen.getByText("ShareCard placeholder")).toBeInTheDocument();
  });
});
