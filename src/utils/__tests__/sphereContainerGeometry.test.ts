import { describe, it, expect } from "vitest";
import { createInvertedSphereGeometry } from "../sphereContainerGeometry";

describe("createInvertedSphereGeometry", () => {
  it("returns geometry with the given radius", () => {
    const geo = createInvertedSphereGeometry(3, 2);
    geo.computeBoundingSphere();
    expect(geo.boundingSphere!.radius).toBeCloseTo(3, 1);
  });

  it("inverts the winding order so normals face inward", () => {
    const geo = createInvertedSphereGeometry(1, 1);
    const positions = geo.attributes.position;
    const normals = geo.attributes.normal;

    let inwardCount = 0;
    for (let i = 0; i < positions.count; i++) {
      const px = positions.getX(i);
      const py = positions.getY(i);
      const pz = positions.getZ(i);
      const nx = normals.getX(i);
      const ny = normals.getY(i);
      const nz = normals.getZ(i);
      // Dot product negative = normal points inward
      const dot = px * nx + py * ny + pz * nz;
      if (dot < 0) inwardCount++;
    }
    expect(inwardCount / positions.count).toBeGreaterThan(0.9);
  });

  it("has expected vertex count at detail level 3", () => {
    const geo = createInvertedSphereGeometry(3, 3);
    // Non-indexed: 20 * (detail+1)^2 faces * 3 verts = 20 * 16 * 3 = 960
    expect(geo.attributes.position.count).toBe(960);
  });
});
