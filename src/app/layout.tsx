import type { Metadata } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cuộn",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={fontVariables}>
      <body className="rc-paper min-h-dvh">{children}</body>
    </html>
  );
}
