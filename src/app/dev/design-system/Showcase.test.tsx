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
