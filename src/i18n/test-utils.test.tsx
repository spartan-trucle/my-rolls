import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "./test-utils";

/** Exercises two nested namespaces at once, the way the Stage F auth screens will. */
function Demo() {
  const tDemo = useTranslations("demo");
  const tAuth = useTranslations("auth.signIn");
  return (
    <>
      <span>{tDemo("keeper")}</span>
      <button type="button">{tAuth("googleButton")}</button>
    </>
  );
}

describe("renderWithIntl", () => {
  it("renders Vietnamese copy from messages/vi.json with diacritics intact", () => {
    renderWithIntl(<Demo />);

    const keeper = screen.getByText("tấm ưng");
    const googleButton = screen.getByRole("button", { name: "Đăng nhập bằng Google" });

    expect(keeper.textContent).toBe("tấm ưng");
    expect(keeper.textContent?.normalize("NFC")).toBe(keeper.textContent);
    expect(googleButton.textContent).toBe("Đăng nhập bằng Google");
    expect(googleButton.textContent?.normalize("NFC")).toBe(googleButton.textContent);
  });

  it("is not a no-op: the same component throws without the provider", () => {
    expect(() => render(<Demo />)).toThrow();
  });
});
