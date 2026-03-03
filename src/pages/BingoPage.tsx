import { useEffect, useState } from "react";
import { useBingoGameState } from "../hooks/useBingoGameState";
import { BingoScene } from "../components/bingo/BingoScene";
import { GetABallButton } from "../components/bingo/GetABallButton";
import { DrawnBallsList } from "../components/bingo/DrawnBallsList";
import { SpinControls } from "../components/bingo/SpinControls";
import { disposeBallTextures } from "../utils/ballTexture";

export function BingoPage() {
  const game = useBingoGameState();
  const [spinTime, setSpinTime] = useState(5);
  const [spinSpeed, setSpinSpeed] = useState(3);

  useEffect(() => {
    return () => disposeBallTextures();
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1a2e", position: "relative" }}>
      <BingoScene
        phase={game.phase}
        setPhase={game.setPhase}
        activeBallNumbers={game.activeBallNumbers}
        selectedBall={game.selectedBall}
        ballBodiesRef={game.ballBodiesRef}
        ballMeshesRef={game.ballMeshesRef}
        registerBody={game.registerBody}
        registerMesh={game.registerMesh}
        selectBall={game.selectBall}
        onAnimationComplete={game.onAnimationComplete}
        spinTime={spinTime}
        spinSpeed={spinSpeed}
      />
      <GetABallButton
        onClick={game.startDraw}
        disabled={game.phase !== "idle" || game.activeBallNumbers.length === 0}
        phase={game.phase}
      />
      <SpinControls
        spinTime={spinTime}
        setSpinTime={setSpinTime}
        spinSpeed={spinSpeed}
        setSpinSpeed={setSpinSpeed}
      />
      <DrawnBallsList balls={game.drawnBalls} />
    </div>
  );
}
