import { useEffect } from "react";
import { useBingoGameState } from "../hooks/useBingoGameState";
import { BingoScene } from "../components/bingo/BingoScene";
import { GetABallButton } from "../components/bingo/GetABallButton";
import { DrawnBallsList } from "../components/bingo/DrawnBallsList";
import { disposeBallTextures } from "../utils/ballTexture";

export function BingoPage() {
  const game = useBingoGameState();

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
        registerBody={game.registerBody}
        selectBall={game.selectBall}
        onAnimationComplete={game.onAnimationComplete}
      />
      <GetABallButton
        onClick={game.startDraw}
        disabled={game.phase !== "idle" || game.activeBallNumbers.length === 0}
        phase={game.phase}
      />
      <DrawnBallsList balls={game.drawnBalls} />
    </div>
  );
}
