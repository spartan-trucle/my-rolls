"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";

/** D15: where the Tấm ưng tab goes — the library grid, filtered to tấm ưng. */
export const KEEPERS_HREF = "/?view=grid&filter=keeper";

/** Ruling R28: Tấm ưng is current only on `/` with `view=grid&filter=keeper`. */
export function isKeepersView(pathname: string, params: URLSearchParams | null): boolean {
  return pathname === "/" && params?.get("view") === "grid" && params.get("filter") === "keeper";
}

export interface LibraryNavLinkProps {
  /** `shelf` is Kệ (`/`); `keepers` is Tấm ưng. */
  tab: "shelf" | "keepers";
  /** Kệ only: where else it reads as current (TopNav adds `/rolls/*`, G5). Defaults to `/` alone. */
  shelfCurrent?: (pathname: string) => boolean;
  className?: string;
  children: ReactNode;
}

interface IInnerProps extends LibraryNavLinkProps {
  params: URLSearchParams | null;
}

function Inner({ tab, shelfCurrent = (p) => p === "/", params, className, children }: IInnerProps) {
  const pathname = usePathname();
  const keepers = isKeepersView(pathname, params);
  const current = tab === "keepers" ? keepers : !keepers && shelfCurrent(pathname);
  return (
    <Link href={tab === "keepers" ? KEEPERS_HREF : "/"} aria-current={current ? "page" : undefined} className={className}>
      {children}
    </Link>
  );
}

function WithParams(props: LibraryNavLinkProps) {
  // `ReadonlyURLSearchParams` reads like `URLSearchParams`; only `get` is used.
  const params = useSearchParams() as URLSearchParams | null;
  return <Inner {...props} params={params} />;
}

/**
 * Kệ and Tấm ưng both point at `/`, told apart by the query (D15). Only
 * these two links read the search params, each behind its own `Suspense`,
 * so the rest of the shell never waits on them; until they're known the
 * link renders as if there were none (Kệ current on `/`).
 */
export function LibraryNavLink(props: LibraryNavLinkProps) {
  return (
    <Suspense fallback={<Inner {...props} params={null} />}>
      <WithParams {...props} />
    </Suspense>
  );
}
