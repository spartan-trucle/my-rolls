import { describe, expect, it } from "vitest";
import { fitLongEdge } from "./fit";

describe("fitLongEdge (D11)", () => {
  it("scales the long edge down to the target, keeping the ratio", () => {
    expect(fitLongEdge(6000, 4000, 2048)).toEqual({ width: 2048, height: 1365 });
    expect(fitLongEdge(4000, 6000, 480)).toEqual({ width: 320, height: 480 });
  });

  it("never upscales", () => {
    expect(fitLongEdge(1200, 800, 2048)).toEqual({ width: 1200, height: 800 });
  });

  it("keeps a square square", () => {
    expect(fitLongEdge(3000, 3000, 480)).toEqual({ width: 480, height: 480 });
  });
});
