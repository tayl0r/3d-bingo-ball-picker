import * as THREE from "three";

export function getBallColor(num: number): string {
  if (num <= 15) return "#1E90FF";
  if (num <= 30) return "#FF4444";
  if (num <= 45) return "#EEEEEE";
  if (num <= 60) return "#32CD32";
  return "#FFA500";
}

const textureCache = new Map<number, THREE.CanvasTexture>();

export function createBallTexture(num: number): THREE.CanvasTexture {
  if (textureCache.has(num)) return textureCache.get(num)!;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = getBallColor(num);
  ctx.fillRect(0, 0, size, size);

  // White circle for number
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();

  // Number text
  ctx.fillStyle = "#000000";
  ctx.font = `bold ${size * 0.28}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(num), size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(num, texture);
  return texture;
}

export function disposeBallTextures() {
  for (const texture of textureCache.values()) {
    texture.dispose();
  }
  textureCache.clear();
}
