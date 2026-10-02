import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import { FilterChips } from "./FilterChips";

describe("FilterChips (COL-2)", () => {
  const counts = { all: 36, keeper: 5, oops: 3, blank: 1 };

  it("is a labelled group of links, one per filter, with its count", () => {
    render(<FilterChips filters={["all", "keeper", "oops", "blank"]} current="all" counts={counts} hrefFor={(f) => `?filter=${f}`} />);
    const group = screen.getByRole("group", { name: "Lọc tấm" });
    const links = within(group).getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Tất cả36", "Tấm ưng5", "Oops3", "Tấm trắng1"]);
    expect(screen.getByRole("link", { name: /Oops\s*3/ })).toHaveAttribute("href", "?filter=oops");
  });

  it("marks only the current filter", () => {
    render(<FilterChips filters={["all", "keeper"]} current="keeper" counts={counts} hrefFor={(f) => `?filter=${f}`} />);
    expect(screen.getByRole("link", { name: /Tấm ưng/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: /Tất cả/ })).not.toHaveAttribute("aria-current");
  });
});
