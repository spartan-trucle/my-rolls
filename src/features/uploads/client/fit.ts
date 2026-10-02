/** D11: the size of a copy whose long edge is at most `max`, never upscaled. */
export function fitLongEdge(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
