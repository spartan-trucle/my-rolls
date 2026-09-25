import { Hero } from "./Hero";
import { Join } from "./Join";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import styles from "./Landing.module.css";
import { RollStrip } from "./RollStrip";
import { Shelf } from "./Shelf";
import { Story } from "./Story";

/**
 * The landing page for signed-out visitors, built from the design canvas
 * boards `Main-vi` (1440px) and `Mobile-vi` (390px). The canvas is reference
 * only: where it disagrees with the PRD or the design system, those win
 * (Google-only sign-up, glossary words, a drawn canister instead of a
 * branded one).
 */
export function Landing() {
  return (
    <div className={styles.page}>
      <LandingHeader />
      <main>
        <Hero />
        <RollStrip />
        <Story />
        <Shelf />
        <Join />
      </main>
      <LandingFooter />
    </div>
  );
}
