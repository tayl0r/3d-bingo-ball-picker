import { describe, it, expect } from "vitest";
import { computeFrustumLayout } from "../useFrustumLayout";

// Camera: position [0, 2, 8], FOV 50deg, aspect 16/9
const CAM_POS: [number, number, number] = [0, 2, 8];
const FOV = 50;
const ASPECT = 16 / 9;

describe("computeFrustumLayout", () => {
  const layout = computeFrustumLayout(CAM_POS, FOV, ASPECT);

  it("logo position is in the top-left quadrant", () => {
    expect(layout.logoPosition[0]).toBeLessThan(0); // left of center
    expect(layout.logoPosition[1]).toBeGreaterThan(CAM_POS[1]); // above camera Y
  });

  it("lastBall position is in the top-right quadrant", () => {
    expect(layout.lastBallPosition[0]).toBeGreaterThan(0); // right of center
    expect(layout.lastBallPosition[1]).toBeGreaterThan(CAM_POS[1]); // above camera Y
  });

  it("sphere position is centered on camera X", () => {
    expect(layout.spherePosition[0]).toBe(CAM_POS[0]);
    // Verify with off-center camera too
    const offCenter = computeFrustumLayout([3, 2, 8], FOV, ASPECT);
    expect(offCenter.spherePosition[0]).toBe(3);
  });

  it("logo and lastBall are both docked to top of their frustum slice", () => {
    // Both use the same padding fraction from top, so both Y > camera Y
    expect(layout.logoPosition[1]).toBeGreaterThan(CAM_POS[1]);
    expect(layout.lastBallPosition[1]).toBeGreaterThan(CAM_POS[1]);
  });

  it("returns positive scales", () => {
    expect(layout.logoScale).toBeGreaterThan(0);
    expect(layout.lastBallScale).toBeGreaterThan(0);
  });

  it("adapts to different aspect ratios", () => {
    const wide = computeFrustumLayout(CAM_POS, FOV, 21 / 9);
    const narrow = computeFrustumLayout(CAM_POS, FOV, 4 / 3);
    // Wider aspect → logo further left
    expect(wide.logoPosition[0]).toBeLessThan(narrow.logoPosition[0]);
  });
});
