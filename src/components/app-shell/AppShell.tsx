import type { ReactNode } from "react";
import { UploadProvider } from "@/features/uploads/client/UploadProvider";
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
 * `src/app/(app)/` through that segment's `layout.tsx`. `UploadProvider`
 * (Phase 2 D16) wraps it all, so an upload keeps going across app pages.
 */
export function AppShell({ children, userInitial }: AppShellProps) {
  return (
    <UploadProvider>
      <div className={styles.shell}>
        <TopNav userInitial={userInitial} className={styles.topNav} />
        <PhoneTopBar userInitial={userInitial} className={styles.phoneTopBar} />
        <main className={styles.content}>{children}</main>
        <BottomTabs userInitial={userInitial} className={styles.bottomTabs} />
      </div>
    </UploadProvider>
  );
}
