# Design System Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. In this repo the executor is the `fe-plan-executor` agent.

**Goal:** Scaffold the Cuộn Next.js app and build its design-system foundation: the artifact's tokens generated into CSS variables and a Tailwind v4 theme, the four fonts with Vietnamese glyphs, the nine design-system components as typed React components, and a dev-only showcase page.

**Architecture:** `design-tokens/tokens.json` is a verbatim copy of the design-system artifact's `project/tokens.json`. A pure function (`buildTokensCss`) turns it into `src/styles/tokens.css`: themed CSS variables (Paper on `:root`, Darkroom via `prefers-color-scheme` or `data-theme="dark"`) plus Tailwind v4 `@theme` blocks, so utilities (`bg-cobalt`, `text-title`, `rounded-sm`) and CSS Modules (`var(--cobalt)`) read the same names. Components port the artifact's `bundle.js` / `bundle.css` into `src/design-system/components/<Name>/` with co-located CSS Modules. They hold no UI copy: every visible or accessible string is a prop.

**Tech Stack:** Next.js 16.3.6 (App Router, Turbopack), React 19.2, TypeScript 5, Tailwind CSS 4, `next/font/google`, Vitest 5 + Testing Library + jsdom, `tsx` for scripts, pnpm 11, Node 22.

**Spec:** No separate spec. The plan implements:
- [Design system artifact](https://claude.ai/artifact/HtsG9sZeNGx19PSvPjW65a) at version `1790316098-92bd` (`project/tokens.json`, `project/components/bundle.{js,css}`, `project/components/index.d.ts`, `project/components/<Name>/README.md`), mirrored in [docs/design/design-system.md](../../docs/design/design-system.md)
- [ADR-001](../../docs/architecture/adr-001-tech-stack.md#decision): Next.js App Router, Tailwind mapped to design tokens, Vercel
- [Roadmap](../../docs/roadmap.md) Phase 0, first item: "Repo, Next.js + Tailwind mapped to design tokens"
- Decisions taken in the planning session (25.09.2026): CSS Modules for components + Tailwind for pages; a dev-only route instead of Storybook; components take copy as props with no defaults

## Global Constraints

- Product name in code and docs: **Cuộn**. Token names and component names stay as in the artifact (`cobalt`, `ink-muted`, `space-4`, `RollCard`, …). Don't rename them.
- Vietnamese is the UI language. `<html lang="vi">`. Components contain **no UI copy**: labels, titles, hints and accessible names come in as props. Film notation (`ISO`, `EXP`, frame numbers, `▸12A`) is data, not copy, and stays in code.
- Fonts: Fraunces (display), Be Vietnam Pro (sans), Space Mono (mono), Patrick Hand (hand). Load them through `next/font/google` with the `vietnamese` subset. No `@import` from fonts.googleapis.com.
- Colours come only from tokens. Tailwind's default palette, font, text, radius and shadow scales are reset (`--color-*: initial` and so on), so `bg-blue-500` does not exist.
- Spacing: Tailwind's default 4px step equals the `space-*` tokens. In pages, use only `1, 2, 3, 4, 6, 8, 12, 16` (`p-4` = `space-4` = 16px).
- Every interactive element: 2px solid `var(--focus)` outline, 3px offset. Disabled: `opacity: .45`, no hover movement. Touch targets ≥ 44px (36px for `size="sm"`).
- Motion is 150–200 ms ease, and `prefers-reduced-motion: reduce` removes it.
- `pin` is never a button or link colour. The upload drag-over state is `cobalt-soft` + `cobalt` (the artifact's own `bundle.css`; see Known conflict 7).
- TDD: write the test, watch it fail, implement, watch it pass. Tests import `describe/it/expect/vi` from `vitest` explicitly (no globals).
- Commits: title only, `type(cuon): what changed`, under the user's git identity. **No body and no trailers: no `Co-Authored-By`, no `Claude-Session`.** One commit per task, with tests passing.
- Branch: `feature/design-system-foundation` off `main` (already created; it holds the plan and the doc-sync commits).
- Don't edit `docs/design/design-system.md` or `docs/roadmap.md` (mirrors) in any task. Task 15 lists the doc changes, and they need the user's yes.

---

## File structure

```
.nvmrc                                         Node 22
package.json · pnpm-lock.yaml · pnpm-workspace.yaml
next.config.ts · postcss.config.mjs · eslint.config.mjs · tsconfig.json   (from create-next-app)
vitest.config.mts · vitest.setup.ts            test harness
design-tokens/
  tokens.json                                  verbatim copy of the artifact's project/tokens.json
  README.md                                    source, version, sha256, how to re-pull and regenerate
scripts/build-tokens.ts                        CLI: tokens.json → src/styles/tokens.css
src/
  styles/
    tokens.css                                 GENERATED: CSS vars per theme + Tailwind @theme blocks
    base.css                                   body, .rc-paper grain, .rc-sticker, [data-theme] scope, focus, reduced motion
  app/
    globals.css                                imports tailwindcss, tokens.css, base.css
    fonts.ts                                   next/font loaders → CSS variables named in FONT_VARIABLES
    layout.tsx                                 <html lang="vi">, font variables, paper background
    page.tsx                                   placeholder home ("Cuộn" in Fraunces 600)
    dev/design-system/
      page.tsx                                 dev-only showcase route (404 when VERCEL_ENV=production)
      Showcase.tsx                             tokens, type and component gallery
      demos.tsx                                'use client' demos that need handlers (UploadDrop)
  design-system/
    index.ts                                   public barrel
    cx.ts                                      className joiner
    tokens/
      types.ts                                 TokensFile type
      build.ts                                 buildTokensCss(), fontStack(), FONT_VARIABLES
      contrast.ts                              WCAG contrast helpers
    components/
      Icon/      Icon.tsx · Icon.module.css · icons.ts · Icon.test.tsx
      Button/    Button.tsx · Button.module.css · Button.test.tsx
      Stamp/     Stamp.tsx · Stamp.module.css · Stamp.test.tsx
      Scribble/  Scribble.tsx · Scribble.module.css · Scribble.test.tsx
      Field/     Field.tsx · Field.module.css · Field.test.tsx
      Print/     Print.tsx · Print.module.css · Print.test.tsx
      FilmStrip/ FilmStrip.tsx · FilmStrip.module.css · FilmStrip.test.tsx
      RollCard/  RollCard.tsx · RollCard.module.css · RollCard.test.tsx
      UploadDrop/UploadDrop.tsx · UploadDrop.module.css · UploadDrop.test.tsx
```

Tests sit next to the code they cover (`*.test.ts(x)`).

**Out of scope:** `next-intl` (its own Phase 0 item), a theme toggle (Darkroom follows the OS; `data-theme` exists for scoping and a later toggle), the artifact's `Cover` and `RollPage` previews, sticker/doodle SVG assets (no screen uses them yet), Storybook, visual regression tooling, and any product screen.

---

### Task 1: Scaffold the Next.js app and test harness

**Files:**
- Create (from create-next-app): `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `tsconfig.json`, `.gitignore`, `next-env.d.ts` (ignored), `src/app/{layout.tsx,page.tsx,globals.css}`
- Create: `.nvmrc`, `vitest.config.mts`, `vitest.setup.ts`, `src/design-system/cx.ts`
- Test: `src/design-system/cx.test.ts`

**Interfaces:**
- Produces: `cx(...parts: Array<string | false | null | undefined>): string` at `@/design-system/cx`. The `@/*` alias → `src/*` in both Next and Vitest. Scripts `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check`.

- [ ] **Step 1: Check the branch**

The branch already exists. Confirm you are on it and the tree is clean:

```bash
git branch --show-current   # feature/design-system-foundation
git status --short          # empty
```

- [ ] **Step 2: Scaffold in a temp directory and copy it in**

`create-next-app` refuses a folder that already has `CLAUDE.md`, `.claude/` and `.planning/`, so scaffold next door and copy. Keep the repo's `README.md`. Drop the Next/Vercel sample images and the default favicon (the design system has no logo).

```bash
pnpm dlx create-next-app@16.3.6 /tmp/cuon-scaffold --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --disable-git --no-agents-md --yes
rsync -a --exclude node_modules --exclude .next --exclude README.md --exclude public --exclude src/app/favicon.ico /tmp/cuon-scaffold/ ./
rm -rf /tmp/cuon-scaffold
pnpm install
```

Expected: `package.json` has `next 16.3.6`, `react 19.2.x`, `tailwindcss ^4`, `typescript ^5`, `"packageManager": "pnpm@11.x"`. Keep TypeScript on `^5`. Don't move to TypeScript 7; Next 16's plugin hasn't been checked against it.

- [ ] **Step 3: Set the package name, Node version and pnpm build approvals**

In `package.json` set `"name": "cuon"`, add `"engines": { "node": ">=22" }`, and replace `"scripts"` with:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "tokens": "tsx scripts/build-tokens.ts",
  "check": "pnpm lint && pnpm typecheck && pnpm test && pnpm build"
}
```

Create `.nvmrc`:

```
22
```

pnpm 11 stops `install` until every dependency with a build script is approved or denied. `tsx` pulls in `esbuild`, which needs its build. Replace `pnpm-workspace.yaml` with:

```yaml
allowBuilds:
  esbuild: true
  sharp: false
  unrs-resolver: false
```

- [ ] **Step 4: Install the test tooling**

```bash
pnpm add -D vitest@5.0.1 @vitejs/plugin-react@6.1.1 jsdom@30.1.1 @testing-library/react@16.3.3 @testing-library/dom @testing-library/jest-dom@7.0.1 @testing-library/user-event@14.6.7 tsx
```

Expected: exits 0 with no `ERR_PNPM_IGNORED_BUILDS`.

- [ ] **Step 5: Configure Vitest**

Create `vitest.config.mts`:

```ts
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // CSS Modules resolve to their plain class names (styles.primary === "primary").
    css: { include: [/\.module\.css$/], modules: { classNameStrategy: "non-scoped" } },
  },
});
```

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());
```

- [ ] **Step 6: Write the failing test for `cx`**

Create `src/design-system/cx.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cx } from "./cx";

describe("cx", () => {
  it("joins truthy class names with a space", () => {
    expect(cx("a", "b", "c")).toBe("a b c");
  });

  it("drops false, null, undefined and empty strings", () => {
    expect(cx("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("returns an empty string when nothing is truthy", () => {
    expect(cx(false, undefined)).toBe("");
  });
});
```

- [ ] **Step 7: Run it and watch it fail**

Run: `pnpm test src/design-system/cx.test.ts`
Expected: FAIL, `Failed to resolve import "./cx"`.

- [ ] **Step 8: Implement `cx`**

Create `src/design-system/cx.ts`:

```ts
export type ClassPart = string | false | null | undefined;

/** Joins class names, skipping falsy parts. */
export function cx(...parts: ClassPart[]): string {
  return parts.filter(Boolean).join(" ");
}
```

- [ ] **Step 9: Run the checks**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: 3 tests pass. The typecheck, lint and build succeed (the scaffold's page still renders).

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "chore(cuon): scaffold Next.js 16 app with Vitest harness"
```

---

### Task 2: Generate CSS variables and the Tailwind theme from `tokens.json`

**Files:**
- Create: `design-tokens/tokens.json`, `design-tokens/README.md`
- Create: `src/design-system/tokens/types.ts`, `src/design-system/tokens/build.ts`, `scripts/build-tokens.ts`
- Create (generated): `src/styles/tokens.css`
- Test: `src/design-system/tokens/build.test.ts`, `src/design-system/tokens/tokens-css.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `TokensFile`, `ThemedValue`, `Theme` (`"light" | "dark"`), `TypeStyle` types from `@/design-system/tokens/types`
  - `FONT_VARIABLES: { display: "--font-fraunces"; sans: "--font-be-vietnam-pro"; mono: "--font-space-mono"; hand: "--font-patrick-hand" }` and `type FontFamilyToken = keyof typeof FONT_VARIABLES` from `@/design-system/tokens/build`
  - `fontStack(tokens: TokensFile, family: FontFamilyToken): string`
  - `buildTokensCss(tokens: TokensFile): string`
  - CSS variables every later task uses: `--<colour>` (for example `--cobalt`, `--ink-muted`, `--on-print-pin`), `--shadow-print|lift|pin`, `--space-1…16`, `--tilt-none|left|right|wild`, `--grain-opacity`, `--font-display|sans|mono|hand`, `--radius-none|sm|md|lg|pill`, `--text-<style>` plus `--text-<style>--line-height|--font-weight|--letter-spacing`
  - Tailwind utilities: `bg-<colour>`, `text-<colour>`, `border-<colour>`, `font-<family>`, `text-<style>`, `rounded-<radius>`

- [ ] **Step 1: Copy the token source**

The orchestrating session pulled `project/tokens.json` from the design-system artifact at version `1790316098-92bd` and saved it at `/private/tmp/claude-502/-Users-trucle-Documents-Spartan-tech-learn-my-rolls/ecf49434-4201-4cf1-9859-aa21bf15dd8e/scratchpad/handoff/project/tokens.json`. Copy it **byte for byte**; don't retype it:

```bash
mkdir -p design-tokens
cp /private/tmp/claude-502/-Users-trucle-Documents-Spartan-tech-learn-my-rolls/ecf49434-4201-4cf1-9859-aa21bf15dd8e/scratchpad/handoff/project/tokens.json design-tokens/tokens.json
```

If that file is missing, stop and ask the orchestrating session for it.

Verify:

```bash
shasum -a 256 design-tokens/tokens.json
```

Expected: `804b415fb62469bc7997c902141d43a4138fb588d4baed42d16b4fa64d38d86a`. On a mismatch the artifact has moved since this plan was written: stop, and tell the user that the design-system mirror needs a re-sync first (CLAUDE.md sync rule 2).

Create `design-tokens/README.md`:

```markdown
# Design tokens

`tokens.json` is a verbatim copy of `project/tokens.json` from the [design system artifact](https://claude.ai/artifact/HtsG9sZeNGx19PSvPjW65a). The artifact is the source of truth; never edit this file by hand.

| Pulled | Artifact version | sha256 |
|---|---|---|
| 25.09.2026 | `1790316098-92bd` | `804b415fb62469bc7997c902141d43a4138fb588d4baed42d16b4fa64d38d86a` |

## Update

1. Re-sync the mirror `docs/design/design-system.md` (CLAUDE.md sync rules).
2. Pull `project/tokens.json` from the artifact over this file and update the table above.
3. Run `pnpm tokens` to regenerate `src/styles/tokens.css`, then `pnpm test`. The drift test fails if step 3 was skipped, and the contrast test fails if a new colour breaks a pairing.
```

- [ ] **Step 2: Write the token types**

Create `src/design-system/tokens/types.ts`:

```ts
export interface ThemedValue {
  light: string;
  dark: string;
}

export type Theme = keyof ThemedValue;

export interface NamedToken<V = string> {
  name: string;
  value: V;
  usage: string;
}

export interface TypeStyle {
  name: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
  sample: string;
  usage: string;
}

/** Shape of design-tokens/tokens.json (the design-system artifact's project/tokens.json). */
export interface TokensFile {
  name: string;
  version: number;
  color: { themes: Array<{ id: string; name: string }>; tokens: Array<NamedToken<ThemedValue>> };
  type: {
    families: Record<"display" | "sans" | "mono" | "hand", string>;
    groups: Array<{ name: string; family: string; styles: TypeStyle[] }>;
  };
  spacing: { tokens: NamedToken[] };
  radius: { tokens: NamedToken[] };
  shadow: { tokens: Array<NamedToken<ThemedValue>> };
  tilt: { tokens: NamedToken[] };
  opacity: { tokens: NamedToken[] };
}
```

- [ ] **Step 3: Write the failing generator tests**

Create `src/design-system/tokens/build.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import tokens from "../../../design-tokens/tokens.json";
import { FONT_VARIABLES, buildTokensCss, fontStack } from "./build";
import type { TokensFile } from "./types";

const file: TokensFile = tokens;
const css = buildTokensCss(file);

/** Body of the first rule whose selector is exactly `selector`. */
function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start, `missing block "${selector}"`).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf("}", start));
}

const resolve = (value: string) => value.replace(/^\{([a-z0-9-]+)\}$/, "var(--$1)");

describe("buildTokensCss", () => {
  it("starts with a do-not-edit header", () => {
    expect(css.startsWith("/* Generated by scripts/build-tokens.ts")).toBe(true);
  });

  it("declares every colour with its Paper value on :root", () => {
    const root = block(":root");
    for (const t of file.color.tokens) {
      expect(root).toContain(`--${t.name}: ${resolve(t.value.light)};`);
    }
  });

  it("declares every colour with its Darkroom value for data-theme=dark and for a dark OS preference", () => {
    const explicit = block('[data-theme="dark"]');
    const media = block(':root:not([data-theme="light"])');
    for (const t of file.color.tokens) {
      expect(explicit).toContain(`--${t.name}: ${resolve(t.value.dark)};`);
      expect(media).toContain(`--${t.name}: ${resolve(t.value.dark)};`);
    }
    expect(css).toContain("@media (prefers-color-scheme: dark) {");
  });

  it("re-declares Paper values for data-theme=light so a light scope works inside a dark page", () => {
    const light = block('[data-theme="light"]');
    for (const t of file.color.tokens) {
      expect(light).toContain(`--${t.name}: ${resolve(t.value.light)};`);
    }
  });

  it("resolves the focus alias in every theme block", () => {
    expect(css).not.toContain("{cobalt}");
    for (const sel of [":root", '[data-theme="dark"]', '[data-theme="light"]', ':root:not([data-theme="light"])']) {
      expect(block(sel)).toContain("--focus: var(--cobalt);");
    }
  });

  it("themes the shadows", () => {
    for (const t of file.shadow.tokens) {
      expect(block(":root")).toContain(`--${t.name}: ${t.value.light};`);
      expect(block('[data-theme="dark"]')).toContain(`--${t.name}: ${t.value.dark};`);
    }
  });

  it("sets color-scheme per theme", () => {
    expect(block(":root")).toContain("color-scheme: light;");
    expect(block('[data-theme="dark"]')).toContain("color-scheme: dark;");
  });

  it("puts spacing, tilt and grain opacity on :root", () => {
    const root = block(":root");
    expect(root).toContain("--space-4: 16px;");
    expect(root).toContain("--space-16: 64px;");
    expect(root).toContain("--tilt-wild: -4deg;");
    expect(root).toContain("--grain-opacity: 0.07;");
  });

  it("resets Tailwind's default scales in @theme static", () => {
    const theme = block("@theme static");
    for (const ns of ["color", "font", "text", "radius", "shadow"]) {
      expect(theme).toContain(`--${ns}-*: initial;`);
    }
  });

  it("maps font families onto the next/font variables", () => {
    const theme = block("@theme static");
    expect(theme).toContain('--font-display: var(--font-fraunces), Georgia, "Times New Roman", serif;');
    expect(theme).toContain('--font-hand: var(--font-patrick-hand), "Segoe Print", cursive;');
  });

  it("emits every text style with its line height, weight and tracking", () => {
    const theme = block("@theme static");
    expect(theme).toContain("--text-display-hero: 88px;");
    expect(theme).toContain("--text-display-hero--line-height: 84px;");
    expect(theme).toContain("--text-display-hero--font-weight: 500;");
    expect(theme).toContain("--text-display-hero--letter-spacing: -0.025em;");
    expect(theme).toContain("--text-label--letter-spacing: 0.08em;");
    expect(theme).not.toContain("--text-title--letter-spacing");
    const styleCount = file.type.groups.flatMap((g) => g.styles).length;
    expect(theme.match(/--text-[a-z-]+: \d+px;/g)).toHaveLength(styleCount);
  });

  it("emits the radius tokens under Tailwind's radius namespace", () => {
    const theme = block("@theme static");
    expect(theme).toContain("--radius-sm: 2px;");
    expect(theme).toContain("--radius-pill: 999px;");
  });

  it("maps every colour to a Tailwind colour utility in @theme inline", () => {
    const inline = block("@theme inline");
    for (const t of file.color.tokens) {
      expect(inline).toContain(`--color-${t.name}: var(--${t.name});`);
    }
  });
});

describe("fontStack", () => {
  it("swaps the first quoted family for the next/font variable", () => {
    expect(fontStack(file, "sans")).toBe(
      'var(--font-be-vietnam-pro), system-ui, -apple-system, "Segoe UI", sans-serif',
    );
  });

  it("has a next/font variable for every family in tokens.json", () => {
    expect(Object.keys(FONT_VARIABLES).sort()).toEqual(Object.keys(file.type.families).sort());
  });
});
```

- [ ] **Step 4: Run them and watch them fail**

Run: `pnpm test src/design-system/tokens/build.test.ts`
Expected: FAIL, `Failed to resolve import "./build"`.

- [ ] **Step 5: Implement the generator**

Create `src/design-system/tokens/build.ts`:

```ts
import type { Theme, TokensFile } from "./types";

/** CSS variables that next/font sets on <html> for each family (see src/app/fonts.ts). */
export const FONT_VARIABLES = {
  display: "--font-fraunces",
  sans: "--font-be-vietnam-pro",
  mono: "--font-space-mono",
  hand: "--font-patrick-hand",
} as const;

export type FontFamilyToken = keyof typeof FONT_VARIABLES;

const HEADER =
  "/* Generated by scripts/build-tokens.ts from design-tokens/tokens.json. Do not edit: run `pnpm tokens`. */";

const decl = (name: string, value: string) => `  --${name}: ${value};`;

/** `{cobalt}` → `var(--cobalt)`; anything else is returned as is. */
const resolveAlias = (value: string) => value.replace(/^\{([a-z0-9-]+)\}$/, "var(--$1)");

function rule(selector: string, lines: string[], indent = ""): string {
  return [`${indent}${selector} {`, ...lines.map((l) => indent + l), `${indent}}`].join("\n");
}

function themed(tokens: TokensFile, theme: Theme): string[] {
  return [
    ...tokens.color.tokens.map((t) => decl(t.name, resolveAlias(t.value[theme]))),
    ...tokens.shadow.tokens.map((t) => decl(t.name, t.value[theme])),
    `  color-scheme: ${theme};`,
  ];
}

/** The family's stack with its first (quoted) family replaced by the next/font variable. */
export function fontStack(tokens: TokensFile, family: FontFamilyToken): string {
  return tokens.type.families[family].replace(/^"[^"]+"/, `var(${FONT_VARIABLES[family]})`);
}

export function buildTokensCss(tokens: TokensFile): string {
  const staticVars = [
    ...tokens.spacing.tokens.map((t) => decl(t.name, t.value)),
    ...tokens.tilt.tokens.map((t) => decl(t.name, t.value)),
    ...tokens.opacity.tokens.map((t) => decl(t.name, t.value)),
  ];

  const families = Object.keys(FONT_VARIABLES) as FontFamilyToken[];
  const textStyles = tokens.type.groups
    .flatMap((g) => g.styles)
    .flatMap((s) => [
      decl(`text-${s.name}`, s.fontSize),
      decl(`text-${s.name}--line-height`, s.lineHeight),
      decl(`text-${s.name}--font-weight`, String(s.fontWeight)),
      ...(s.letterSpacing ? [decl(`text-${s.name}--letter-spacing`, s.letterSpacing)] : []),
    ]);

  // `static` makes Tailwind emit every variable, so CSS Modules can read them too.
  const themeStatic = [
    decl("color-*", "initial"),
    decl("font-*", "initial"),
    decl("text-*", "initial"),
    decl("radius-*", "initial"),
    decl("shadow-*", "initial"),
    ...families.map((f) => decl(`font-${f}`, fontStack(tokens, f))),
    ...textStyles,
    ...tokens.radius.tokens.map((t) => decl(t.name, t.value)),
  ];

  // `inline` makes bg-cobalt compile to var(--cobalt), so utilities follow the active theme.
  const themeInline = tokens.color.tokens.map((t) => decl(`color-${t.name}`, `var(--${t.name})`));

  return [
    HEADER,
    "",
    rule(":root", [...themed(tokens, "light"), ...staticVars]),
    "",
    "@media (prefers-color-scheme: dark) {",
    rule(':root:not([data-theme="light"])', themed(tokens, "dark"), "  "),
    "}",
    "",
    rule('[data-theme="light"]', themed(tokens, "light")),
    "",
    rule('[data-theme="dark"]', themed(tokens, "dark")),
    "",
    rule("@theme static", themeStatic),
    "",
    rule("@theme inline", themeInline),
    "",
  ].join("\n");
}
```

- [ ] **Step 6: Run the generator tests**

Run: `pnpm test src/design-system/tokens/build.test.ts`
Expected: PASS (15 tests).

- [ ] **Step 7: Write the failing drift test**

Create `src/design-system/tokens/tokens-css.test.ts`:

```ts
// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import tokens from "../../../design-tokens/tokens.json";
import { buildTokensCss } from "./build";

it("src/styles/tokens.css matches design-tokens/tokens.json (run `pnpm tokens`)", () => {
  const committed = readFileSync(path.join(process.cwd(), "src/styles/tokens.css"), "utf8");
  expect(committed).toBe(buildTokensCss(tokens));
});
```

Run: `pnpm test src/design-system/tokens/tokens-css.test.ts`
Expected: FAIL, `ENOENT: no such file or directory … src/styles/tokens.css`.

- [ ] **Step 8: Write the CLI and generate the file**

Create `scripts/build-tokens.ts`:

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import tokens from "../design-tokens/tokens.json";
import { buildTokensCss } from "../src/design-system/tokens/build";

const out = path.join(process.cwd(), "src/styles/tokens.css");
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, buildTokensCss(tokens));
console.log(`Wrote ${path.relative(process.cwd(), out)}`);
```

Run: `pnpm tokens`
Expected: `Wrote src/styles/tokens.css`.

- [ ] **Step 9: Run all tests and the typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: PASS. If the typecheck rejects `const file: TokensFile = tokens`, fix `types.ts` to match the JSON. Don't cast.

- [ ] **Step 10: Commit**

```bash
git add design-tokens scripts src/design-system/tokens src/styles/tokens.css
git commit -m "feat(cuon): generate CSS variables and Tailwind theme from design tokens"
```

---

### Task 3: Lock the colour contrast claims with a test

The artifact's token notes promise contrast ratios ("8:1+ as text", "3:1 on paper"). This test holds every pairing in both themes to WCAG AA, so a future token change that breaks one fails CI. All pairs pass on today's tokens (checked while planning).

**Files:**
- Create: `src/design-system/tokens/contrast.ts`
- Test: `src/design-system/tokens/contrast.test.ts`

**Interfaces:**
- Consumes: `TokensFile`, `Theme` from Task 2.
- Produces: `relativeLuminance(hex: string): number`, `contrastRatio(a: string, b: string): number` from `@/design-system/tokens/contrast`.

- [ ] **Step 1: Write the failing test**

Create `src/design-system/tokens/contrast.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import tokens from "../../../design-tokens/tokens.json";
import { contrastRatio, relativeLuminance } from "./contrast";
import type { Theme, TokensFile } from "./types";

const file: TokensFile = tokens;

function colour(name: string, theme: Theme): string {
  const token = file.color.tokens.find((t) => t.name === name);
  if (!token) throw new Error(`No colour token "${name}"`);
  const alias = /^\{([a-z0-9-]+)\}$/.exec(token.value[theme]);
  return alias ? colour(alias[1], theme) : token.value[theme];
}

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for a colour on itself", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#2e3a80", "#2e3a80")).toBe(1);
  });

  it("does not depend on argument order", () => {
    expect(contrastRatio("#1f1a16", "#f2ede4")).toBe(contrastRatio("#f2ede4", "#1f1a16"));
  });

  it("rejects colours that are not #rrggbb", () => {
    expect(() => relativeLuminance("rgba(0, 0, 0, 0.5)")).toThrow(/#rrggbb/);
  });
});

// [foreground, background, minimum ratio]: text pairs are 4.5 (AA), control edges and focus 3.
const PAIRS: Array<[string, string, number]> = [
  ["ink", "paper", 4.5], ["ink", "paper-raised", 4.5], ["ink", "scrap", 4.5],
  ["ink-muted", "paper", 4.5], ["ink-muted", "paper-raised", 4.5], ["ink-muted", "scrap", 4.5],
  ["cobalt", "paper", 4.5], ["cobalt", "paper-raised", 4.5], ["cobalt", "cobalt-soft", 4.5],
  ["on-cobalt", "cobalt", 7],
  ["focus", "paper", 3], ["focus", "paper-raised", 3],
  ["line-strong", "paper", 3], ["line-strong", "paper-raised", 3],
  ["pin", "paper", 4.5], ["pin", "paper-raised", 4.5], ["pin", "pin-soft", 4.5], ["pin", "scrap", 4.5],
  ["keeper", "paper", 4.5], ["keeper", "paper-raised", 4.5], ["keeper", "scrap", 4.5],
  ["on-print", "print", 4.5], ["on-print-muted", "print", 4.5], ["on-print-pin", "print", 4.5],
  ["on-pin", "pin", 4.5], ["on-keeper", "keeper", 4.5],
  ["film-edge", "film", 4.5],
];

describe.each<Theme>(["light", "dark"])("token contrast (%s)", (theme) => {
  it.each(PAIRS)("%s on %s is at least %d:1", (fg, bg, min) => {
    expect(contrastRatio(colour(fg, theme), colour(bg, theme))).toBeGreaterThanOrEqual(min);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/design-system/tokens/contrast.test.ts`
Expected: FAIL, `Failed to resolve import "./contrast"`.

- [ ] **Step 3: Implement**

Create `src/design-system/tokens/contrast.ts`:

```ts
function channel(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.x relative luminance of a #rrggbb colour. */
export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`Expected a #rrggbb colour, got "${hex}"`);
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(match[1].slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two #rrggbb colours (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm test src/design-system/tokens/contrast.test.ts`
Expected: PASS (3 + 54 tests). If a pair fails, **don't change the threshold or the token.** Report the pair and ratio to the user: the fix belongs in the artifact.

- [ ] **Step 5: Commit**

```bash
git add src/design-system/tokens/contrast.ts src/design-system/tokens/contrast.test.ts
git commit -m "test(cuon): check design token contrast in both themes"
```

---

### Task 4: Fonts, global styles and root layout

**Files:**
- Create: `src/app/fonts.ts`, `src/styles/base.css`
- Modify: `src/app/globals.css` (replace), `src/app/layout.tsx` (replace), `src/app/page.tsx` (replace)
- Test: `src/app/fonts.test.ts`, `src/app/page.test.tsx`

**Interfaces:**
- Consumes: `FONT_VARIABLES` from Task 2; `src/styles/tokens.css`.
- Produces: `fontVariables: string` (the four next/font class names) from `@/app/fonts`. Global classes `rc-paper` (page grain) and `rc-sticker` (tilted sticker `<img>`, angle via `--rc-tilt`). Any element with `data-theme="light" | "dark"` repaints its own background and text in that theme.

- [ ] **Step 1: Write the failing font test**

Create `src/app/fonts.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { FONT_VARIABLES } from "@/design-system/tokens/build";

type LoaderOptions = { variable: string; subsets: string[] };
const calls = vi.hoisted(() => [] as Array<{ family: string; options: LoaderOptions }>);

vi.mock("next/font/google", () => {
  const loader = (family: string) => (options: LoaderOptions) => {
    calls.push({ family, options });
    return { variable: `var-${family}`, className: `cls-${family}`, style: { fontFamily: family } };
  };
  return {
    Fraunces: loader("Fraunces"),
    Be_Vietnam_Pro: loader("Be_Vietnam_Pro"),
    Space_Mono: loader("Space_Mono"),
    Patrick_Hand: loader("Patrick_Hand"),
  };
});

describe("fonts", () => {
  it("loads the four design-system families under the variables the tokens point at", async () => {
    const { fontVariables } = await import("./fonts");
    expect(calls.map((c) => c.options.variable).sort()).toEqual(Object.values(FONT_VARIABLES).sort());
    expect(fontVariables.split(" ")).toHaveLength(4);
  });

  it("includes Vietnamese glyphs in every family", async () => {
    await import("./fonts");
    for (const c of calls) expect(c.options.subsets, c.family).toContain("vietnamese");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/app/fonts.test.ts`
Expected: FAIL, `Failed to resolve import "./fonts"`.

- [ ] **Step 3: Implement the font loaders**

Create `src/app/fonts.ts`:

```ts
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
```

Run: `pnpm test src/app/fonts.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 4: Write the failing home page test**

Create `src/app/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Home from "./page";

it("shows the product name as the page heading", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1, name: "Cuộn" })).toBeInTheDocument();
});
```

Run: `pnpm test src/app/page.test.tsx`
Expected: FAIL. The scaffold page has no heading named "Cuộn".

- [ ] **Step 5: Replace the page, layout and global CSS**

Replace `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="mx-auto max-w-[1440px] px-4 py-12 md:px-16 md:py-16">
      {/* No logo: the name is set in Fraunces at weight 600. */}
      <h1 className="font-display text-display-l font-semibold">Cuộn</h1>
    </main>
  );
}
```

Replace `src/app/layout.tsx`:

```tsx
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
```

Replace `src/app/globals.css`:

```css
@import "tailwindcss";
@import "../styles/tokens.css";
@import "../styles/base.css";
```

Create `src/styles/base.css`:

```css
/* Page-level rules from the design system (artifact bundle.css, "page" and "Sticker"). */

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--text-body);
  line-height: var(--text-body--line-height);
  -webkit-font-smoothing: antialiased;
}

/* A themed scope repaints itself; inherited colours were resolved in the outer theme. */
[data-theme] {
  background: var(--paper);
  color: var(--ink);
}

/* Paper grain: over the page background only, never over photos. */
.rc-paper {
  position: relative;
  isolation: isolate;
  background: var(--paper);
}

.rc-paper::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: var(--grain-opacity);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* Die-cut stickers from the artifact's assets/Stickers; decorative, alt="". */
.rc-sticker {
  display: block;
  pointer-events: none;
  transform: rotate(var(--rc-tilt, 0deg));
}

:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 6: Run the tests and the build**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: all pass. `pnpm build` downloads the four fonts at build time, so it needs network.

- [ ] **Step 7: Look at it**

Run `pnpm dev`, open `http://localhost:3000`, and check:
- "Cuộn" is in Fraunces at weight 600, and the ộ diacritic sits correctly (not a fallback font).
- The background is warm paper `#f2ede4` with faint grain.
- With the OS or browser set to dark, the page turns Darkroom `#161311` with light ink.

- [ ] **Step 8: Commit**

```bash
git add src/app src/styles/base.css
git commit -m "feat(cuon): load design system fonts and global styles"
```

---

### Task 5: `Icon`

**Files:**
- Create: `src/design-system/components/Icon/icons.ts`, `Icon.tsx`, `Icon.module.css`
- Test: `src/design-system/components/Icon/Icon.test.tsx`

**Interfaces:**
- Consumes: `cx` (Task 1).
- Produces: `type IconName = "roll" | "film" | "camera" | "print" | "keeper" | "oops" | "friends" | "share" | "upload" | "note" | "menu"`, `ICON_NAMES: IconName[]`, `ICON_PATHS`, `interface IconProps { name: IconName; size?: number; label?: string; className?: string }`, `Icon(props: IconProps)`.

- [ ] **Step 1: Write the failing test**

Create `src/design-system/components/Icon/Icon.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "./Icon";
import { ICON_NAMES, ICON_PATHS } from "./icons";

describe("Icon", () => {
  it("has the eleven artifact icons", () => {
    expect(ICON_NAMES).toEqual([
      "roll", "film", "camera", "print", "keeper", "oops", "friends", "share", "upload", "note", "menu",
    ]);
  });

  it("is hidden from assistive tech when it has no label", () => {
    const { container } = render(<Icon name="share" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("is announced as an image when labelled", () => {
    render(<Icon name="keeper" label="Tấm ưng" />);
    expect(screen.getByRole("img", { name: "Tấm ưng" })).toBeInTheDocument();
  });

  it("defaults to 20px and takes a size", () => {
    const { container, rerender } = render(<Icon name="film" />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "20");
    rerender(<Icon name="film" size={14} />);
    expect(container.querySelector("svg")).toHaveAttribute("height", "14");
  });

  it("draws the artifact paths in currentColor with a 1.75 stroke", () => {
    const { container } = render(<Icon name="roll" />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("stroke-width", "1.75");
    expect(svg.querySelectorAll("path")).toHaveLength(ICON_PATHS.roll.length);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/design-system/components/Icon`
Expected: FAIL, `Failed to resolve import "./Icon"`.

- [ ] **Step 3: Implement**

Create `src/design-system/components/Icon/icons.ts` (paths copied from the artifact's `bundle.js`):

```ts
export const ICON_PATHS = {
  roll: ["M6 7h9a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z", "M8.5 7V4h4v3", "M5 11.5h11M5 16.5h11", "M16 11h3.5a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5H16"],
  film: ["M3 5h18v14H3z", "M7.5 9h9v6h-9z", "M6 7h.01M9.5 7h.01M13 7h.01M16.5 7h.01M6 17h.01M9.5 17h.01M13 17h.01M16.5 17h.01"],
  camera: ["M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z", "M8 7l1.5-3h5L16 7", "M12 10a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z", "M17.5 10h.01"],
  print: ["M4 3h16v18H4z", "M7 6h10v9H7z", "M7 13.5l3-3 2.5 2.5 1.5-1.5 3 3", "M14.5 8.5h.01"],
  keeper: ["M11 3c.9 4.9 2.6 6.6 7.5 7.5-4.9.9-6.6 2.6-7.5 7.5-.9-4.9-2.6-6.6-7.5-7.5C8.4 9.6 10.1 7.9 11 3z", "M19 17v4M17 19h4"],
  oops: ["M6 4l1.5 10M12 3v11M18 4l-1.5 10", "M7.8 19h.01M12 19.5h.01M16.2 19h.01"],
  friends: ["M9 4a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z", "M2.5 20c.4-3.6 3-6 6.5-6s6.1 2.4 6.5 6", "M15.5 4.3a3.5 3.5 0 0 1 0 6.4", "M18 14.5c2 .9 3.2 2.8 3.5 5.5"],
  share: ["M12 3v12", "M7.5 7.5L12 3l4.5 4.5", "M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"],
  upload: ["M12 16V4", "M7.5 8.5L12 4l4.5 4.5", "M4 20h16"],
  note: ["M4 20l1-4L16 5l3 3L8 19z", "M14 7l3 3", "M13 20h7"],
  menu: ["M4 7h16", "M4 12h16", "M4 17h10"],
} as const satisfies Record<string, readonly string[]>;

export type IconName = keyof typeof ICON_PATHS;

export const ICON_NAMES = Object.keys(ICON_PATHS) as IconName[];
```

Create `src/design-system/components/Icon/Icon.module.css`:

```css
.icon {
  display: inline-block;
  flex: 0 0 auto;
  vertical-align: middle;
}
```

Create `src/design-system/components/Icon/Icon.tsx`:

```tsx
import { cx } from "@/design-system/cx";
import styles from "./Icon.module.css";
import { ICON_PATHS, type IconName } from "./icons";

export interface IconProps {
  name: IconName;
  /** px. 20 in buttons and nav, 14 in stamps, 24 standalone. */
  size?: number;
  /** Accessible name. Leave it out when text next to the icon says the same thing. */
  label?: string;
  className?: string;
}

export function Icon({ name, size = 20, label, className }: IconProps) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
  return (
    <svg
      className={cx(styles.icon, className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...a11y}
    >
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm test src/design-system/components/Icon && pnpm typecheck`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/design-system/components/Icon
git commit -m "feat(cuon): add Icon component"
```

---

### Task 6: `Button`

**Files:**
- Create: `src/design-system/components/Button/Button.tsx`, `Button.module.css`
- Test: `src/design-system/components/Button/Button.test.tsx`

**Interfaces:**
- Consumes: `cx`, `Icon`, `IconName`.
- Produces: `type ButtonVariant = "primary" | "outline" | "quiet" | "doodle"`, `type ButtonProps` (a union: with `children`, or icon-only with a required `aria-label`), `Button(props: ButtonProps)`.

- [ ] **Step 1: Write the failing test**

Create `src/design-system/components/Button/Button.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import styles from "./Button.module.css";

describe("Button", () => {
  it("is a type=button outline button named by its children", () => {
    render(<Button>Tải cuộn lên</Button>);
    const button = screen.getByRole("button", { name: "Tải cuộn lên" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass(styles.button, styles.outline);
  });

  it("takes a variant and a size", () => {
    render(<Button variant="primary" size="sm">Chia sẻ</Button>);
    expect(screen.getByRole("button")).toHaveClass(styles.primary, styles.sm);
  });

  it("keeps an explicit type", () => {
    render(<Button type="submit">Lưu</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("puts a decorative icon before the label", () => {
    render(<Button icon="upload">Tải lên</Button>);
    const button = screen.getByRole("button", { name: "Tải lên" });
    expect(button.firstElementChild?.tagName.toLowerCase()).toBe("svg");
    expect(button.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(button).not.toHaveClass(styles.iconOnly);
  });

  it("becomes a square icon-only button named by aria-label", () => {
    render(<Button icon="share" aria-label="Chia sẻ" />);
    expect(screen.getByRole("button", { name: "Chia sẻ" })).toHaveClass(styles.iconOnly);
  });

  it("shrinks the icon to 18px in the small size", () => {
    const { container } = render(<Button icon="share" aria-label="Chia sẻ" size="sm" />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "18");
  });

  it("calls onClick, and not when disabled", async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Lưu</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<Button onClick={onClick} disabled>Lưu</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("requires aria-label on icon-only buttons (type check)", () => {
    // @ts-expect-error an icon-only button needs an aria-label
    render(<Button icon="share" />);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/design-system/components/Button`
Expected: FAIL, `Failed to resolve import "./Button"`.

- [ ] **Step 3: Implement**

Create `src/design-system/components/Button/Button.module.css` (ported from the artifact's `bundle.css`, with hover limited to enabled buttons):

```css
.button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: 0 var(--space-6);
  font: 600 15px/1 var(--font-sans);
  color: var(--ink);
  background: transparent;
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.button:hover:not(:disabled) { transform: translateY(-1px); }
.button:active:not(:disabled) { transform: translateY(0); }
.button:focus-visible { outline: 2px solid var(--focus); outline-offset: 3px; }
.button:disabled { opacity: 0.45; cursor: not-allowed; }

.outline {}

.primary { background: var(--cobalt); border-color: var(--cobalt); color: var(--on-cobalt); }
.primary:hover:not(:disabled) { background: var(--cobalt-deep); border-color: var(--cobalt-deep); }

.quiet {
  border-color: transparent;
  padding: 0 var(--space-3);
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 4px;
}

.doodle {
  padding: 0 var(--space-8);
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-width: 2px;
}
.doodle::after {
  content: "";
  position: absolute;
  inset: -4px -3px -3px -5px;
  border: 1.5px solid var(--ink);
  transform: rotate(-1.2deg);
  pointer-events: none;
}
.doodle:hover:not(:disabled) { transform: rotate(var(--tilt-left)); }

.sm { min-height: 36px; padding: 0 var(--space-4); font-size: 14px; }

.iconOnly { width: 44px; padding: 0; }
.iconOnly.sm { width: 36px; }
.quiet.iconOnly { border-color: transparent; }

@media (prefers-reduced-motion: reduce) {
  .button { transition: none; }
}
```

Create `src/design-system/components/Button/Button.tsx`:

```tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/design-system/cx";
import { Icon } from "../Icon/Icon";
import type { IconName } from "../Icon/icons";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "outline" | "quiet" | "doodle";

interface BaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** `primary` at most once per screen. `doodle` only on landing and empty states. */
  variant?: ButtonVariant;
  size?: "md" | "sm";
  icon?: IconName;
}

type LabelledButton = BaseProps & { children: ReactNode };
type IconOnlyButton = BaseProps & { children?: never; icon: IconName; "aria-label": string };

export type ButtonProps = LabelledButton | IconOnlyButton;

export function Button({ variant = "outline", size = "md", icon, className, children, type = "button", ...rest }: ButtonProps) {
  const iconOnly = icon !== undefined && (children === undefined || children === null || children === "");
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], size === "sm" && styles.sm, iconOnly && styles.iconOnly, className)}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === "sm" ? 18 : 20} /> : null}
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm test src/design-system/components/Button && pnpm typecheck && pnpm lint`
Expected: PASS (8 tests). The typecheck passes, which shows the `@ts-expect-error` is needed.

- [ ] **Step 5: Commit**

```bash
git add src/design-system/components/Button
git commit -m "feat(cuon): add Button component"
```

---

### Task 7: `Stamp`

**Files:**
- Create: `src/design-system/components/Stamp/Stamp.tsx`, `Stamp.module.css`
- Test: `src/design-system/components/Stamp/Stamp.test.tsx`

**Interfaces:**
- Consumes: `cx`, `Icon`, `IconName`.
- Produces: `type StampTone = "neutral" | "ink" | "keeper" | "oops"`, `type StampProps` (a union: a text stamp with an optional `label`, or an icon stamp with a required `label`), `Stamp(props: StampProps)`. `FilmStrip` and `RollCard` use it.

- [ ] **Step 1: Write the failing test**

Create `src/design-system/components/Stamp/Stamp.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stamp } from "./Stamp";
import styles from "./Stamp.module.css";

describe("Stamp", () => {
  it("renders a neutral text stamp", () => {
    render(<Stamp>ISO 400</Stamp>);
    expect(screen.getByText("ISO 400")).toHaveClass(styles.stamp, styles.neutral);
  });

  it("takes a tone, solid and tilt", () => {
    render(<Stamp tone="oops" solid tilt>oops</Stamp>);
    expect(screen.getByText("oops")).toHaveClass(styles.oops, styles.solid, styles.tilt);
  });

  it("names an icon + number stamp by its label, so the number isn't read alone", () => {
    render(<Stamp tone="keeper" icon="keeper" label="5 tấm ưng">5</Stamp>);
    const stamp = screen.getByRole("img", { name: "5 tấm ưng" });
    expect(stamp).toHaveClass(styles.keeper, styles.hasIcon);
    expect(stamp).toHaveAttribute("title", "5 tấm ưng");
    expect(stamp.querySelector("svg")).toHaveAttribute("width", "14");
  });

  it("requires a label on icon stamps (type check)", () => {
    // @ts-expect-error an icon stamp needs a label
    render(<Stamp icon="oops">3</Stamp>);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/design-system/components/Stamp`
Expected: FAIL, `Failed to resolve import "./Stamp"`.

- [ ] **Step 3: Implement**

Create `src/design-system/components/Stamp/Stamp.module.css`:

```css
.stamp {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 5px 8px;
  font: 700 11px/1 var(--font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--ink-muted);
  background: transparent;
  border: 1.5px solid currentColor;
  border-radius: var(--radius-sm);
}

.neutral {}
.ink { color: var(--ink); }
.keeper { color: var(--keeper); }
.oops { color: var(--pin); }

.solid.oops { background: var(--pin); border-color: var(--pin); color: var(--on-pin); }
.solid.keeper { background: var(--keeper); border-color: var(--keeper); color: var(--on-keeper); }
.solid.ink,
.solid.neutral { background: var(--ink); border-color: var(--ink); color: var(--paper); }

.tilt { transform: rotate(var(--tilt-left)); }

.hasIcon { padding: 4px 7px 4px 6px; font-size: 12px; letter-spacing: 0.04em; }
```

Create `src/design-system/components/Stamp/Stamp.tsx`:

```tsx
import type { ReactNode } from "react";
import { cx } from "@/design-system/cx";
import { Icon } from "../Icon/Icon";
import type { IconName } from "../Icon/icons";
import styles from "./Stamp.module.css";

export type StampTone = "neutral" | "ink" | "keeper" | "oops";

interface BaseProps {
  tone?: StampTone;
  /** Filled. Only on top of a photo or film. */
  solid?: boolean;
  /** At most once per screen. */
  tilt?: boolean;
  className?: string;
  children?: ReactNode;
}

type TextStamp = BaseProps & { icon?: undefined; label?: string };
type IconStamp = BaseProps & { icon: IconName; label: string };

export type StampProps = TextStamp | IconStamp;

export function Stamp({ tone = "neutral", solid, tilt, icon, label, className, children }: StampProps) {
  const a11y = label ? { role: "img", "aria-label": label, title: label } : {};
  return (
    <span
      className={cx(styles.stamp, styles[tone], solid && styles.solid, tilt && styles.tilt, icon && styles.hasIcon, className)}
      {...a11y}
    >
      {icon ? <Icon name={icon} size={14} /> : null}
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm test src/design-system/components/Stamp && pnpm typecheck`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/design-system/components/Stamp
git commit -m "feat(cuon): add Stamp component"
```

---

### Task 8: `Scribble`

**Files:**
- Create: `src/design-system/components/Scribble/Scribble.tsx`, `Scribble.module.css`
- Test: `src/design-system/components/Scribble/Scribble.test.tsx`

**Interfaces:**
- Consumes: `cx`.
- Produces: `interface ScribbleProps { arrow?: "none" | "left" | "right" | "down"; tone?: "ink" | "pin"; size?: "md" | "sm"; className?: string; children: ReactNode }`, `Scribble(props)`.

- [ ] **Step 1: Write the failing test**

Create `src/design-system/components/Scribble/Scribble.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Scribble } from "./Scribble";
import styles from "./Scribble.module.css";

describe("Scribble", () => {
  it("renders the note with no arrow by default", () => {
    const { container } = render(<Scribble>hở sáng chỗ này</Scribble>);
    expect(screen.getByText("hở sáng chỗ này")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass(styles.scribble);
  });

  it("draws a decorative arrow after the text for right and down", () => {
    const { container } = render(<Scribble arrow="right">nhìn nè</Scribble>);
    const root = container.firstElementChild!;
    expect(root.lastElementChild?.tagName.toLowerCase()).toBe("svg");
    expect(root.lastElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("draws the arrow before the text for left", () => {
    const { container } = render(<Scribble arrow="left">nhìn nè</Scribble>);
    const root = container.firstElementChild!;
    expect(root).toHaveClass(styles.left);
    expect(root.firstElementChild?.tagName.toLowerCase()).toBe("svg");
  });

  it("takes the down arrow, pin tone and small size", () => {
    const { container } = render(<Scribble arrow="down" tone="pin" size="sm">chớp mắt</Scribble>);
    expect(container.firstElementChild).toHaveClass(styles.down, styles.pin, styles.sm);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/design-system/components/Scribble`
Expected: FAIL, `Failed to resolve import "./Scribble"`.

- [ ] **Step 3: Implement**

Create `src/design-system/components/Scribble/Scribble.module.css`:

```css
.scribble {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-hand);
  font-size: var(--text-note);
  line-height: var(--text-note--line-height);
  color: var(--ink);
}

.sm { font-size: var(--text-note-sm); line-height: var(--text-note-sm--line-height); }
.pin { color: var(--pin); }

.arrow { flex: 0 0 auto; width: 44px; height: 32px; }
.left .arrow { transform: scaleX(-1); }
.down { flex-direction: column; align-items: flex-start; }
.down .arrow { transform: rotate(80deg); margin-left: var(--space-6); }
```

Create `src/design-system/components/Scribble/Scribble.tsx`:

```tsx
import type { ReactNode } from "react";
import { cx } from "@/design-system/cx";
import styles from "./Scribble.module.css";

export interface ScribbleProps {
  arrow?: "none" | "left" | "right" | "down";
  /** `pin` for oops notes. */
  tone?: "ink" | "pin";
  size?: "md" | "sm";
  className?: string;
  /** Short and lowercase, 2 to 6 words. Never a required instruction. */
  children: ReactNode;
}

function Arrow() {
  return (
    <svg className={styles.arrow} viewBox="0 0 44 32" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 25C11 12 22 7 38 9" />
      <path d="M31 3l8 6-7 7" />
    </svg>
  );
}

export function Scribble({ arrow = "none", tone = "ink", size = "md", className, children }: ScribbleProps) {
  const cls = cx(
    styles.scribble,
    tone === "pin" && styles.pin,
    size === "sm" && styles.sm,
    arrow === "left" && styles.left,
    arrow === "down" && styles.down,
    className,
  );
  const text = <span>{children}</span>;
  if (arrow === "none") return <span className={cls}>{text}</span>;
  if (arrow === "left") return <span className={cls}><Arrow />{text}</span>;
  return <span className={cls}>{text}<Arrow /></span>;
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm test src/design-system/components/Scribble && pnpm typecheck`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/design-system/components/Scribble
git commit -m "feat(cuon): add Scribble component"
```

---

### Task 9: `Field`

The artifact makes ids with a module-level counter, which gives different ids on the server and the client and breaks hydration. This port uses React's `useId`.

**Files:**
- Create: `src/design-system/components/Field/Field.tsx`, `Field.module.css`
- Test: `src/design-system/components/Field/Field.test.tsx`

**Interfaces:**
- Consumes: `cx`.
- Produces: `interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> { label: ReactNode; hint?: ReactNode; error?: ReactNode; mono?: boolean; className?: string }` (`className` goes on the wrapper), `Field(props)`.

- [ ] **Step 1: Write the failing test**

Create `src/design-system/components/Field/Field.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";
import styles from "./Field.module.css";

describe("Field", () => {
  it("labels its input", () => {
    render(<Field label="Máy ảnh" placeholder="Nikon FM2" />);
    const input = screen.getByLabelText("Máy ảnh");
    expect(input).toHaveAttribute("placeholder", "Nikon FM2");
    expect(input).toHaveClass(styles.input);
  });

  it("describes the input with its hint", () => {
    render(<Field label="ISO" hint="Số in trên hộp phim" />);
    expect(screen.getByLabelText("ISO")).toHaveAccessibleDescription("Số in trên hộp phim");
  });

  it("shows the error instead of the hint and marks the input invalid", () => {
    render(<Field label="ISO" hint="Số in trên hộp phim" error="Nhiều quá. Đẩy +3 à?" />);
    const input = screen.getByLabelText("ISO");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Nhiều quá. Đẩy +3 à?");
    expect(screen.getByText("Nhiều quá. Đẩy +3 à?")).toHaveClass(styles.hint, styles.error);
    expect(screen.queryByText("Số in trên hộp phim")).not.toBeInTheDocument();
  });

  it("uses the mono face for film data", () => {
    render(<Field label="ISO" mono />);
    expect(screen.getByLabelText("ISO")).toHaveClass(styles.mono);
  });

  it("keeps a caller's id and puts className on the wrapper", () => {
    const { container } = render(<Field label="Tên cuộn" id="roll-name" className="extra" />);
    expect(screen.getByLabelText("Tên cuộn")).toHaveAttribute("id", "roll-name");
    expect(container.firstElementChild).toHaveClass(styles.field, "extra");
  });

  it("works as a controlled input", async () => {
    function Controlled() {
      const [value, setValue] = useState("");
      return <Field label="Tên cuộn" value={value} onChange={(e) => setValue(e.target.value)} />;
    }
    render(<Controlled />);
    await userEvent.type(screen.getByLabelText("Tên cuộn"), "Đà Lạt");
    expect(screen.getByLabelText("Tên cuộn")).toHaveValue("Đà Lạt");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/design-system/components/Field`
Expected: FAIL, `Failed to resolve import "./Field"`.

- [ ] **Step 3: Implement**

Create `src/design-system/components/Field/Field.module.css`:

```css
.field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }

.label {
  font-family: var(--font-sans);
  font-size: var(--text-label);
  line-height: var(--text-label--line-height);
  font-weight: var(--text-label--font-weight);
  letter-spacing: var(--text-label--letter-spacing);
  text-transform: uppercase;
  color: var(--ink-muted);
}

.input {
  box-sizing: border-box;
  width: 100%;
  min-height: 44px;
  padding: 0 var(--space-3);
  font: 400 var(--text-body) / var(--text-body--line-height) var(--font-sans);
  color: var(--ink);
  background: var(--paper-raised);
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-md);
}
.input::placeholder { color: var(--ink-muted); }
.input:focus { outline: 2px solid var(--focus); outline-offset: 2px; border-color: var(--ink); }

.mono { font-family: var(--font-mono); font-size: 15px; }

.hint {
  font-family: var(--font-sans);
  font-size: var(--text-body-sm);
  line-height: var(--text-body-sm--line-height);
  color: var(--ink-muted);
}
.error { color: var(--pin); }
```

Create `src/design-system/components/Field/Field.tsx`:

```tsx
import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "@/design-system/cx";
import styles from "./Field.module.css";

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: ReactNode;
  /** One plain sentence under the input. */
  hint?: ReactNode;
  /** Replaces the hint; written in a human voice. */
  error?: ReactNode;
  /** Space Mono, for ISO, stock and camera data. */
  mono?: boolean;
  /** Applied to the wrapper. */
  className?: string;
}

export function Field({ label, hint, error, mono, className, id, ...inputProps }: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const note = error ?? hint;

  return (
    <div className={cx(styles.field, className)}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        {...inputProps}
        id={inputId}
        className={cx(styles.input, mono && styles.mono)}
        aria-describedby={note ? hintId : undefined}
        aria-invalid={error ? true : undefined}
      />
      {note ? (
        <span id={hintId} className={cx(styles.hint, error ? styles.error : undefined)}>
          {note}
        </span>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm test src/design-system/components/Field && pnpm typecheck`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/design-system/components/Field
git commit -m "feat(cuon): add Field component"
```

---

### Task 10: `Print`

Uses a plain `<img>`, not `next/image`. Per ADR-001 the browser makes the WebP copies (480 px and 2048 px) before upload and R2 serves them. Vercel image optimisation would re-process them and use up Hobby-plan transformations.

**Files:**
- Create: `src/design-system/components/tilt.ts`, `src/design-system/components/Print/Print.tsx`, `Print.module.css`
- Test: `src/design-system/components/Print/Print.test.tsx`

**Interfaces:**
- Consumes: `cx`.
- Produces: `type Tilt = "none" | "left" | "right" | "wild"` and `TILT: Record<Tilt, string>` from `@/design-system/components/tilt`. `interface PrintProps { src: string; alt: string; caption?: ReactNode; date?: string; width?: number | string; aspect?: \`${number}/${number}\`; format?: "classic" | "instant" | "borderless"; attach?: "tape" | "tape-corner" | "pin"; tilt?: Tilt; oops?: boolean; className?: string; style?: CSSProperties; children?: ReactNode }`, `Print(props)`.

- [ ] **Step 1: Write the failing test**

Create `src/design-system/components/Print/Print.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Print } from "./Print";
import styles from "./Print.module.css";

const photo = { src: "/p.webp", alt: "Đồi thông lúc bình minh" };

describe("Print", () => {
  it("is a figure with the photo, 240px wide at 3/2 by default", () => {
    const { container } = render(<Print {...photo} />);
    const figure = container.querySelector("figure")!;
    expect(figure).toHaveClass(styles.print, styles.classic);
    expect(figure).toHaveStyle({ width: "240px" });
    const img = screen.getByRole("img", { name: photo.alt });
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveStyle({ aspectRatio: "3/2" });
  });

  it("takes a width, aspect and tilt", () => {
    const { container } = render(<Print {...photo} width="100%" aspect="2/3" tilt="left" />);
    const figure = container.querySelector("figure")!;
    expect(figure).toHaveStyle({ width: "100%" });
    expect(figure.style.getPropertyValue("--rc-tilt")).toBe("var(--tilt-left)");
    expect(screen.getByRole("img")).toHaveStyle({ aspectRatio: "2/3" });
  });

  it("writes the caption and date on the border", () => {
    render(<Print {...photo} caption="đồi thông, 5:40 sáng" date="12.10.25" />);
    expect(screen.getByText("đồi thông, 5:40 sáng")).toHaveClass(styles.caption);
    expect(screen.getByText("12.10.25")).toHaveClass(styles.date);
  });

  it("writes an oops caption in red pen", () => {
    render(<Print {...photo} caption="chớp mắt" oops />);
    expect(screen.getByText("chớp mắt")).toHaveClass(styles.oopsCaption);
  });

  it("keeps the instant border even with no caption, and drops it when borderless", () => {
    const { container, rerender } = render(<Print {...photo} format="instant" />);
    expect(container.querySelector(`.${styles.foot}`)).toBeInTheDocument();
    rerender(<Print {...photo} format="borderless" caption="bị cắt" />);
    expect(container.querySelector(`.${styles.foot}`)).not.toBeInTheDocument();
    expect(screen.queryByText("bị cắt")).not.toBeInTheDocument();
  });

  it.each([
    ["tape", styles.tape],
    ["tape-corner", styles.tapeCorner],
    ["pin", styles.pin],
  ] as const)("attaches with %s as decoration", (attach, cls) => {
    const { container } = render(<Print {...photo} attach={attach} />);
    const deco = container.querySelector(`.${cls}`);
    expect(deco).toHaveAttribute("aria-hidden", "true");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/design-system/components/Print`
Expected: FAIL, `Failed to resolve import "./Print"`.

- [ ] **Step 3: Implement**

Create `src/design-system/components/tilt.ts`:

```ts
export type Tilt = "none" | "left" | "right" | "wild";

export const TILT: Record<Tilt, string> = {
  none: "var(--tilt-none)",
  left: "var(--tilt-left)",
  right: "var(--tilt-right)",
  wild: "var(--tilt-wild)",
};
```

Create `src/design-system/components/Print/Print.module.css`:

```css
.print {
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  margin: 0;
  padding: var(--space-3);
  vertical-align: top;
  background: var(--print);
  border-radius: var(--radius-none);
  box-shadow: var(--shadow-print);
  transform: rotate(var(--rc-tilt, 0deg));
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.print:hover { transform: rotate(0deg) translateY(-2px); box-shadow: var(--shadow-lift); }

.classic {}
.instant { padding-bottom: var(--space-2); }
.borderless { padding: 0; }

.image { display: block; width: 100%; object-fit: cover; background: var(--line); border-radius: var(--radius-none); }

.foot { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2); min-height: 20px; padding-top: var(--space-2); }
.instant .foot { min-height: calc(var(--space-12) - var(--space-2)); align-items: center; }

.caption { font-family: var(--font-hand); font-size: var(--text-note-sm); line-height: var(--text-note-sm--line-height); color: var(--on-print); }
.oopsCaption { color: var(--on-print-pin); }
.date { font: 400 11px/14px var(--font-mono); letter-spacing: 0.06em; color: var(--on-print-muted); white-space: nowrap; }

.tape {
  position: absolute;
  top: -11px;
  left: 50%;
  width: 76px;
  height: 24px;
  margin-left: -38px;
  background: var(--tape);
  transform: rotate(var(--tilt-left));
  clip-path: polygon(0 8%, 6% 0, 12% 10%, 18% 0, 82% 0, 88% 8%, 94% 0, 100% 10%, 100% 92%, 94% 100%, 88% 90%, 82% 100%, 18% 100%, 12% 92%, 6% 100%, 0 90%);
}
.tapeCorner { left: auto; right: -18px; top: 6px; margin-left: 0; transform: rotate(38deg); }

.pin {
  position: absolute;
  top: -6px;
  left: 50%;
  width: 14px;
  height: 14px;
  margin-left: -7px;
  background: var(--pin);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-pin);
}

@media (prefers-reduced-motion: reduce) {
  .print { transition: none; }
}
```

Create `src/design-system/components/Print/Print.tsx`:

```tsx
import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/design-system/cx";
import { TILT, type Tilt } from "../tilt";
import styles from "./Print.module.css";

export interface PrintProps {
  src: string;
  /** Describes the photo ("Đồi thông lúc bình minh"). */
  alt: string;
  /** Handwritten, 2 to 6 lowercase words. */
  caption?: ReactNode;
  /** dd.mm.yy */
  date?: string;
  /** px or any CSS width. Use "100%" in grids. */
  width?: number | string;
  aspect?: `${number}/${number}`;
  format?: "classic" | "instant" | "borderless";
  attach?: "tape" | "tape-corner" | "pin";
  /** Grids and phones: "none". At most three tilted prints per screen. */
  tilt?: Tilt;
  /** Writes the caption in red pen. */
  oops?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Print({
  src, alt, caption, date, width = 240, aspect = "3/2", format = "classic",
  attach, tilt = "none", oops, className, style, children,
}: PrintProps) {
  const figureStyle = { ...style, width, "--rc-tilt": TILT[tilt] } as CSSProperties;
  const showFoot = format !== "borderless" && (caption || date || format === "instant");

  return (
    <figure className={cx(styles.print, styles[format], className)} style={figureStyle}>
      {attach === "tape" ? <span className={styles.tape} aria-hidden="true" /> : null}
      {attach === "tape-corner" ? <span className={cx(styles.tape, styles.tapeCorner)} aria-hidden="true" /> : null}
      {attach === "pin" ? <span className={styles.pin} aria-hidden="true" /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- scans are pre-sized WebP from R2 (ADR-001); no server optimisation */}
      <img className={styles.image} src={src} alt={alt} loading="lazy" style={{ aspectRatio: aspect }} />
      {showFoot ? (
        <figcaption className={styles.foot}>
          <span className={cx(styles.caption, oops && styles.oopsCaption)}>{caption}</span>
          {date ? <span className={styles.date}>{date}</span> : null}
        </figcaption>
      ) : null}
      {children}
    </figure>
  );
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm test src/design-system/components/Print && pnpm typecheck && pnpm lint`
Expected: PASS (8 tests). Lint is clean.

- [ ] **Step 5: Commit**

```bash
git add src/design-system/components/tilt.ts src/design-system/components/Print
git commit -m "feat(cuon): add Print component"
```

---

### Task 11: `FilmStrip`

One change from the artifact: a clickable frame is a `<button>` (focusable, named by the frame's alt), not an `<img onClick>`. Every frame takes an `alt`, blank frames included, so the caller writes the Vietnamese text.

**Files:**
- Create: `src/design-system/components/FilmStrip/FilmStrip.tsx`, `FilmStrip.module.css`
- Test: `src/design-system/components/FilmStrip/FilmStrip.test.tsx`

**Interfaces:**
- Consumes: `cx`, `Stamp`.
- Produces: `interface FilmFrame { src?: string; alt: string; number?: number | string; flag?: "keeper" | "oops"; onClick?: () => void }`, `interface FilmStripLabels { strip: string; keeper: string; oops: string }`, `interface FilmStripProps { frames: FilmFrame[]; labels: FilmStripLabels; frameWidth?: number; edgeText?: string; className?: string; style?: CSSProperties }`, `FilmStrip(props)`.

- [ ] **Step 1: Write the failing test**

Create `src/design-system/components/FilmStrip/FilmStrip.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilmStrip, type FilmFrame } from "./FilmStrip";
import styles from "./FilmStrip.module.css";

const labels = { strip: "Dải phim cuộn 14", keeper: "Tấm ưng", oops: "Oops" };
const frames: FilmFrame[] = [
  { src: "/1.webp", alt: "Chợ Đà Lạt buổi sáng" },
  { src: "/2.webp", alt: "Hồ Xuân Hương", flag: "keeper" },
  { alt: "Khung 3, trống" },
  { src: "/4.webp", alt: "Hở sáng", number: "4A", flag: "oops" },
];

describe("FilmStrip", () => {
  it("is a named list with one item per frame", () => {
    render(<FilmStrip frames={frames} labels={labels} />);
    const list = screen.getByRole("list", { name: labels.strip });
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
  });

  it("shows scans with their alt and blank frames as a named image", () => {
    render(<FilmStrip frames={frames} labels={labels} />);
    expect(screen.getByRole("img", { name: "Chợ Đà Lạt buổi sáng" })).toHaveAttribute("src", "/1.webp");
    expect(screen.getByRole("img", { name: "Khung 3, trống" })).toHaveClass(styles.blank);
  });

  it("flags keepers and oops with labelled stamps", () => {
    render(<FilmStrip frames={frames} labels={labels} />);
    expect(screen.getByRole("img", { name: "Tấm ưng" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Oops" })).toBeInTheDocument();
  });

  it("prints frame numbers on the edge, defaulting to position", () => {
    const { container } = render(<FilmStrip frames={frames} labels={labels} edgeText="COLOR 200 · ROLL 14" />);
    const edges = container.querySelectorAll(`.${styles.edge}`);
    expect(edges[0]).toHaveTextContent("1▸1A");
    expect(edges[6]).toHaveTextContent("4A▸4AA");
    expect(edges[1]).toHaveTextContent("COLOR 200 · ROLL 14");
    expect(edges[0]).toHaveAttribute("aria-hidden", "true");
  });

  it("sizes frames and sprocket holes from frameWidth", () => {
    const { container } = render(<FilmStrip frames={[frames[0]]} labels={labels} frameWidth={150} />);
    expect(screen.getByRole("list").style.getPropertyValue("--rc-frame-w")).toBe("150px");
    // max(4, round(150 / 24)) = 6 holes per rail, two rails
    expect(container.querySelectorAll(`.${styles.hole}`)).toHaveLength(12);
  });

  it("makes a frame with onClick a button named by its alt", async () => {
    const onClick = vi.fn();
    render(<FilmStrip frames={[{ ...frames[0], onClick }]} labels={labels} />);
    await userEvent.click(screen.getByRole("button", { name: "Chợ Đà Lạt buổi sáng" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("has no buttons when no frame is clickable", () => {
    render(<FilmStrip frames={frames} labels={labels} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/design-system/components/FilmStrip`
Expected: FAIL, `Failed to resolve import "./FilmStrip"`.

- [ ] **Step 3: Implement**

Create `src/design-system/components/FilmStrip/FilmStrip.module.css`:

```css
.strip {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--film);
  border-radius: var(--radius-sm);
  -webkit-overflow-scrolling: touch;
}
.strip::-webkit-scrollbar { display: none; }

.frame {
  position: relative;
  flex: 0 0 auto;
  box-sizing: border-box;
  width: var(--rc-frame-w, 200px);
  padding: 0 var(--space-2);
  background: var(--film);
  scroll-snap-align: start;
}

.edge {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 16px;
  overflow: hidden;
  font: 700 10px/1 var(--font-mono);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--film-edge);
}

.holes { display: flex; justify-content: space-around; align-items: center; height: 18px; }
.hole { width: 9px; height: 12px; border-radius: var(--radius-sm); background: var(--film-hole); }

.image {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  margin: var(--space-1) 0;
  object-fit: cover;
  background: var(--ink-muted);
  border-radius: var(--radius-sm);
}
.blank { background: var(--film-hole); opacity: 0.92; }

.frameButton { display: block; width: 100%; padding: 0; background: none; border: 0; cursor: pointer; }
.frameButton:focus-visible { outline: 2px solid var(--focus); outline-offset: 3px; }

.flag { position: absolute; top: 44px; right: var(--space-3); }
.flag .flagStamp { padding: 4px; }
```

Create `src/design-system/components/FilmStrip/FilmStrip.tsx`:

```tsx
import type { CSSProperties } from "react";
import { cx } from "@/design-system/cx";
import { Stamp } from "../Stamp/Stamp";
import styles from "./FilmStrip.module.css";

export interface FilmFrame {
  /** No src = a blank frame. */
  src?: string;
  /** Describes the photo, or says the frame is blank ("Khung 14, trống"). */
  alt: string;
  /** Printed on the edge; defaults to the frame's position. */
  number?: number | string;
  /** Flag only a few frames. */
  flag?: "keeper" | "oops";
  onClick?: () => void;
}

export interface FilmStripLabels {
  /** Accessible name of the strip. */
  strip: string;
  keeper: string;
  oops: string;
}

export interface FilmStripProps {
  frames: FilmFrame[];
  labels: FilmStripLabels;
  /** px. 150 on phones, 180–220 on desktop. */
  frameWidth?: number;
  /** Stock line on the lower rail, e.g. "COLOR 200 · ROLL 14". */
  edgeText?: string;
  className?: string;
  style?: CSSProperties;
}

function Holes({ count }: { count: number }) {
  return (
    <div className={styles.holes} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={styles.hole} />
      ))}
    </div>
  );
}

function FramePicture({ frame }: { frame: FilmFrame }) {
  const picture = frame.src ? (
    // eslint-disable-next-line @next/next/no-img-element -- scans are pre-sized WebP from R2 (ADR-001)
    <img className={styles.image} src={frame.src} alt={frame.alt} loading="lazy" />
  ) : (
    <div className={cx(styles.image, styles.blank)} role="img" aria-label={frame.alt} />
  );
  if (!frame.onClick) return picture;
  return (
    <button type="button" className={styles.frameButton} onClick={frame.onClick}>
      {picture}
    </button>
  );
}

export function FilmStrip({ frames, labels, frameWidth = 200, edgeText = "", className, style }: FilmStripProps) {
  const holeCount = Math.max(4, Math.round(frameWidth / 24));
  const stripStyle = { ...style, "--rc-frame-w": `${frameWidth}px` } as CSSProperties;

  return (
    <ul className={cx(styles.strip, className)} style={stripStyle} aria-label={labels.strip}>
      {frames.map((frame, i) => {
        const num = frame.number != null ? String(frame.number) : String(i + 1);
        return (
          <li key={`${num}-${i}`} className={styles.frame}>
            <div className={styles.edge} aria-hidden="true">
              <span>{num}</span>
              <span>{`▸${num}A`}</span>
            </div>
            <Holes count={holeCount} />
            <FramePicture frame={frame} />
            {frame.flag ? (
              <span className={styles.flag}>
                <Stamp tone={frame.flag} solid icon={frame.flag} label={labels[frame.flag]} className={styles.flagStamp} />
              </span>
            ) : null}
            <Holes count={holeCount} />
            <div className={styles.edge} aria-hidden="true">
              <span>{edgeText}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm test src/design-system/components/FilmStrip && pnpm typecheck && pnpm lint`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/design-system/components/FilmStrip
git commit -m "feat(cuon): add FilmStrip component"
```

---

### Task 12: `RollCard`

One deviation from the artifact: the roll name uses the `title` token (22/28, weight 600, which the token sheet assigns to "Roll-card names") instead of `bundle.css`'s hard-coded 20/26.

**Files:**
- Create: `src/design-system/components/RollCard/RollCard.tsx`, `RollCard.module.css`
- Test: `src/design-system/components/RollCard/RollCard.test.tsx`

**Interfaces:**
- Consumes: `cx`, `Stamp`, `next/link`.
- Produces: `type Stock = "gold" | "green" | "blue" | "mono" | "rose"`, `interface RollCount { count: number; label: string }`, `interface RollCardProps { name: ReactNode; stock?: Stock; iso?: number | string; film?: string; exposures?: number; camera?: string; date?: string; oops?: RollCount; keepers?: RollCount; href?: string; className?: string }`, `RollCard(props)`.

- [ ] **Step 1: Write the failing test**

Create `src/design-system/components/RollCard/RollCard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RollCard } from "./RollCard";
import styles from "./RollCard.module.css";

const roll = {
  name: "Đà Lạt, cuộn tháng 10",
  stock: "green" as const,
  iso: 400,
  film: "Portra 400",
  exposures: 36,
  camera: "Nikon FM2",
  date: "12.10.25",
};

describe("RollCard", () => {
  it("shows the name and film data, with exposures once as EXP", () => {
    render(<RollCard {...roll} />);
    expect(screen.getByText(roll.name)).toHaveClass(styles.name);
    expect(screen.getByText("Portra 400 · ISO 400 · 36 EXP")).toHaveClass(styles.meta);
    expect(screen.getByText("Nikon FM2 · 12.10.25")).toHaveClass(styles.meta);
  });

  it("leaves out missing meta parts", () => {
    render(<RollCard name="Cuộn bí ẩn" iso={200} />);
    expect(screen.getByText("ISO 200")).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });

  it("draws a decorative canister in the stock colour with the ISO on its label", () => {
    const { container } = render(<RollCard {...roll} />);
    const can = container.querySelector(`.${styles.can}`) as HTMLElement;
    expect(can).toHaveAttribute("aria-hidden", "true");
    expect(can.style.getPropertyValue("--rc-stock")).toBe("var(--stock-green)");
    expect(can).toHaveTextContent("400");
  });

  it("defaults to the gold canister", () => {
    const { container } = render(<RollCard name="Cuộn" />);
    const can = container.querySelector(`.${styles.can}`) as HTMLElement;
    expect(can.style.getPropertyValue("--rc-stock")).toBe("var(--stock-gold)");
  });

  it("shows oops and keeper counts as labelled stamps", () => {
    render(<RollCard {...roll} oops={{ count: 3, label: "3 oops" }} keepers={{ count: 5, label: "5 tấm ưng" }} />);
    expect(screen.getByRole("img", { name: "3 oops" })).toHaveTextContent("3");
    expect(screen.getByRole("img", { name: "5 tấm ưng" })).toHaveTextContent("5");
  });

  it("becomes a link when given href", () => {
    render(<RollCard {...roll} href="/rolls/14" />);
    const link = screen.getByRole("link", { name: /Đà Lạt, cuộn tháng 10/ });
    expect(link).toHaveAttribute("href", "/rolls/14");
    expect(link).toHaveClass(styles.card);
  });

  it("is not a link without href", () => {
    render(<RollCard {...roll} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/design-system/components/RollCard`
Expected: FAIL, `Failed to resolve import "./RollCard"`.

- [ ] **Step 3: Implement**

Create `src/design-system/components/RollCard/RollCard.module.css`:

```css
.card {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-4) var(--space-4) calc(var(--space-4) + 2px);
  color: inherit;
  text-decoration: none;
  background: transparent;
  border: 0;
  transition: transform 0.15s ease;
}

/* The torn scrap: flat, no tilt, tape or shadow. */
.card::before,
.card::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  clip-path: polygon(0% 2px, 4% 1px, 8% 3px, 12% 2px, 16% 0px, 20% 0px, 24% 1px, 28% 4px, 32% 0px, 36% 2px, 40% 4px, 44% 0px, 48% 4px, 52% 1px, 56% 0px, 60% 0px, 64% 3px, 68% 3px, 72% 0px, 76% 1px, 80% 0px, 84% 4px, 88% 3px, 92% 0px, 96% 1px, 100% 4px, calc(100% - 0px) 10%, calc(100% - 0px) 30%, calc(100% - 2px) 50%, calc(100% - 2px) 70%, calc(100% - 2px) 90%, 100% calc(100% - 0px), 96% calc(100% - 5px), 92% calc(100% - 5px), 88% calc(100% - 3px), 84% calc(100% - 0px), 80% calc(100% - 1px), 76% calc(100% - 0px), 72% calc(100% - 5px), 68% calc(100% - 1px), 64% calc(100% - 1px), 60% calc(100% - 2px), 56% calc(100% - 3px), 52% calc(100% - 1px), 48% calc(100% - 5px), 44% calc(100% - 0px), 40% calc(100% - 5px), 36% calc(100% - 2px), 32% calc(100% - 5px), 28% calc(100% - 1px), 24% calc(100% - 2px), 20% calc(100% - 1px), 16% calc(100% - 0px), 12% calc(100% - 5px), 8% calc(100% - 5px), 4% calc(100% - 2px), 0% calc(100% - 1px), 1px 90%, 0px 70%, 2px 50%, 2px 30%, 0px 10%);
}
.card::before {
  z-index: -1;
  background-color: var(--scrap);
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .35 0 0 0 0 .27 0 0 0 0 .18 0 0 0 .22 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
    repeating-linear-gradient(180deg, transparent 0 21px, var(--scrap-rule) 21px 22px);
  background-position: 0 0, 0 9px;
}
.card::after { z-index: -2; background: var(--scrap-edge); transform: translate(1px, 2px); }

a.card:hover { transform: translateY(-1px); }
a.card:focus-visible { outline: 2px solid var(--focus); outline-offset: 4px; }

.can { position: relative; width: 44px; height: 72px; margin-left: 2px; }
.canCap { width: 22px; height: 7px; margin: 0 auto; background: var(--film); border-radius: var(--radius-sm) var(--radius-sm) 0 0; }
.canBody { position: relative; height: 65px; overflow: hidden; background: var(--rc-stock, var(--stock-gold)); border-radius: var(--radius-sm); }
.canBody::before,
.canBody::after { content: ""; position: absolute; left: 0; right: 0; height: 5px; background: var(--film); }
.canBody::before { top: 0; }
.canBody::after { bottom: 0; }
.canLabel { position: absolute; left: 0; right: 0; top: 22px; padding: 3px 0; font: 700 12px/1 var(--font-mono); text-align: center; color: var(--on-print); background: var(--print); }
.canLeader { position: absolute; right: -9px; top: 30px; width: 11px; height: 22px; background: var(--film); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }

.name {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-title);
  line-height: var(--text-title--line-height);
  font-weight: var(--text-title--font-weight);
}
.meta {
  margin: 2px 0 0;
  font-family: var(--font-mono);
  font-size: var(--text-meta);
  line-height: var(--text-meta--line-height);
  color: var(--ink-muted);
}
.side { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-2); }

@media (prefers-reduced-motion: reduce) {
  .card { transition: none; }
}
```

Create `src/design-system/components/RollCard/RollCard.tsx`:

```tsx
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/design-system/cx";
import { Stamp } from "../Stamp/Stamp";
import styles from "./RollCard.module.css";

/** Film family, never brand: warm neg gold, cool neg green, slide blue, B&W mono, everything else rose. */
export type Stock = "gold" | "green" | "blue" | "mono" | "rose";

export interface RollCount {
  count: number;
  /** Accessible name, e.g. "5 tấm ưng". */
  label: string;
}

export interface RollCardProps {
  name: ReactNode;
  stock?: Stock;
  iso?: number | string;
  /** The stock's name as text; never a logo. */
  film?: string;
  exposures?: number;
  camera?: string;
  /** dd.mm.yy */
  date?: string;
  oops?: RollCount;
  keepers?: RollCount;
  /** Makes the whole card a link. */
  href?: string;
  className?: string;
}

const joinMeta = (parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" · ");

export function RollCard({ name, stock = "gold", iso, film, exposures, camera, date, oops, keepers, href, className }: RollCardProps) {
  const filmLine = joinMeta([film, iso != null && `ISO ${iso}`, exposures != null && `${exposures} EXP`]);
  const cameraLine = joinMeta([camera, date]);
  const canStyle = { "--rc-stock": `var(--stock-${stock})` } as CSSProperties;

  const content = (
    <>
      <div className={styles.can} style={canStyle} aria-hidden="true">
        <div className={styles.canCap} />
        <div className={styles.canBody}>
          <div className={styles.canLabel}>{iso}</div>
        </div>
        <div className={styles.canLeader} />
      </div>
      <div>
        <p className={styles.name}>{name}</p>
        {filmLine ? <p className={styles.meta}>{filmLine}</p> : null}
        {cameraLine ? <p className={styles.meta}>{cameraLine}</p> : null}
      </div>
      <div className={styles.side}>
        {oops ? <Stamp tone="oops" icon="oops" label={oops.label}>{oops.count}</Stamp> : null}
        {keepers ? <Stamp tone="keeper" icon="keeper" label={keepers.label}>{keepers.count}</Stamp> : null}
      </div>
    </>
  );

  return href ? (
    <Link href={href} className={cx(styles.card, className)}>
      {content}
    </Link>
  ) : (
    <div className={cx(styles.card, className)}>{content}</div>
  );
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm test src/design-system/components/RollCard && pnpm typecheck`
Expected: PASS (7 tests). (`next/link` renders in jsdom without router mocks; checked while planning.)

- [ ] **Step 5: Commit**

```bash
git add src/design-system/components/RollCard
git commit -m "feat(cuon): add RollCard component"
```

---

### Task 13: `UploadDrop`

**Files:**
- Create: `src/design-system/components/UploadDrop/UploadDrop.tsx`, `UploadDrop.module.css`
- Test: `src/design-system/components/UploadDrop/UploadDrop.test.tsx`

**Interfaces:**
- Consumes: `cx`.
- Produces: `interface UploadDropProps { onFiles: (files: File[]) => void; title: string; hint: string; accept?: string; className?: string }`, `UploadDrop(props)`, a client component (`'use client'`).

- [ ] **Step 1: Write the failing test**

Create `src/design-system/components/UploadDrop/UploadDrop.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UploadDrop } from "./UploadDrop";
import styles from "./UploadDrop.module.css";

const copy = { title: "Thả cuộn vào đây", hint: "hoặc chạm để chọn ảnh scan" };
const scan = () => new File(["x"], "01.jpg", { type: "image/jpeg" });

describe("UploadDrop", () => {
  it("shows its title and hint and names the file input with them", () => {
    render(<UploadDrop {...copy} onFiles={vi.fn()} />);
    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.hint)).toBeInTheDocument();
    const input = screen.getByLabelText(new RegExp(copy.title));
    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAttribute("multiple");
    expect(input).toHaveAttribute("accept", "image/*");
  });

  it("takes an accept list", () => {
    render(<UploadDrop {...copy} onFiles={vi.fn()} accept="image/jpeg,image/png" />);
    expect(screen.getByLabelText(new RegExp(copy.title))).toHaveAttribute("accept", "image/jpeg,image/png");
  });

  it("hands picked files to onFiles as an array", async () => {
    const onFiles = vi.fn();
    render(<UploadDrop {...copy} onFiles={onFiles} />);
    const files = [scan(), scan()];
    await userEvent.upload(screen.getByLabelText(new RegExp(copy.title)), files);
    expect(onFiles).toHaveBeenCalledWith(files);
  });

  it("highlights while files hover and clears on leave", () => {
    const { container } = render(<UploadDrop {...copy} onFiles={vi.fn()} />);
    const zone = container.firstElementChild!;
    fireEvent.dragOver(zone);
    expect(zone).toHaveClass(styles.over);
    fireEvent.dragLeave(zone);
    expect(zone).not.toHaveClass(styles.over);
  });

  it("hands dropped files to onFiles and clears the highlight", () => {
    const onFiles = vi.fn();
    const { container } = render(<UploadDrop {...copy} onFiles={onFiles} />);
    const zone = container.firstElementChild!;
    const file = scan();
    fireEvent.dragOver(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(zone).not.toHaveClass(styles.over);
  });

  it("ignores a drop with no files", () => {
    const onFiles = vi.fn();
    const { container } = render(<UploadDrop {...copy} onFiles={onFiles} />);
    fireEvent.drop(container.firstElementChild!, { dataTransfer: { files: [] } });
    expect(onFiles).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/design-system/components/UploadDrop`
Expected: FAIL, `Failed to resolve import "./UploadDrop"`.

- [ ] **Step 3: Implement**

Create `src/design-system/components/UploadDrop/UploadDrop.module.css`:

```css
.drop {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-8) var(--space-6);
  text-align: center;
  color: var(--ink);
  background: var(--paper-raised);
  border: 2px dashed var(--line-strong);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.drop:focus-within { outline: 2px solid var(--focus); outline-offset: 3px; }

/* cobalt, not pin: pin is only for oops and errors (Known conflict 7). */
.over { background: var(--cobalt-soft); border-color: var(--cobalt); }

.glyph { width: 56px; height: 56px; color: var(--ink); }
.title { margin: var(--space-2) 0 0; font: 500 24px/30px var(--font-display); }
.hint { margin: 0; font-family: var(--font-mono); font-size: var(--text-meta); line-height: var(--text-meta--line-height); color: var(--ink-muted); }
.input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

@media (prefers-reduced-motion: reduce) {
  .drop { transition: none; }
}
```

Create `src/design-system/components/UploadDrop/UploadDrop.tsx`:

```tsx
"use client";

import { useState, type DragEvent } from "react";
import { cx } from "@/design-system/cx";
import styles from "./UploadDrop.module.css";

export interface UploadDropProps {
  onFiles: (files: File[]) => void;
  title: string;
  /** e.g. accepted formats. */
  hint: string;
  /** Defaults to image/*. */
  accept?: string;
  className?: string;
}

export function UploadDrop({ onFiles, title, hint, accept = "image/*", className }: UploadDropProps) {
  const [over, setOver] = useState(false);

  const take = (list: FileList | File[] | null | undefined) => {
    if (list && list.length > 0) onFiles(Array.from(list));
  };

  const onDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setOver(true);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setOver(false);
    take(e.dataTransfer?.files);
  };

  return (
    <label className={cx(styles.drop, over && styles.over, className)} onDragOver={onDragOver} onDragLeave={() => setOver(false)} onDrop={onDrop}>
      <svg className={styles.glyph} viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x={14} y={16} width={22} height={32} rx={2} />
        <path d="M20 16v-5h10v5M36 26h8v14h-8M14 26h22M14 38h22" />
        <path d="M44 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      </svg>
      <p className={styles.title}>{title}</p>
      <p className={styles.hint}>{hint}</p>
      <input className={styles.input} type="file" multiple accept={accept} onChange={(e) => take(e.target.files)} />
    </label>
  );
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm test src/design-system/components/UploadDrop && pnpm typecheck`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/design-system/components/UploadDrop
git commit -m "feat(cuon): add UploadDrop component"
```

---

### Task 14: Public barrel and dev-only showcase page

**Files:**
- Create: `src/design-system/index.ts`
- Create: `src/app/dev/design-system/page.tsx`, `src/app/dev/design-system/Showcase.tsx`, `src/app/dev/design-system/demos.tsx`
- Test: `src/app/dev/design-system/Showcase.test.tsx`, `src/app/dev/design-system/page.test.tsx`

**Interfaces:**
- Consumes: every component and type from Tasks 5–13; `design-tokens/tokens.json`; `TokensFile`.
- Produces: `@/design-system` exports `Button, Field, FilmStrip, Icon, Print, RollCard, Scribble, Stamp, UploadDrop, cx, ICON_NAMES, TILT` and their prop types. Route `/dev/design-system` (404 when `VERCEL_ENV === "production"`).

- [ ] **Step 1: Create the barrel**

Create `src/design-system/index.ts`:

```ts
export { cx } from "./cx";
export { Button, type ButtonProps, type ButtonVariant } from "./components/Button/Button";
export { Field, type FieldProps } from "./components/Field/Field";
export { FilmStrip, type FilmFrame, type FilmStripLabels, type FilmStripProps } from "./components/FilmStrip/FilmStrip";
export { Icon, type IconProps } from "./components/Icon/Icon";
export { ICON_NAMES, type IconName } from "./components/Icon/icons";
export { Print, type PrintProps } from "./components/Print/Print";
export { RollCard, type RollCardProps, type RollCount, type Stock } from "./components/RollCard/RollCard";
export { Scribble, type ScribbleProps } from "./components/Scribble/Scribble";
export { Stamp, type StampProps, type StampTone } from "./components/Stamp/Stamp";
export { TILT, type Tilt } from "./components/tilt";
export { UploadDrop, type UploadDropProps } from "./components/UploadDrop/UploadDrop";
```

`UploadDrop` has `"use client"` at the top of its own file, so re-exporting it from a barrel that server components import is safe.

- [ ] **Step 2: Write the failing showcase tests**

Create `src/app/dev/design-system/Showcase.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "../../../../design-tokens/tokens.json";
import type { TokensFile } from "@/design-system/tokens/types";
import { Showcase } from "./Showcase";

const file: TokensFile = tokens;

describe("Showcase", () => {
  it("shows every colour token", () => {
    render(<Showcase />);
    for (const t of file.color.tokens) expect(screen.getAllByText(t.name).length).toBeGreaterThan(0);
  });

  it("shows every text style", () => {
    render(<Showcase />);
    for (const s of file.type.groups.flatMap((g) => g.styles)) {
      expect(screen.getAllByText(s.name).length).toBeGreaterThan(0);
    }
  });

  it("has a section per component", () => {
    render(<Showcase />);
    for (const name of ["Button", "Field", "Icon", "Stamp", "Scribble", "Print", "FilmStrip", "RollCard", "UploadDrop"]) {
      expect(screen.getByRole("heading", { level: 3, name })).toBeInTheDocument();
    }
  });
});
```

Create `src/app/dev/design-system/page.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("/dev/design-system", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is a 404 on production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const { default: DesignSystemPage } = await import("./page");
    expect(() => DesignSystemPage()).toThrow("NEXT_NOT_FOUND");
  });

  it("renders on preview and locally", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const { default: DesignSystemPage } = await import("./page");
    expect(() => DesignSystemPage()).not.toThrow();
  });
});
```

- [ ] **Step 3: Run them and watch them fail**

Run: `pnpm test src/app/dev`
Expected: FAIL, `Failed to resolve import "./Showcase"` and `"./page"`.

- [ ] **Step 4: Implement the client demos**

The strings below are **sample copy for the showcase only**, not product copy.

Create `src/app/dev/design-system/demos.tsx`:

```tsx
"use client";

import { useState } from "react";
import { UploadDrop } from "@/design-system";

export function UploadDropDemo() {
  const [names, setNames] = useState<string[]>([]);
  return (
    <div className="flex flex-col gap-2">
      <UploadDrop title="Thả cuộn vào đây" hint="hoặc chạm để chọn ảnh scan · JPEG, PNG" onFiles={(files) => setNames(files.map((f) => f.name))} />
      {names.length > 0 ? <p className="font-mono text-meta text-ink-muted">{names.join(", ")}</p> : null}
    </div>
  );
}
```

- [ ] **Step 5: Implement the showcase**

Create `src/app/dev/design-system/Showcase.tsx`:

```tsx
import type { CSSProperties, ReactNode } from "react";
import tokens from "../../../../design-tokens/tokens.json";
import {
  Button, Field, FilmStrip, Icon, ICON_NAMES, Print, RollCard, Scribble, Stamp,
} from "@/design-system";
import type { TokensFile } from "@/design-system/tokens/types";
import { UploadDropDemo } from "./demos";

const file: TokensFile = tokens;

/** Flat two-tone placeholder "scan" so the page needs no photo files. */
function sample(from: string, to: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs><rect width='600' height='400' fill='url(#g)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SCANS = [sample("#c98b5a", "#2f4b5c"), sample("#e3c07a", "#7b5a3c"), sample("#6b8f71", "#1f2d24"), sample("#d77a61", "#3b2a3f")];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6 py-12">
      <h2 className="font-display text-display-l">{title}</h2>
      {children}
    </section>
  );
}

function Item({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-sans text-label uppercase text-ink-muted">{name}</h3>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </div>
  );
}

function Colours() {
  return (
    <ul className="grid grid-cols-2 gap-4 min-[600px]:grid-cols-4">
      {file.color.tokens.map((t) => (
        <li key={t.name} className="flex flex-col gap-2">
          <span className="h-12 border border-line" style={{ background: `var(--${t.name})` }} />
          <span className="font-mono text-meta">{t.name}</span>
        </li>
      ))}
    </ul>
  );
}

function TypeStyles() {
  return (
    <ul className="flex flex-col gap-6">
      {file.type.groups.flatMap((g) =>
        g.styles.map((s) => {
          const style: CSSProperties = {
            fontFamily: `var(--font-${g.family})`,
            fontSize: `var(--text-${s.name})`,
            lineHeight: `var(--text-${s.name}--line-height)`,
            fontWeight: s.fontWeight,
            letterSpacing: s.letterSpacing,
            textTransform: s.name === "label" || s.name === "edge" ? "uppercase" : undefined,
          };
          return (
            <li key={s.name} className="flex flex-col gap-1">
              <span className="font-mono text-meta text-ink-muted">{s.name}</span>
              <span style={style}>{s.sample}</span>
              <span style={style}>Đà Lạt · Hội An · tấm ưng · kỷ niệm</span>
            </li>
          );
        }),
      )}
    </ul>
  );
}

function Shapes() {
  return (
    <div className="flex flex-wrap items-end gap-6">
      {file.spacing.tokens.map((t) => (
        <div key={t.name} className="flex flex-col items-start gap-2">
          <span className="bg-cobalt" style={{ width: `var(--${t.name})`, height: `var(--${t.name})` }} />
          <span className="font-mono text-meta">{t.name}</span>
        </div>
      ))}
      {file.radius.tokens.map((t) => (
        <div key={t.name} className="flex flex-col items-start gap-2">
          <span className="block h-12 w-12 border-2 border-ink" style={{ borderRadius: `var(--${t.name})` }} />
          <span className="font-mono text-meta">{t.name}</span>
        </div>
      ))}
    </div>
  );
}

export function Showcase() {
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col">
      <Section title="Màu">
        <Colours />
      </Section>
      <Section title="Chữ">
        <TypeStyles />
      </Section>
      <Section title="Khoảng cách & bo góc">
        <Shapes />
      </Section>
      <Section title="Thành phần">
        <Item name="Button">
          <Button variant="primary" icon="upload">Tải cuộn lên</Button>
          <Button>Chia sẻ cuộn này</Button>
          <Button variant="quiet">Thêm ghi chú</Button>
          <Button variant="doodle">Bắt đầu cuộn đầu tiên</Button>
          <Button size="sm">Nhỏ</Button>
          <Button icon="share" aria-label="Chia sẻ" />
          <Button disabled>Không bấm được</Button>
        </Item>
        <Item name="Field">
          <Field label="Tên cuộn" placeholder="Đà Lạt, cuộn tháng 10" />
          <Field label="ISO" mono inputMode="numeric" defaultValue="400" hint="Số in trên hộp phim" />
          <Field label="ISO chụp" mono defaultValue="3200" error="Nhiều quá. Đẩy +3 à?" />
        </Item>
        <Item name="Icon">
          {ICON_NAMES.map((name) => (
            <span key={name} className="flex flex-col items-center gap-1">
              <Icon name={name} size={24} />
              <span className="font-mono text-meta">{name}</span>
            </span>
          ))}
        </Item>
        <Item name="Stamp">
          <Stamp>ISO 400</Stamp>
          <Stamp tone="ink">36 EXP</Stamp>
          <Stamp tone="keeper" icon="keeper" label="5 tấm ưng">5</Stamp>
          <Stamp tone="oops" icon="oops" label="3 oops">3</Stamp>
          <Stamp tone="oops" solid tilt>oops</Stamp>
        </Item>
        <Item name="Scribble">
          <Scribble arrow="right">nhìn chỗ này</Scribble>
          <Scribble tone="pin" arrow="down">hở sáng rồi :(</Scribble>
          <Scribble size="sm" arrow="left">cuộn đầu tiên!</Scribble>
        </Item>
        <Item name="Print">
          <Print src={SCANS[0]} alt="Mẫu: dải màu cam xanh" caption="đồi thông, 5:40 sáng" date="12.10.25" attach="tape" tilt="left" />
          <Print src={SCANS[1]} alt="Mẫu: dải màu vàng nâu" format="instant" caption="chớp mắt. lại." oops attach="pin" aspect="4/5" />
          <Print src={SCANS[2]} alt="Mẫu: dải màu xanh lá" format="borderless" width={200} />
        </Item>
        <Item name="FilmStrip">
          <div className="w-full">
            <FilmStrip
              labels={{ strip: "Dải phim mẫu", keeper: "Tấm ưng", oops: "Oops" }}
              edgeText="COLOR 200 · ROLL 14"
              frameWidth={180}
              frames={[
                { src: SCANS[0], alt: "Mẫu khung 1" },
                { src: SCANS[1], alt: "Mẫu khung 2", flag: "keeper" },
                { alt: "Khung 3, trống" },
                { src: SCANS[3], alt: "Mẫu khung 4", flag: "oops" },
                { src: SCANS[2], alt: "Mẫu khung 5" },
              ]}
            />
          </div>
        </Item>
        <Item name="RollCard">
          <div className="flex w-full max-w-[560px] flex-col gap-4">
            <RollCard name="Đà Lạt, cuộn tháng 10" stock="gold" iso={200} film="Gold 200" exposures={36} camera="Nikon FM2" date="12.10.25" keepers={{ count: 5, label: "5 tấm ưng" }} oops={{ count: 2, label: "2 oops" }} href="#" />
            <RollCard name="Hội An mưa" stock="mono" iso={400} film="HP5 Plus" exposures={36} camera="Olympus XA" date="03.09.25" />
          </div>
        </Item>
        <Item name="UploadDrop">
          <div className="w-full max-w-[560px]">
            <UploadDropDemo />
          </div>
        </Item>
      </Section>
    </div>
  );
}
```

- [ ] **Step 6: Implement the page**

Create `src/app/dev/design-system/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Showcase } from "./Showcase";

export const metadata: Metadata = {
  title: "Design system · Cuộn",
  robots: { index: false, follow: false },
};

/** Paper and Darkroom side by side on wide screens, stacked on phones. Hidden in production. */
export default function DesignSystemPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <main className="grid min-[1200px]:grid-cols-2">
      <div data-theme="light" className="rc-paper px-4 min-[600px]:px-6">
        <Showcase />
      </div>
      <div data-theme="dark" className="rc-paper px-4 min-[600px]:px-6">
        <Showcase />
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Run the tests and all checks**

Run: `pnpm check`
Expected: lint, typecheck, every test and the build pass. In the build output `/dev/design-system` is listed as static (○).

- [ ] **Step 8: Check it by eye against the artifact**

Run `pnpm dev` and open `http://localhost:3000/dev/design-system` at **390 px** and at **1440 px** wide. Compare each component with its preview in the [design system artifact](https://claude.ai/artifact/HtsG9sZeNGx19PSvPjW65a) (`project/components/<Name>/preview.html`). Check:
- Paper and Darkroom both render. In Darkroom, `cobalt` is dusty periwinkle, `pin` is safelight red, and sprocket holes glow.
- Fraunces, Be Vietnam Pro, Space Mono and Patrick Hand all render "Đà Lạt · Hội An · tấm ưng · kỷ niệm" with correct diacritics.
- The film strip scrolls sideways with snap. Tab reaches every button, input and link and shows the 2px cobalt ring.
- Dragging a file over UploadDrop turns it `cobalt-soft` with a `cobalt` border.
- The page doesn't scroll sideways at 390 px (only the film strip does).

Take one screenshot at each width for the PR description.

- [ ] **Step 9: Commit**

```bash
git add src/design-system/index.ts src/app/dev
git commit -m "feat(cuon): add dev-only design system showcase"
```

---

### Task 15: Docs and roadmap (needs the user's yes before each item)

**Executor agents: stop before this task.** The orchestrating session handles it with the user. Per CLAUDE.md and the doc-sync hook, ask the user before doing any of these, and don't edit a mirror without editing its artifact in the same session.

- [ ] **README.md** (repo-only): add a "Develop" section with `pnpm install`, `pnpm dev`, `pnpm test`, `pnpm tokens`, `pnpm check`, the `/dev/design-system` route, and a link to `design-tokens/README.md`. Commit: `docs(cuon): add develop section to README`.
- [ ] **docs/README.md** (repo-only): add a map row for `design-tokens/` + `src/design-system/` ("Tokens and components in code"; source of truth: design system artifact). Commit: `docs(cuon): link design system code from docs index`. (Known conflict 9, the active tab colour, was resolved as `cobalt` on 25.09.2026 before execution. The artifact, mirror and conflicts table are already updated.)
- [ ] **Design-system mirror, "Implementing in the app" section.** It suggests Tailwind `theme.extend`, which Tailwind v4 doesn't use. If the user wants it updated: change the artifact's `project/README.md` first, then copy the change into `docs/design/design-system.md` and bump "Last synced". Otherwise leave both alone.
- [ ] **Roadmap Phase 0, "Repo, Next.js + Tailwind mapped to design tokens".** Tick it only **after this branch merges to `main`**. Re-read the roadmap doc (Claude Docs `read`, doc `a0f678ba-bea4-4f78-8c12-abb694ef1d62`), tick it there, copy the tick into `docs/roadmap.md`, and bump "Last synced".

---

## Test strategy

| Layer | What proves it | Where |
|---|---|---|
| Token pipeline | Every token lands in the right theme block and Tailwind namespace; aliases resolve; the committed CSS matches the JSON (drift) | `build.test.ts`, `tokens-css.test.ts` |
| Accessibility of colour | 27 foreground/background pairs × 2 themes meet AA (3:1 for edges and focus) | `contrast.test.ts` |
| Fonts | All four families load with the `vietnamese` subset under the variables the tokens reference | `fonts.test.ts` |
| Components | Roles, accessible names, class variants, events, and TS contracts (`@ts-expect-error`) for required labels | `components/*/*.test.tsx` |
| Showcase | Every token, text style and component is on the page; production 404 | `Showcase.test.tsx`, `page.test.tsx` |
| Visual | Side-by-side check with the artifact previews at 390 px and 1440 px, both themes | Task 14, Step 8 (manual) |

Out of scope: pixel-level visual regression (Playwright screenshots). Add it once real screens exist.

## Risks

| Risk | Mitigation |
|---|---|
| The artifact changes between planning and execution | Task 2 checks the sha256 and stops on a mismatch; the drift test catches a regenerate that was skipped |
| Tailwind v4 `@theme static` / `inline` behaviour changes in a minor release | Checked with a spike build on 4.x (25.09.2026); the generator tests pin the output; `pnpm build` runs in `pnpm check` |
| Our themed `--shadow-*` variables collide with Tailwind's `--shadow-*` namespace | Shadows stay outside `@theme` (Tailwind's defaults are reset), so there's no shadow utility; only `Print` casts shadows, through its CSS Module |
| `next build` needs network for Google Fonts | Documented in Task 4; Vercel builds have network |
| pnpm 11 blocks install on unapproved build scripts | `pnpm-workspace.yaml` `allowBuilds` in Task 1 |
| Hydration mismatch from generated ids | `Field` uses `useId` instead of the artifact's module counter |
| A consumer passes a function prop (`onFiles`, `onClick`) from a server component | Only `UploadDrop` is `'use client'`; the showcase shows the client-wrapper pattern (`demos.tsx`) |
| Placeholder "scans" hide real-photo problems (aspect ratios, dark frames) | Task 14's visual check is a baseline only; recheck with real scans in Phase 2 |
