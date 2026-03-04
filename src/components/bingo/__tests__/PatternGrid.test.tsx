import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PatternGrid } from "../PatternGrid";

describe("PatternGrid", () => {
  const xGrid = [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ];

  it("renders a 5x5 grid with correct number of cells", () => {
    const { container } = render(<PatternGrid grid={xGrid} size={80} />);
    const cells = container.querySelectorAll("[data-cell]");
    expect(cells).toHaveLength(25);
  });

  it("marks active cells", () => {
    const { container } = render(<PatternGrid grid={xGrid} size={80} />);
    const activeCells = container.querySelectorAll("[data-active='true']");
    // X pattern has 9 active cells (5 on each diagonal, minus center overlap)
    expect(activeCells).toHaveLength(9);
  });
});
