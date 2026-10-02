import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { UploadProvider } from "@/features/uploads/client/UploadProvider";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../messages/vi.json";
import type { ILibraryPage } from "@/features/collection/core";
import type { IRollEntry } from "@/features/rolls/core";

const getSession = vi.hoisted(() => vi.fn());
const getSessionCookie = vi.hoisted(() => vi.fn());
const listRolls = vi.hoisted(() => vi.fn());
const collection = vi.hoisted(() => ({
  rememberViewAction: vi.fn(),
  listLibraryAction: vi.fn(),
  libraryTotalsAction: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuth: vi.fn().mockReturnValue({ api: { getSession } }),
}));

vi.mock("better-auth/cookies", () => ({ getSessionCookie }));

const cookieValues = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({ get: (name: string) => (cookieValues.has(name) ? { name, value: cookieValues.get(name) } : undefined) })),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/rolls/actions", () => ({ listRolls }));
vi.mock("@/features/collection/actions", () => collection);

// `getTranslations` needs Next's request scope; the real messages through next-intl's own translator stand in.
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  return {
    getTranslations: async (namespace: "landing") => createTranslator({ locale: "vi", messages, namespace }),
  };
});

import Page, { generateMetadata } from "./page";

/** Home with the given `?view=` (or none), as Next passes `searchParams`. */
function Home(query: Record<string, string> = {}) {
  return Page({ searchParams: Promise.resolve(query) } as Parameters<typeof Page>[0]);
}

function renderHome(ui: Awaited<ReturnType<typeof Home>>) {
  // The root layout provides the upload queue in the app (Phase 2 D16).
  return render(
    <NextIntlClientProvider locale="vi" messages={messages}>
      <UploadProvider>{ui}</UploadProvider>
    </NextIntlClientProvider>,
  );
}

const signedInSession = {
  session: { id: "s1" },
  user: { id: "u1", name: "Trúc Lê", email: "truc@gmail.com", image: null },
};

function makeRoll(overrides: Partial<IRollEntry>): IRollEntry {
  return {
    id: "roll-1",
    name: null,
    canisterColor: "gold",
    boxIso: 200,
    shotIso: 200,
    exposures: 36,
    format: "35mm",
    locations: null,
    shotFrom: new Date("2025-10-12T12:00:00Z"),
    shotTo: null,
    memory: null,
    version: 1,
    createdAt: new Date("2025-10-12T12:00:00Z"),
    pushPull: "0",
    stock: { id: "stock-1", brand: "Kodak", name: "Gold 200", iso: 200, canisterColor: "gold", type: null },
    camera: { brand: "Pentax", model: "K1000", type: null },
    lens: null,
    ...overrides,
  };
}

const TOTALS = { rolls: 3, frames: 108, keepers: 16 };

function libraryPage(overrides: Partial<ILibraryPage> = {}): ILibraryPage {
  return {
    totals: TOTALS,
    counts: { all: 108, keeper: 16, oops: 7 },
    groups: [
      {
        roll: makeRoll({ id: "roll-9", name: "Sài Gòn đêm" }),
        frames: [{ id: "f1", position: 1, gridUrl: "https://img/g1.webp", viewUrl: "https://img/v1.webp", width: 3000, height: 2000, isKeeper: true, isBlank: false, isOops: false, noteCount: 0 }],
      },
    ],
    nextCursor: null,
    ...overrides,
  };
}

describe("Home (/)", () => {
  beforeEach(() => {
    collection.libraryTotalsAction.mockResolvedValue(TOTALS);
    collection.listLibraryAction.mockResolvedValue(libraryPage());
  });

  afterEach(() => {
    getSession.mockReset();
    getSessionCookie.mockReset();
    listRolls.mockReset();
    collection.libraryTotalsAction.mockReset();
    collection.listLibraryAction.mockReset();
    cookieValues.clear();
  });

  it("shows a visitor with no session cookie the landing page, without looking the session up", async () => {
    getSessionCookie.mockReturnValue(null);

    renderHome(await Home());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mọi cuộn phim,mọi cú lỡ tay.");
    expect(getSession).not.toHaveBeenCalled();
    expect(listRolls).not.toHaveBeenCalled();
  });

  it("shows the landing page when the session cookie is stale (the proxy is only optimistic)", async () => {
    getSessionCookie.mockReturnValue("a-stale-token");
    getSession.mockResolvedValue(null);

    renderHome(await Home());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mọi cuộn phim,mọi cú lỡ tay.");
  });

  it("greets the signed-in user by first name and shows the library's count line (Ruling R8)", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);
    listRolls.mockResolvedValue([makeRoll({ id: "roll-1" }), makeRoll({ id: "roll-2" })]);

    renderHome(await Home());

    expect(screen.getByRole("heading", { level: 1, name: "Kệ của Trúc" })).toBeInTheDocument();
    expect(screen.getByText("3 CUỘN · 108 TẤM · 16 TẤM ƯNG")).toBeInTheDocument();
    // The shelf needs only the totals, not a page of frames.
    expect(collection.libraryTotalsAction).toHaveBeenCalled();
    expect(collection.listLibraryAction).not.toHaveBeenCalled();
  });

  it("CAN-1: lists rolls newest first as canisters on the shelf", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);
    listRolls.mockResolvedValue([
      makeRoll({ id: "roll-newest", name: "Đà Lạt, tháng 10" }),
      makeRoll({ id: "roll-oldest", name: "Chợ Lớn buổi sáng" }),
    ]);

    renderHome(await Home());

    const links = screen.getAllByRole("link", { name: /Đà Lạt|Chợ Lớn/ });
    expect(links[0]).toHaveAttribute("href", "/rolls/roll-newest");
    expect(links[0]).toHaveAccessibleName("Đà Lạt, tháng 10, Kodak Gold 200");
    expect(links[1]).toHaveAttribute("href", "/rolls/roll-oldest");
  });

  it("gives each canister its scan status: the frame count, or Chờ scan before any scans", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);
    listRolls.mockResolvedValue([makeRoll({ id: "roll-1", frameCount: 36 }), makeRoll({ id: "roll-2", frameCount: 0 })]);

    renderHome(await Home());

    expect(screen.getByText("36 tấm")).toBeInTheDocument();
    expect(screen.getByText("Chờ scan")).toBeInTheDocument();
  });

  it("shows the ShelfEmpty state when there are no rolls", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);
    listRolls.mockResolvedValue([]);

    renderHome(await Home());

    expect(screen.getByRole("heading", { level: 2, name: "Kệ còn trống" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lên kệ cuộn đầu tiên" })).toHaveAttribute("href", "/rolls/new");
  });

  it("H2: shows the 'Mới nhất trước' sort label beside the Kệ/Lưới toggle", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);
    listRolls.mockResolvedValue([]);

    renderHome(await Home());

    expect(screen.getByText("Mới nhất trước")).toBeInTheDocument();
  });

  it("H2 (full): groups the heading+count and the sort label+segment into one row, sharing a common flex parent (HomeWeb's bottom-aligned header)", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);
    listRolls.mockResolvedValue([]);

    renderHome(await Home());

    const heading = screen.getByRole("heading", { level: 1, name: "Kệ của Trúc" });
    const headingBlock = heading.parentElement;
    const sortLabel = screen.getByText("Mới nhất trước");
    const controlsBlock = sortLabel.parentElement;

    expect(headingBlock).not.toBeNull();
    expect(controlsBlock).not.toBeNull();
    // Both blocks are direct children of the same header row (`HomeWeb`'s
    // `justify-content: space-between; align-items: flex-end` row).
    expect(headingBlock?.parentElement).toBe(controlsBlock?.parentElement);
  });

  it("N1: names an unnamed roll 'Cuộn #{number}' instead of the stock name", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);
    listRolls.mockResolvedValue([makeRoll({ id: "roll-16", name: null, number: 16 })]);

    renderHome(await Home());

    expect(screen.getByRole("link", { name: /Cuộn #16/ })).toHaveAttribute("href", "/rolls/roll-16");
  });

  it("shows the Kệ/Lưới switch with Kệ current and Lưới ready", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);
    listRolls.mockResolvedValue([]);

    renderHome(await Home());

    const views = screen.getByRole("group", { name: "Cách xem" });
    expect(within(views).getByRole("link", { name: /Kệ/ })).toHaveAttribute("aria-current", "page");
    expect(within(views).getByRole("link", { name: /Lưới/ })).not.toHaveAttribute("aria-disabled");
    expect(within(views).getByRole("link", { name: /Lưới/ })).toHaveAttribute("href", "/?view=grid");
  });

  it.each([
    ["the URL", { view: "grid" }, undefined],
    ["the remembered cookie", {}, "grid"],
  ])("shows the library grid when %s asks for it (COL-3)", async (_, query, cookie) => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);
    listRolls.mockResolvedValue([makeRoll({ id: "roll-1", name: "Hội An" })]);
    if (cookie) cookieValues.set("cuon_library_view", cookie);

    renderHome(await Home(query));

    expect(collection.listLibraryAction).toHaveBeenCalledWith({ filter: "all" });
    // A grid with frames doesn't need the roll list, nor a second totals call.
    expect(listRolls).not.toHaveBeenCalled();
    expect(collection.libraryTotalsAction).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { level: 2, name: "Sài Gòn đêm" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Xem cả cuộn/ })).toHaveAttribute("href", "/rolls/roll-9");
    expect(screen.getByText("3 CUỘN · 108 TẤM · 16 TẤM ƯNG")).toBeInTheDocument();
    const views = screen.getByRole("group", { name: "Cách xem" });
    expect(within(views).getByRole("link", { name: /Lưới/ })).toHaveAttribute("aria-current", "page");
    // The shelf's canisters aren't drawn under the grid.
    expect(screen.queryByRole("link", { name: /Hội An/ })).toBeNull();
  });

  it("passes the grid's filter, keeping it on the Lưới link, and never 'blank'", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);
    listRolls.mockResolvedValue([]);

    renderHome(await Home({ view: "grid", filter: "keeper" }));
    expect(collection.listLibraryAction).toHaveBeenLastCalledWith({ filter: "keeper" });
    const views = screen.getByRole("group", { name: "Cách xem" });
    expect(within(views).getByRole("link", { name: /Lưới/ })).toHaveAttribute("href", "/?view=grid&filter=keeper");
  });

  it("falls back to 'all' for a blank or unknown grid filter", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);
    listRolls.mockResolvedValue([]);

    renderHome(await Home({ view: "grid", filter: "blank" }));
    expect(collection.listLibraryAction).toHaveBeenLastCalledWith({ filter: "all" });
  });

  it("the empty Tấm ưng grid points at the newest roll", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);
    listRolls.mockResolvedValue([makeRoll({ id: "roll-new", name: "Đà Lạt, tháng 10" }), makeRoll({ id: "roll-old", name: "Huế" })]);
    collection.listLibraryAction.mockResolvedValue(libraryPage({ groups: [], counts: { all: 108, keeper: 0, oops: 7 } }));

    renderHome(await Home({ view: "grid", filter: "keeper" }));
    expect(screen.getByText("Chưa có tấm ưng nào")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mở cuộn Đà Lạt, tháng 10" })).toHaveAttribute("href", "/rolls/roll-new?view=grid");
  });

  it("describes the page for search and link previews", async () => {
    const metadata = await generateMetadata();
    expect(metadata.description).toMatch(/^Cuộn là nơi cất cuộn phim của bạn/);
  });
});
