import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
);
const getCatalogueBySlugs = vi.hoisted(() => vi.fn());
const listBag = vi.hoisted(() => vi.fn());
const getDb = vi.hoisted(() => vi.fn().mockReturnValue({ __brand: "fake-db" }));
const fakeRequestHeaders = vi.hoisted(() => ({ __brand: "fake-headers" }));

vi.mock("@/lib/auth", () => ({ getAuth: vi.fn().mockReturnValue({ api: { getSession } }) }));
vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue(fakeRequestHeaders) }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/db/client", () => ({ getDb }));
vi.mock("@/features/catalogue/queries", () => ({ getCatalogueBySlugs }));
vi.mock("@/features/bag/queries", () => ({ listBag }));
vi.mock("./OnboardBagContent", () => ({
  OnboardBagContent: (props: unknown) => <div data-testid="onboard-bag-content" data-props={JSON.stringify(props)} />,
}));

import OnboardBagPage from "./page";

describe("OnboardBagPage", () => {
  afterEach(() => {
    getSession.mockReset();
    redirectMock.mockClear();
    getCatalogueBySlugs.mockReset();
    listBag.mockReset();
  });

  it("redirects to /sign-in when there is no session", async () => {
    getSession.mockResolvedValue(null);

    await expect(OnboardBagPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("builds checked refs from the bag and maps popular entries to chips", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    getCatalogueBySlugs
      .mockResolvedValueOnce([{ kind: "camera", id: "cam-1", brand: "Pentax", model: "K1000" }])
      .mockResolvedValueOnce([{ kind: "stock", id: "stock-1", brand: "Kodak", name: "Gold 200", canisterColor: "gold" }]);
    listBag.mockResolvedValue([
      { bagItemId: "bag-1", kind: "camera", createdAt: new Date(), camera: { id: "cam-1" }, fixedStock: null },
    ]);

    const ui = await OnboardBagPage();

    expect(ui.props.initialCameraChips).toEqual([{ kind: "camera", id: "cam-1", brand: "Pentax", model: "K1000" }]);
    expect(ui.props.initialStockChips).toEqual([
      { kind: "stock", id: "stock-1", brand: "Kodak", name: "Gold 200", canisterColor: "gold" },
    ]);
    expect(ui.props.initialCheckedRefs).toEqual({ "camera:cam-1": "bag-1" });
  });
});
