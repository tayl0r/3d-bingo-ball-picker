import { describe, it, expect } from "vitest";
import { getBallColor, createBallTexture } from "../ballTexture";

describe("getBallColor", () => {
  it("returns blue for B column (1-15)", () => {
    expect(getBallColor(1)).toBe("#1E90FF");
    expect(getBallColor(15)).toBe("#1E90FF");
  });

  it("returns red for I column (16-30)", () => {
    expect(getBallColor(16)).toBe("#FF4444");
    expect(getBallColor(30)).toBe("#FF4444");
  });

  it("returns light gray for N column (31-45)", () => {
    expect(getBallColor(31)).toBe("#EEEEEE");
    expect(getBallColor(45)).toBe("#EEEEEE");
  });

  it("returns green for G column (46-60)", () => {
    expect(getBallColor(46)).toBe("#32CD32");
    expect(getBallColor(60)).toBe("#32CD32");
  });

  it("returns orange for O column (61-75)", () => {
    expect(getBallColor(61)).toBe("#FFA500");
    expect(getBallColor(75)).toBe("#FFA500");
  });
});

describe("createBallTexture", () => {
  it("returns a texture with a canvas image", () => {
    const texture = createBallTexture(1);
    expect(texture).toBeDefined();
    expect(texture.image).toBeInstanceOf(HTMLCanvasElement);
  });

  it("caches textures for the same number", () => {
    const t1 = createBallTexture(42);
    const t2 = createBallTexture(42);
    expect(t1).toBe(t2);
  });

  it("returns different textures for different numbers", () => {
    const t1 = createBallTexture(1);
    const t2 = createBallTexture(75);
    expect(t1).not.toBe(t2);
  });
});
