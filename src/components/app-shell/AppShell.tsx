import type { ReactNode } from "react";
import { BottomTabs } from "./BottomTabs";
import styles from "./AppShell.module.css";
import { TopNav } from "./TopNav";

export interface AppShellProps {
  children: ReactNode;
  /** Uppercase first letter of the signed-in user's name, for the avatar. */
  userInitial: string;
}

/**
 * The signed-in chrome (D15, D18): `TopNav` at 1024px and up, `BottomTabs`
 * below it — one CSS breakpoint decides which shows, not a client-side
 * viewport check, so there's no layout flash and no JS needed to pick.
 * Wraps `/` directly (page.tsx) and every route under `src/app/(app)/`
 * through that segment's `layout.tsx`.
 */
export function AppShell({ children, userInitial }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <TopNav userInitial={userInitial} className={styles.topNav} />
      <main className={styles.content}>{children}</main>
      <BottomTabs userInitial={userInitial} className={styles.bottomTabs} />
    </div>
  );
}
