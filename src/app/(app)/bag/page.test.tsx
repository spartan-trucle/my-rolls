import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
const listBagQuery = vi.hoisted(() => vi.fn());
const fakeRequestHeaders = vi.hoisted(() => ({ __brand: "fake-headers" }));

vi.mock("@/lib/auth", () => ({
  getAuth: vi.fn().mockReturnValue({ api: { getSession } }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(fakeRequestHeaders),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/db/client", () => ({ getDb: vi.fn().mockReturnValue({ __brand: "fake-db" }) }));
vi.mock("@/features/bag/queries", () => ({ listBag: listBagQuery }));
vi.mock("@/features/bag/components/BagList", () => ({
  BagList: ({ initialEntries }: { initialEntries: unknown[] }) => (
    <div data-testid="bag-list">entries: {initialEntries.length}</div>
  ),
}));

import BagPage from "./page";

describe("/bag", () => {
  afterEach(() => {
    getSession.mockReset();
    redirectMock.mockReset();
    listBagQuery.mockReset();
  });

  it("redirects to /sign-in when there is no session", async () => {
    getSession.mockResolvedValue(null);

    await BagPage();

    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("fetches the caller's bag and renders BagList with it, no nav (F3's layout supplies that)", async () => {
    getSession.mockResolvedValue({ session: { id: "s1" }, user: { id: "user-1" } });
    listBagQuery.mockResolvedValue([{ bagItemId: "b1" }, { bagItemId: "b2" }]);

    const ui = await BagPage();
    render(ui);

    expect(listBagQuery).toHaveBeenCalledWith({ __brand: "fake-db" }, "user-1");
    expect(screen.getByTestId("bag-list")).toHaveTextContent("entries: 2");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
