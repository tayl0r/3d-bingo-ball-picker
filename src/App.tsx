import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";
import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/Scene";

const BingoPage = lazy(() =>
  import("./pages/BingoPage").then((m) => ({ default: m.BingoPage }))
);

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<div style={{ width: "100vw", height: "100vh", background: "#1a1a2e" }} />}>
            <BingoPage />
          </Suspense>
        }
      />
      <Route
        path="/test"
        element={
          <div style={{ width: "100vw", height: "100vh", background: "#111" }}>
            <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
              <Scene />
            </Canvas>
          </div>
        }
      />
    </Routes>
  );
}
