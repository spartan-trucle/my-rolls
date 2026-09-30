import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { UploadProvider } from "@/features/uploads/client/UploadProvider";
import { themeCookieToDataTheme } from "@/lib/theme";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cuộn",
};

/**
 * Inputs are 14px on phones (design system bd24, body-mobile), and iOS Safari zooms into any
 * input under 16px. maximum-scale=1 stops that focus zoom; iOS still allows pinch-zoom.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const dataTheme = themeCookieToDataTheme(cookieStore.get("theme")?.value);

  return (
    <html lang="vi" className={fontVariables} data-theme={dataTheme} data-scroll-behavior="smooth">
      <body className="rc-paper min-h-dvh">
        <NextIntlClientProvider>
          {/* Phase 2 D16: one upload queue for the whole app. Home and the (app) pages each render
              their own AppShell, so the provider lives here to survive navigating between them. */}
          <UploadProvider>{children}</UploadProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
