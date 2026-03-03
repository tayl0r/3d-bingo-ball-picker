import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DrawnBallsList } from "../DrawnBallsList";

describe("DrawnBallsList", () => {
  it("shows count of drawn balls", () => {
    render(<DrawnBallsList balls={[5, 22, 50]} />);
    expect(screen.getByText("DRAWN (3)")).toBeInTheDocument();
  });

  it("displays ball numbers", () => {
    render(<DrawnBallsList balls={[1, 30, 75]} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("75")).toBeInTheDocument();
  });

  it("displays bingo column letters", () => {
    render(<DrawnBallsList balls={[1, 16, 31, 46, 61]} />);
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("I")).toBeInTheDocument();
    expect(screen.getByText("N")).toBeInTheDocument();
    expect(screen.getByText("G")).toBeInTheDocument();
    expect(screen.getByText("O")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<DrawnBallsList balls={[]} />);
    expect(screen.getByText("DRAWN (0)")).toBeInTheDocument();
  });
});
