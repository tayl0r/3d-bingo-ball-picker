import { useState, useEffect } from "react";

const DESIGN_W = 1920;
const DESIGN_H = 1080;

export function useViewportScale() {
  const [scale, setScale] = useState(() =>
    Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H)
  );

  useEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H));
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return { scale, width: DESIGN_W, height: DESIGN_H };
}
