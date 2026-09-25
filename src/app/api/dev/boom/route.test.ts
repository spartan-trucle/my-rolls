import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/dev/boom", () => {
  it("throws so Next's onRequestError (instrumentation.ts) captures it as a server error", async () => {
    await expect(GET()).rejects.toThrow("Cuộn /api/dev/boom: thrown on the server");
  });
});
