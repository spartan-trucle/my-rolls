const GPS_KEYS = new Set(["latitude", "longitude"]);

/** D12: no GPS leaves the browser. exifr returns GPS tags as GPS* plus latitude/longitude. */
export function stripGps(exif: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(exif).filter(([key]) => !key.startsWith("GPS") && !GPS_KEYS.has(key)));
}
