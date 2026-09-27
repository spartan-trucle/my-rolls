/**
 * D8: normalises a string into the accent-free form stored in every
 * `search_text` column (`stock`, `camera`, `lab`, `lab_branch` — B2) and
 * used to normalise the query side of a search too, so the two paths
 * can't drift.
 *
 * Postgres `unaccent` isn't immutable, so it can't back an index without
 * a wrapper (D8); this is that one function, run in the app on both write
 * and query.
 *
 * `đ`/`Đ` don't decompose under Unicode NFD (they're their own letters,
 * not a base letter plus a combining mark), so they're mapped to `d`
 * explicitly before NFD strips every other Vietnamese diacritic. `+` is
 * never touched: "Ilford HP5+" and "Ilford HP5" are different stocks
 * (LAB-1 reuses this for lab names; NOTE-3 for notes).
 */
export function toSearchText(input: string): string {
  return input
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
