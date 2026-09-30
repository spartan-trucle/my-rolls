import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SavedToast } from "./SavedToast";

function renderToast() {
  return render(
    <SavedToast title="Đã lên kệ." body="Scan về thì thả vào dưới đây." editHref="/rolls/r1/edit" editLabel="Sửa" closeLabel="Đóng" />,
  );
}

describe("SavedToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("announces the save as a status toast with an edit link", () => {
    renderToast();

    const toast = screen.getByRole("status");
    expect(toast).toHaveTextContent("Đã lên kệ.");
    expect(toast).toHaveTextContent("Scan về thì thả vào dưới đây.");
    expect(screen.getByRole("link", { name: "Sửa" })).toHaveAttribute("href", "/rolls/r1/edit");
  });

  it("goes away on its own after a few seconds", () => {
    renderToast();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("closes straight away from its close button", () => {
    renderToast();

    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("drops ?saved=1 from the address so a reload doesn't show it again", () => {
    window.history.replaceState(null, "", "/rolls/r1?saved=1");
    renderToast();

    expect(window.location.search).toBe("");
    expect(window.location.pathname).toBe("/rolls/r1");
  });
});
