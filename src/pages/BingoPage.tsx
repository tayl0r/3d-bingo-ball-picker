import { useEffect, useState } from "react";
import { useBingoGameState } from "../hooks/useBingoGameState";
import { useViewportScale } from "../hooks/useViewportScale";
import { BingoScene } from "../components/bingo/BingoScene";
import { GetABallButton } from "../components/bingo/GetABallButton";
import { DrawnBallsList } from "../components/bingo/DrawnBallsList";
import { SpinStyleSelector } from "../components/bingo/SpinStyleSelector";
import { GameHistoryModal } from "../components/bingo/GameHistoryModal";
import { PatternPickerModal } from "../components/bingo/PatternPickerModal";
import { CurrentPatternDisplay } from "../components/bingo/CurrentPatternDisplay";
import { disposeBallTextures } from "../utils/ballTexture";
import { purgeEmptyGames } from "../utils/gameStorage";

export function BingoPage() {
  const game = useBingoGameState();
  const { scale, width, height } = useViewportScale();
  const [spinTime, setSpinTime] = useState(5);
  const [spinSpeed, setSpinSpeed] = useState(3);
  const [showHistory, setShowHistory] = useState(false);
  const [showPatternPicker, setShowPatternPicker] = useState(false);

  useEffect(() => {
    return () => disposeBallTextures();
  }, []);

  return (
    <div style={{
      width,
      height,
      background: "var(--bg-deep)",
      position: "relative",
      transform: `scale(${scale})`,
      transformOrigin: "center center",
      flexShrink: 0,
      border: "2px solid orange",
    }}>
      {/* Top center copyright */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          color: "rgba(255, 255, 255, 0.4)",
          fontSize: 14,
          letterSpacing: 1,
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        &copy; 2026 Taylor Steil &middot; Created by Taylor Steil
      </div>

      {/* 3D Scene */}
      <BingoScene
        phase={game.phase}
        setPhase={game.setPhase}
        activeBallNumbers={game.activeBallNumbers}
        drawnBalls={game.drawnBalls}
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

      {/* Bottom-right: drawn balls board */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <DrawnBallsList balls={game.drawnBalls} />
      </div>

      {/* Left column: pattern, draw button, spin controls, action buttons */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 40,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 90,
          pointerEvents: "none",
        }}
      >
        <CurrentPatternDisplay patternId={game.patternId} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, pointerEvents: "auto" }}>
          <GetABallButton
            onClick={game.startDraw}
            disabled={game.phase !== "idle" || game.activeBallNumbers.length === 0}
            phase={game.phase}
          />
          <SpinStyleSelector
            spinSpeed={spinSpeed}
            setSpinSpeed={setSpinSpeed}
            spinTime={spinTime}
            setSpinTime={setSpinTime}
          />
        </div>

        <div style={{ display: "flex", gap: 14, pointerEvents: "auto" }}>
          <button
            onClick={() => setShowPatternPicker(true)}
            disabled={game.phase !== "idle"}
            style={{
              padding: "14px 32px",
              fontSize: 20,
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              letterSpacing: 2,
              textTransform: "uppercase",
              borderRadius: 12,
              border: "1px solid var(--border-light)",
              background: "rgba(10, 10, 20, 0.8)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: game.phase !== "idle" ? "var(--text-dim)" : "var(--text)",
              cursor: game.phase !== "idle" ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            New Game
          </button>
          <button
            onClick={() => { purgeEmptyGames(); setShowHistory(true); }}
            disabled={game.phase !== "idle"}
            style={{
              padding: "14px 32px",
              fontSize: 20,
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              letterSpacing: 2,
              textTransform: "uppercase",
              borderRadius: 12,
              border: "1px solid var(--border-light)",
              background: "rgba(10, 10, 20, 0.8)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: game.phase !== "idle" ? "var(--text-dim)" : "var(--text)",
              cursor: game.phase !== "idle" ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            History
          </button>
        </div>
      </div>

      {/* Game History Modal */}
      {showHistory && (
        <GameHistoryModal
          onClose={() => setShowHistory(false)}
          onLoadGame={game.loadGame}
          currentGameId={game.currentGameId}
        />
      )}

      {/* Pattern Picker Modal */}
      {showPatternPicker && (
        <PatternPickerModal
          onSelect={(patternId) => {
            game.newGame(patternId);
            setShowPatternPicker(false);
          }}
          onClose={() => setShowPatternPicker(false)}
        />
      )}
    </div>
  );
}
