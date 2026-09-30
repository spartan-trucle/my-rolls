/** The parts of the File and Directory Entries API a dropped folder needs. */
interface IEntry {
  isFile: boolean;
  isDirectory: boolean;
  file?: (ok: (file: File) => void, fail?: (err: unknown) => void) => void;
  createReader?: () => { readEntries: (ok: (entries: IEntry[]) => void, fail?: (err: unknown) => void) => void };
}

async function readEntry(entry: IEntry): Promise<File[]> {
  if (entry.isFile && entry.file) {
    return [await new Promise<File>((ok, fail) => entry.file!(ok, fail))];
  }
  if (entry.isDirectory && entry.createReader) {
    const reader = entry.createReader();
    const all: File[] = [];
    // readEntries returns at most ~100 entries per call; read until it returns none.
    for (;;) {
      const batch = await new Promise<IEntry[]>((ok, fail) => reader.readEntries(ok, fail));
      if (batch.length === 0) break;
      for (const child of batch) all.push(...(await readEntry(child)));
    }
    return all;
  }
  return [];
}

/** SCAN-2 "drop a folder": walks dropped folders; plain `files` when entries aren't available. */
export async function collectDroppedFiles(dataTransfer: DataTransfer): Promise<File[]> {
  const items = dataTransfer.items ? Array.from(dataTransfer.items) : [];
  const entries = items
    .filter((item) => item.kind === "file")
    .map((item) => (item.webkitGetAsEntry?.() ?? null) as unknown as IEntry | null)
    .filter((e): e is IEntry => e !== null);
  if (entries.length === 0) return Array.from(dataTransfer.files ?? []);
  const nested = await Promise.all(entries.map(readEntry));
  return nested.flat();
}
