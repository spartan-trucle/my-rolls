import { describe, expect, it } from "vitest";
import { orderByFileName } from "./order";

describe("orderByFileName", () => {
  it("sorts numbers naturally", () => {
    const names = ["10.jpg", "2.jpg", "1.jpg"].map((name) => ({ name }));
    expect(orderByFileName(names).map((f) => f.name)).toEqual(["1.jpg", "2.jpg", "10.jpg"]);
  });

  it("keeps lab prefixes together and ignores case", () => {
    const names = ["IMG_0010.JPG", "img_0002.jpg", "IMG_0001.jpg"].map((name) => ({ name }));
    expect(orderByFileName(names).map((f) => f.name)).toEqual(["IMG_0001.jpg", "img_0002.jpg", "IMG_0010.JPG"]);
  });

  it("does not mutate its input", () => {
    const input = [{ name: "2.jpg" }, { name: "1.jpg" }];
    orderByFileName(input);
    expect(input[0].name).toBe("2.jpg");
  });
});
