import { describe, it, expect } from "vitest";
import { computeFrustumLayout } from "../useFrustumLayout";

// Camera: position [0, 2, 8], FOV 50deg, aspect 16/9, looking at origin
const CAM_POS: [number, number, number] = [0, 2, 8];
const FOV = 50;
const ASPECT = 16 / 9;
const LOOK_AT: [number, number, number] = [0, 0, 0];

describe("computeFrustumLayout", () => {
  const layout = computeFrustumLayout(CAM_POS, FOV, ASPECT, LOOK_AT);

  it("logo position is in the top-left quadrant", () => {
    expect(layout.logoPosition[0]).toBeLessThan(0); // left of center
    expect(layout.logoPosition[1]).toBeGreaterThan(0); // above view center at that Z
  });

  it("lastBall position is in the top-right quadrant", () => {
    expect(layout.lastBallPosition[0]).toBeGreaterThan(0); // right of center
    expect(layout.lastBallPosition[1]).toBeGreaterThan(0); // above view center at that Z
  });

  it("sphere position is centered on view center X at Z=0", () => {
    // Camera at [0,2,8] looking at [0,0,0]: view center at Z=0 is (0,0)
    expect(layout.spherePosition[0]).toBeCloseTo(0);
    // Verify with off-center camera too
    const offCenter = computeFrustumLayout([3, 2, 8], FOV, ASPECT, LOOK_AT);
    // View center at Z=0 from [3,2,8] looking at [0,0,0]: cx = 0
    expect(offCenter.spherePosition[0]).toBeCloseTo(0);
  });

  it("logo and lastBall are both docked to top of their frustum slice", () => {
    // Logo at Z=-1: view center Y ≈ -0.25, logo should be well above that
    expect(layout.logoPosition[1]).toBeGreaterThan(0);
    // Ball at Z=5: view center Y = 1.25, ball should be above that
    expect(layout.lastBallPosition[1]).toBeGreaterThan(1.25);
  });

  it("returns positive scales", () => {
    expect(layout.logoScale).toBeGreaterThan(0);
    expect(layout.lastBallScale).toBeGreaterThan(0);
  });

  it("adapts to different aspect ratios", () => {
    const wide = computeFrustumLayout(CAM_POS, FOV, 21 / 9, LOOK_AT);
    const narrow = computeFrustumLayout(CAM_POS, FOV, 4 / 3, LOOK_AT);
    // Wider aspect → logo further left
    expect(wide.logoPosition[0]).toBeLessThan(narrow.logoPosition[0]);
  });
});
