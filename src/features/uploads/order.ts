const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/** SCAN-2: frames are ordered by file name, naturally (2 before 10). */
export function orderByFileName<T extends { name: string }>(files: T[]): T[] {
  return [...files].sort((a, b) => collator.compare(a.name, b.name));
}
