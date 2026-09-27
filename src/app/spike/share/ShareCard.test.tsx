import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import { ShareCard } from "./ShareCard";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

function stubFetchOg() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob([PNG_BYTES], { type: "image/png" })),
    }),
  );
}

function stubUserAgent(value: string) {
  vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(value);
}

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

beforeEach(() => {
  // jsdom/Vitest's Blob shims don't line up for `URL.createObjectURL` —
  // stub it so `ShareCard`'s download-link effect doesn't crash the test.
  URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-object-url");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  // @ts-expect-error -- test-only cleanup of a property this suite adds to Navigator.
  delete window.navigator.canShare;
  // @ts-expect-error -- test-only cleanup of a property this suite adds to Navigator.
  delete window.navigator.share;
});

describe("ShareCard", () => {
  beforeEach(() => {
    stubFetchOg();
    stubUserAgent("TestAgent/1.0");
  });

  it("shows the user agent", async () => {
    renderWithIntl(<ShareCard />);

    expect(await screen.findByText("TestAgent/1.0")).toBeInTheDocument();
    // Let the file-load effect (and its child object-URL effect) settle
    // before the test ends, so cleanup doesn't race a pending state update.
    await screen.findByRole("link", { name: /tải ảnh xuống/i });
  });

  it("shows a share button when canShare({ files }) is true", async () => {
    window.navigator.canShare = vi.fn().mockReturnValue(true);
    window.navigator.share = vi.fn().mockResolvedValue(undefined);

    renderWithIntl(<ShareCard />);

    expect(await screen.findByRole("button", { name: /chia sẻ/i })).toBeInTheDocument();
  });

  it("falls back to a download link and the open-in-browser hint when canShare is missing", async () => {
    renderWithIntl(<ShareCard />);

    expect(await screen.findByRole("link", { name: /tải ảnh xuống/i })).toBeInTheDocument();
    expect(screen.getByText(/mở trong trình duyệt/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /chia sẻ/i })).not.toBeInTheDocument();
  });

  it("falls back when canShare({ files }) returns false", async () => {
    window.navigator.canShare = vi.fn().mockReturnValue(false);

    renderWithIntl(<ShareCard />);

    expect(await screen.findByRole("link", { name: /tải ảnh xuống/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /chia sẻ/i })).not.toBeInTheDocument();
  });

  it("shows nothing extra when the user cancels the share sheet (AbortError)", async () => {
    window.navigator.canShare = vi.fn().mockReturnValue(true);
    const abortError = new DOMException("cancelled", "AbortError");
    window.navigator.share = vi.fn().mockRejectedValue(abortError);

    renderWithIntl(<ShareCard />);
    const button = await screen.findByRole("button", { name: /chia sẻ/i });
    fireEvent.click(button);

    await waitFor(() => expect(window.navigator.share).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/AbortError/)).not.toBeInTheDocument();
    expect(screen.queryByText(/lỗi/i)).not.toBeInTheDocument();
  });

  it("shows the error name for any other share failure", async () => {
    window.navigator.canShare = vi.fn().mockReturnValue(true);
    window.navigator.share = vi.fn().mockRejectedValue(new DOMException("nope", "NotAllowedError"));

    renderWithIntl(<ShareCard />);
    const button = await screen.findByRole("button", { name: /chia sẻ/i });
    fireEvent.click(button);

    expect(await screen.findByText(/NotAllowedError/)).toBeInTheDocument();
  });
});
