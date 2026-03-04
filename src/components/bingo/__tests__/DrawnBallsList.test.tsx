import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DrawnBallsList } from "../DrawnBallsList";

vi.mock("zzfx", () => ({ zzfx: vi.fn() }));

describe("DrawnBallsList", () => {
  it("shows count of drawn balls", () => {
    render(<DrawnBallsList balls={[5, 22, 50]} />);
    expect(screen.getByText("3/75")).toBeInTheDocument();
  });

  it("displays all 75 numbers on the board", () => {
    render(<DrawnBallsList balls={[1, 30, 75]} />);
    // All numbers 1-75 should appear on the board
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("30").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("75").length).toBeGreaterThanOrEqual(1);
  });

  it("displays bingo column headers", () => {
    render(<DrawnBallsList balls={[]} />);
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("I")).toBeInTheDocument();
    expect(screen.getByText("N")).toBeInTheDocument();
    expect(screen.getByText("G")).toBeInTheDocument();
    expect(screen.getByText("O")).toBeInTheDocument();
  });

  it("renders empty state with 0/75", () => {
    render(<DrawnBallsList balls={[]} />);
    expect(screen.getByText("0/75")).toBeInTheDocument();
  });
});
