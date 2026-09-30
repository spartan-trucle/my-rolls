import type { ReactNode } from "react";
import { ShellUploadTray } from "@/features/uploads/components/ShellUploadTray";
import { BottomTabs } from "./BottomTabs";
import styles from "./AppShell.module.css";
import { PhoneTopBar } from "./PhoneTopBar";
import { TopNav } from "./TopNav";

export interface AppShellProps {
  children: ReactNode;
  /** Uppercase first letter of the signed-in user's name, for the avatar. */
  userInitial: string;
}

/**
 * The signed-in chrome (D15, D18): `TopNav` at 1024px and up, `PhoneTopBar`
 * (G1) + `BottomTabs` below it — one CSS breakpoint decides which shows,
 * not a client-side viewport check, so there's no layout flash and no JS
 * needed to pick. Wraps `/` directly (page.tsx) and every route under
 * `src/app/(app)/` through that segment's `layout.tsx`. The upload tray
 * shows here; its queue (`UploadProvider`) lives in the root layout (D16).
 */
export function AppShell({ children, userInitial }: AppShellProps) {
  return (
    <>
      <div className={styles.shell}>
        <TopNav userInitial={userInitial} className={styles.topNav} />
        <PhoneTopBar userInitial={userInitial} className={styles.phoneTopBar} />
        <main className={styles.content}>{children}</main>
        <BottomTabs userInitial={userInitial} className={styles.bottomTabs} />
      </div>
      <ShellUploadTray />
    </>
  );
}
