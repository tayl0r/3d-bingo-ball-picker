import * as THREE from "three";

export function createInvertedSphereGeometry(
  radius: number,
  detail: number = 3
): THREE.IcosahedronGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, detail);

  if (geo.index) {
    // Indexed geometry: flip index winding order
    const arr = geo.index.array;
    for (let i = 0; i < arr.length; i += 3) {
      const tmp = arr[i];
      arr[i] = arr[i + 2];
      arr[i + 2] = tmp;
    }
    geo.index.needsUpdate = true;
  } else {
    // Non-indexed geometry: swap vertex triples directly
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const norm = geo.attributes.normal;
    for (let i = 0; i < pos.count; i += 3) {
      // Swap vertices 0 and 2 within each triangle
      for (const attr of [pos, uv, norm]) {
        if (!attr) continue;
        const itemSize = attr.itemSize;
        for (let j = 0; j < itemSize; j++) {
          const a = attr.array[i * itemSize + j];
          const b = attr.array[(i + 2) * itemSize + j];
          (attr.array as Float32Array)[i * itemSize + j] = b;
          (attr.array as Float32Array)[(i + 2) * itemSize + j] = a;
        }
      }
    }
  }

  geo.computeVertexNormals();
  return geo;
}
