import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { themeCookieToDataTheme } from "@/lib/theme";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cuộn",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const dataTheme = themeCookieToDataTheme(cookieStore.get("theme")?.value);

  return (
    <html lang="vi" className={fontVariables} data-theme={dataTheme} data-scroll-behavior="smooth">
      <body className="rc-paper min-h-dvh">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
