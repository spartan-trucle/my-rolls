# Design tokens

`tokens.json` is a verbatim copy of `project/tokens.json` from the [design system artifact](https://claude.ai/artifact/HtsG9sZeNGx19PSvPjW65a). The artifact is the source of truth; never edit this file by hand.

| Pulled | Artifact version | sha256 |
|---|---|---|
| 25.09.2026 | `1790316098-92bd` | `804b415fb62469bc7997c902141d43a4138fb588d4baed42d16b4fa64d38d86a` |

## Update

1. Re-sync the mirror `docs/design/design-system.md` (CLAUDE.md sync rules).
2. Pull `project/tokens.json` from the artifact over this file and update the table above.
3. Run `pnpm tokens` to regenerate `src/styles/tokens.css`, then `pnpm test`. The drift test fails if step 3 was skipped, and the contrast test fails if a new colour breaks a pairing.
