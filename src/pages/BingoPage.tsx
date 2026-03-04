import { useCallback, useEffect, useState } from "react";
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
import { NicknameSheen } from "../components/bingo/NicknameSheen";
import { LogoEditButton } from "../components/bingo/LogoEditButton";
import { disposeBallTextures } from "../utils/ballTexture";
import { purgeEmptyGames } from "../utils/gameStorage";
import type { CustomLogo } from "../utils/logoStorage";
import { getCustomLogo, setCustomLogo, clearCustomLogo } from "../utils/logoStorage";
import bingoNicknames from "../data/bingoNicknames.json";
import { soundManager } from "../audio/soundManager";

const gameActionButtonStyle: React.CSSProperties = {
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
  color: "var(--text)",
  cursor: "pointer",
  transition: "all 0.2s",
};

export function BingoPage() {
  const game = useBingoGameState();
  const { scale, width, height } = useViewportScale();
  const [spinTime, setSpinTime] = useState(() => {
    try { const v = localStorage.getItem("bingo_spin_time"); return v ? Number(v) : 5; } catch { return 5; }
  });
  const [spinSpeed, setSpinSpeed] = useState(() => {
    try { const v = localStorage.getItem("bingo_spin_speed"); return v ? Number(v) : 3; } catch { return 3; }
  });

  const [paddleEnabled, setPaddleEnabled] = useState(() => {
    try { return localStorage.getItem("bingo_paddle") === "true"; } catch { return false; }
  });
  const [spinMode, setSpinMode] = useState<"manual" | "auto">(() => {
    try { const v = localStorage.getItem("bingo_spin_mode"); return v === "manual" ? "manual" : "auto"; } catch { return "auto"; }
  });

  useEffect(() => { try { localStorage.setItem("bingo_spin_time", String(spinTime)); } catch {} }, [spinTime]);
  useEffect(() => { try { localStorage.setItem("bingo_spin_speed", String(spinSpeed)); } catch {} }, [spinSpeed]);
  useEffect(() => { try { localStorage.setItem("bingo_paddle", String(paddleEnabled)); } catch {} }, [paddleEnabled]);
  useEffect(() => { try { localStorage.setItem("bingo_spin_mode", spinMode); } catch {} }, [spinMode]);
  const [customLogo, setCustomLogoState] = useState(() => getCustomLogo());
  const handleLogoChange = useCallback((logo: CustomLogo | null) => {
    if (logo) {
      if (!setCustomLogo(logo.dataUrl, logo.aspect)) return;
      setCustomLogoState(logo);
    } else {
      clearCustomLogo();
      setCustomLogoState(null);
    }
  }, []);

  const [showHistory, setShowHistory] = useState(false);
  const [showPatternPicker, setShowPatternPicker] = useState(false);
  const [patternPickerMode, setPatternPickerMode] = useState<"new" | "edit">("new");

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
      {nickname && displayBall != null && (
        <NicknameSheen key={displayBall} displayBall={displayBall} nicknameText={nicknameText} />
      )}

      {/* Logo edit button */}
      <LogoEditButton onLogoChange={handleLogoChange} />

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
        logoUrl={customLogo?.dataUrl}
        logoAspect={customLogo?.aspect}
        paddleEnabled={paddleEnabled}
        spinMode={spinMode}
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
        <CurrentPatternDisplay
          patternId={game.patternId}
          editDisabled={game.phase !== "idle" && game.phase !== "auto-mixing"}
          onEdit={() => {
            if (game.phase !== "idle" && game.phase !== "auto-mixing") return;
            soundManager.playButtonClick();
            setPatternPickerMode("edit");
            setShowPatternPicker(true);
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, pointerEvents: "auto" }}>
          <GetABallButton
            onClick={() => { soundManager.playBallDraw(); game.startDraw(); }}
            disabled={(game.phase !== "idle" && game.phase !== "auto-mixing") || game.activeBallNumbers.length === 0}
            phase={game.phase}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SpinStyleSelector
              spinSpeed={spinSpeed}
              setSpinSpeed={setSpinSpeed}
              spinTime={spinTime}
              setSpinTime={setSpinTime}
              spinMode={spinMode}
              setSpinMode={setSpinMode}
            />
            <VolumeControl paddleEnabled={paddleEnabled} onPaddleToggle={setPaddleEnabled} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, pointerEvents: "auto" }}>
          <button
            onClick={() => { soundManager.playButtonClick(); setPatternPickerMode("new"); setShowPatternPicker(true); }}
            disabled={game.phase !== "idle" && game.phase !== "auto-mixing"}
            style={gameActionButtonStyle}
          >
            New Game
          </button>
          <button
            onClick={() => { soundManager.playButtonClick(); purgeEmptyGames(); setShowHistory(true); }}
            disabled={game.phase !== "idle" && game.phase !== "auto-mixing"}
            style={gameActionButtonStyle}
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
            if (patternPickerMode === "edit") {
              game.changePattern(patternId);
            } else {
              game.newGame(patternId);
            }
            setShowPatternPicker(false);
          }}
          onClose={() => { setShowPatternPicker(false); setPatternPickerMode("new"); }}
        />
      )}
    </div>
  );
}
