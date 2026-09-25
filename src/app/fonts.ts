import { Be_Vietnam_Pro, Fraunces, Patrick_Hand, Space_Mono } from "next/font/google";

// Variable names must match FONT_VARIABLES in src/design-system/tokens/build.ts.
const fraunces = Fraunces({
  subsets: ["latin", "vietnamese"],
  axes: ["opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

const patrickHand = Patrick_Hand({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  variable: "--font-patrick-hand",
  display: "swap",
});

/** Class names that set the four font variables; put them on <html>. */
export const fontVariables = [fraunces, beVietnamPro, spaceMono, patrickHand]
  .map((font) => font.variable)
  .join(" ");
