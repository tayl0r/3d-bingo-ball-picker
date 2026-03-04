export function trimTransparentPixels(
  source: string | File,
): Promise<{ dataUrl: string; aspect: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;

      let top = height;
      let bottom = 0;
      let left = width;
      let right = 0;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha > 0) {
            if (y < top) top = y;
            if (y > bottom) bottom = y;
            if (x < left) left = x;
            if (x > right) right = x;
          }
        }
      }

      // No visible pixels found — return original
      if (top > bottom || left > right) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL("image/png"), aspect: img.width / img.height });
        return;
      }

      const trimW = right - left + 1;
      const trimH = bottom - top + 1;

      const trimmed = document.createElement("canvas");
      trimmed.width = trimW;
      trimmed.height = trimH;
      const trimCtx = trimmed.getContext("2d")!;
      trimCtx.drawImage(canvas, left, top, trimW, trimH, 0, 0, trimW, trimH);

      resolve({ dataUrl: trimmed.toDataURL("image/png"), aspect: trimW / trimH });
    };

    img.onerror = () => reject(new Error("Failed to load image"));

    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = () => { img.src = reader.result as string; };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(source);
    } else {
      img.src = source;
    }
  });
}
