import { useCallback, useEffect, useState } from "react";
import { useBingoGameState, type SpinMode } from "../hooks/useBingoGameState";
import { useViewportScale } from "../hooks/useViewportScale";
import { BingoScene, AUTO_SPIN_SPEED } from "../components/bingo/BingoScene";
import { GetABallButton } from "../components/bingo/GetABallButton";
import { DrawnBallsList } from "../components/bingo/DrawnBallsList";
import { SpinStyleSelector, DEFAULT_STRENGTH, DEFAULT_DURATION } from "../components/bingo/SpinStyleSelector";
import { GameHistoryModal } from "../components/bingo/GameHistoryModal";
import { PatternPickerModal } from "../components/bingo/PatternPickerModal";
import { CurrentPatternDisplay } from "../components/bingo/CurrentPatternDisplay";
import { VolumeControl } from "../components/bingo/VolumeControl";
import { NicknameSheen } from "../components/bingo/NicknameSheen";
import { LogoEditButton } from "../components/bingo/LogoEditButton";
import { SponsorLogoDisplay, SponsorLogoEditButton, DEFAULT_SPONSOR_SETTINGS } from "../components/bingo/SponsorLogo";
import type { SponsorLogoSettings } from "../components/bingo/SponsorLogo";
import { disposeBallTextures } from "../utils/ballTexture";
import { purgeEmptyGames } from "../utils/gameStorage";
import type { CustomLogo } from "../utils/logoStorage";
import { getCustomLogo, setCustomLogo, clearCustomLogo } from "../utils/logoStorage";
import { getSponsorLogo, setSponsorLogo, clearSponsorLogo, getSponsorLogoScale, setSponsorLogoScale, getSponsorLogoOffsetX, setSponsorLogoOffsetX, getSponsorLogoBrightness, setSponsorLogoBrightness, getSponsorLogoContrast, setSponsorLogoContrast } from "../utils/sponsorLogoStorage";
import { soundManager } from "../audio/soundManager";
import bingoNicknames from "../data/bingoNicknames.json";

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy"];
function numberToWords(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
}

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
    try { const v = localStorage.getItem("bingo_spin_time"); return v ? Number(v) : DEFAULT_DURATION; } catch { return DEFAULT_DURATION; }
  });
  const [spinSpeed, setSpinSpeed] = useState(() => {
    try {
      const mode = localStorage.getItem("bingo_spin_mode");
      if (mode === "auto") return AUTO_SPIN_SPEED;
      const v = localStorage.getItem("bingo_spin_speed");
      return v ? Number(v) : DEFAULT_STRENGTH;
    } catch { return DEFAULT_STRENGTH; }
  });

  const [paddleEnabled, setPaddleEnabled] = useState(() => {
    try { return localStorage.getItem("bingo_paddle") === "true"; } catch { return false; }
  });
  const [spinMode, setSpinMode] = useState<SpinMode>(() => {
    try {
      const v = localStorage.getItem("bingo_spin_mode");
      if (v === "manual" || v === "auto") return v;
      return "auto-random";
    } catch { return "auto-random"; }
  });

  useEffect(() => { try { localStorage.setItem("bingo_spin_time", String(spinTime)); } catch {} }, [spinTime]);
  useEffect(() => { if (spinMode !== "auto") { try { localStorage.setItem("bingo_spin_speed", String(spinSpeed)); } catch {} } }, [spinSpeed, spinMode]);
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

  const [sponsorLogo, setSponsorLogoState] = useState(() => getSponsorLogo());
  const [sponsorSettings, setSponsorSettings] = useState<SponsorLogoSettings>(() => ({
    scale: getSponsorLogoScale(),
    offsetX: getSponsorLogoOffsetX(),
    brightness: getSponsorLogoBrightness(),
    contrast: getSponsorLogoContrast(),
  }));
  const handleSponsorLogoChange = useCallback((logo: CustomLogo | null) => {
    if (logo) {
      if (!setSponsorLogo(logo.dataUrl, logo.aspect)) return;
      setSponsorLogoState(logo);
    } else {
      clearSponsorLogo();
      setSponsorLogoState(null);
      setSponsorLogoScale(1);
      setSponsorLogoOffsetX(0);
      setSponsorLogoBrightness(1);
      setSponsorLogoContrast(1);
      setSponsorSettings(DEFAULT_SPONSOR_SETTINGS);
    }
  }, []);
  const handleSponsorSettingsChange = useCallback((patch: Partial<SponsorLogoSettings>) => {
    setSponsorSettings((prev) => {
      const next = { ...prev, ...patch };
      if (patch.scale !== undefined) setSponsorLogoScale(patch.scale);
      if (patch.offsetX !== undefined) setSponsorLogoOffsetX(patch.offsetX);
      if (patch.brightness !== undefined) setSponsorLogoBrightness(patch.brightness);
      if (patch.contrast !== undefined) setSponsorLogoContrast(patch.contrast);
      return next;
    });
  }, []);

  const [sponsorEditOpen, setSponsorEditOpen] = useState(false);
  const [sponsorHidden, setSponsorHidden] = useState(false);

  const [showControls, setShowControls] = useState(() => {
    const saved = localStorage.getItem("bingo_show_controls");
    return saved === null ? false : saved === "true";
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showPatternPicker, setShowPatternPicker] = useState(false);
  const [patternPickerMode, setPatternPickerMode] = useState<"new" | "edit">("new");

  const displayBall = game.phase !== "settling"
    ? (game.selectedBall?.number ?? game.drawnBalls[game.drawnBalls.length - 1])
    : undefined;
  const nickname = displayBall != null
    ? bingoNicknames[String(displayBall) as keyof typeof bingoNicknames]
    : undefined;
  const nicknameText = displayBall != null
    ? `${"BINGO"[Math.floor((displayBall - 1) / 15)]} ${displayBall} - ${numberToWords(displayBall)}`
    : "";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        if ((game.phase === "idle" || game.phase === "auto-mixing") && game.activeBallNumbers.length > 0) {
          soundManager.playBallDraw();
          game.startDraw();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [game.phase, game.activeBallNumbers.length, game.startDraw]);

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

      {/* Controls toggle (hamburger) */}
      <button
        onClick={() => setShowControls((v) => { const next = !v; localStorage.setItem("bingo_show_controls", String(next)); return next; })}
        title={showControls ? "Hide controls" : "Show controls"}
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          zIndex: 20,
          background: "rgba(10, 10, 20, 0.8)",
          border: "1px solid var(--border-light)",
          borderRadius: 10,
          color: "var(--text-muted)",
          fontSize: 24,
          cursor: "pointer",
          padding: "8px 10px",
          lineHeight: 1,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          transition: "all 0.2s",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          alignItems: "center",
        }}
      >
        <span style={{ display: "block", width: 20, height: 2, background: "currentColor", borderRadius: 1 }} />
        <span style={{ display: "block", width: 20, height: 2, background: "currentColor", borderRadius: 1 }} />
        <span style={{ display: "block", width: 20, height: 2, background: "currentColor", borderRadius: 1 }} />
      </button>

      {/* Logo edit button */}
      <div style={{ position: "absolute", top: 4, left: 4, zIndex: 20 }}>
        <LogoEditButton onLogoChange={handleLogoChange} disabled={game.phase !== "idle" && game.phase !== "auto-mixing"} />
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
        logoUrl={customLogo?.dataUrl}
        logoAspect={customLogo?.aspect}
        paddleEnabled={paddleEnabled}
        spinMode={spinMode}
        gameSeed={game.gameSeed}
        drawCount={game.drawCountRef.current}
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
          gap: 50,
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
          <div style={{ minHeight: 260, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {showControls ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <SpinStyleSelector
                  spinSpeed={spinSpeed}
                  setSpinSpeed={setSpinSpeed}
                  spinTime={spinTime}
                  setSpinTime={setSpinTime}
                  spinMode={spinMode}
                  setSpinMode={(v) => {
                    setSpinMode(v);
                    if (v === "auto") {
                      setSpinSpeed(AUTO_SPIN_SPEED);
                    } else {
                      try { const saved = localStorage.getItem("bingo_spin_speed"); if (saved) setSpinSpeed(Number(saved)); } catch {}
                    }
                  }}
                />
                <VolumeControl paddleEnabled={paddleEnabled} onPaddleToggle={setPaddleEnabled} spinMode={spinMode} />
              </div>
            ) : (sponsorHidden && !sponsorLogo) ? null : (
              <div style={{ position: "relative", pointerEvents: "auto" }}>
                <SponsorLogoDisplay
                  logo={sponsorLogo}
                  settings={sponsorSettings}
                  onClick={() => { if (game.phase === "idle" || game.phase === "auto-mixing") setSponsorEditOpen((v) => !v); }}
                />
                {!sponsorLogo && (
                  <button
                    onClick={() => setSponsorHidden(true)}
                    style={{
                      position: "absolute",
                      top: -18,
                      right: -18,
                      zIndex: 20,
                      background: "rgba(10, 10, 20, 0.8)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 6,
                      cursor: "pointer",
                      padding: 4,
                      opacity: 0.3,
                      transition: "opacity 0.2s",
                      lineHeight: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.3"; }}
                    title="Hide sponsor logo area"
                    aria-label="Hide sponsor logo area"
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                )}
                <div style={{ position: "absolute", top: -14, left: -14, zIndex: 20 }}>
                  <SponsorLogoEditButton
                    logo={sponsorLogo}
                    onLogoChange={handleSponsorLogoChange}
                    settings={sponsorSettings}
                    onSettingsChange={handleSponsorSettingsChange}
                    disabled={game.phase !== "idle" && game.phase !== "auto-mixing"}
                    open={sponsorEditOpen}
                    onOpenChange={setSponsorEditOpen}
                    hidePencil
                  />
                </div>
              </div>
            )}
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
          currentPatternId={game.patternId}
        />
      )}
    </div>
  );
}
