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
import { VolumeControl } from "../components/bingo/VolumeControl";
import { disposeBallTextures } from "../utils/ballTexture";
import { purgeEmptyGames } from "../utils/gameStorage";
import bingoNicknames from "../data/bingoNicknames.json";
import { soundManager } from "../audio/soundManager";

export function BingoPage() {
  const game = useBingoGameState();
  const { scale, width, height } = useViewportScale();
  const [spinTime, setSpinTime] = useState(() => {
    try { const v = localStorage.getItem("bingo_spin_time"); return v ? Number(v) : 5; } catch { return 5; }
  });
  const [spinSpeed, setSpinSpeed] = useState(() => {
    try { const v = localStorage.getItem("bingo_spin_speed"); return v ? Number(v) : 3; } catch { return 3; }
  });

  useEffect(() => { try { localStorage.setItem("bingo_spin_time", String(spinTime)); } catch {} }, [spinTime]);
  useEffect(() => { try { localStorage.setItem("bingo_spin_speed", String(spinSpeed)); } catch {} }, [spinSpeed]);
  const [showHistory, setShowHistory] = useState(false);
  const [showPatternPicker, setShowPatternPicker] = useState(false);

  const displayBall = game.phase !== "settling"
    ? (game.selectedBall?.number ?? game.drawnBalls[game.drawnBalls.length - 1])
    : undefined;
  const nickname = displayBall != null
    ? bingoNicknames[String(displayBall) as keyof typeof bingoNicknames]
    : undefined;
  const nicknameText = nickname ? `${displayBall} \u2014 ${nickname}` : "";

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
      {/* Bottom center copyright */}
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
        &copy; 2026 Taylor Steil
      </div>

      {/* Bingo nickname for last drawn ball */}
      {nickname && (
        <svg
          key={displayBall}
          viewBox="0 0 1000 100"
          style={{
            position: "absolute",
            bottom: 44,
            left: "50%",
            transform: "translateX(-50%)",
            width: "55%",
            height: 80,
            zIndex: 10,
            pointerEvents: "none",
            overflow: "visible",
            animation: "nickname-fade-in 0.4s ease-in",
          }}
        >
          <defs>
            <linearGradient id={`sheen-${displayBall}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
              <stop offset="15%" stopColor="rgba(255,255,255,0.7)" />
              <stop offset="20%" stopColor="#ff0000" />
              <stop offset="28%" stopColor="#ff8800" />
              <stop offset="36%" stopColor="#ffff00" />
              <stop offset="44%" stopColor="#00cc00" />
              <stop offset="52%" stopColor="#0088ff" />
              <stop offset="60%" stopColor="#4400ff" />
              <stop offset="68%" stopColor="#8800cc" />
              <stop offset="75%" stopColor="rgba(255,255,255,0.7)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
              <animate
                attributeName="x1"
                values="-100%;100%"
                dur="2.5s"
                fill="freeze"
              />
              <animate
                attributeName="x2"
                values="0%;200%"
                dur="2.5s"
                fill="freeze"
              />
            </linearGradient>
          </defs>
          <text
            x="500"
            y="70"
            textAnchor="middle"
            fill={`url(#sheen-${displayBall})`}
            fontFamily="var(--font-mono)"
            fontStyle="italic"
            fontSize="80"
            letterSpacing="1"
          >
            {nicknameText}
          </text>
        </svg>
      )}

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
          gap: 70,
          pointerEvents: "none",
        }}
      >
        <CurrentPatternDisplay patternId={game.patternId} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, pointerEvents: "auto" }}>
          <GetABallButton
            onClick={() => { soundManager.playBallDraw(); game.startDraw(); }}
            disabled={game.phase !== "idle" || game.activeBallNumbers.length === 0}
            phase={game.phase}
          />
          <SpinStyleSelector
            spinSpeed={spinSpeed}
            setSpinSpeed={setSpinSpeed}
            spinTime={spinTime}
            setSpinTime={setSpinTime}
          />
          <VolumeControl />
        </div>

        <div style={{ display: "flex", gap: 14, pointerEvents: "auto" }}>
          <button
            onClick={() => { soundManager.playButtonClick(); setShowPatternPicker(true); }}
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
            onClick={() => { soundManager.playButtonClick(); purgeEmptyGames(); setShowHistory(true); }}
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
