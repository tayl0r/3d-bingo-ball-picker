import { useState, useRef, useEffect, useCallback } from "react";
import type { CustomLogo } from "../../utils/logoStorage";
import { trimTransparentPixels } from "../../utils/trimTransparentPixels";

const SCALE_MIN = 0.5;
const SCALE_MAX = 3;
const SCALE_STEP = 0.1;
const OFFSET_MIN = -200;
const OFFSET_MAX = 200;
const OFFSET_STEP = 1;
const BRIGHTNESS_MIN = 0;
const BRIGHTNESS_MAX = 3;
const BRIGHTNESS_STEP = 0.05;
const CONTRAST_MIN = 0;
const CONTRAST_MAX = 3;
const CONTRAST_STEP = 0.05;

export interface SponsorLogoSettings {
  scale: number;
  offsetX: number;
  brightness: number;
  contrast: number;
}

export const DEFAULT_SPONSOR_SETTINGS: SponsorLogoSettings = {
  scale: 1,
  offsetX: 0,
  brightness: 1,
  contrast: 1,
};

function SliderRow({ label, min, max, step, value, onChange }: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase", flexShrink: 0, width: 28 }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: "var(--cyan)", cursor: "pointer" }}
      />
    </div>
  );
}

interface SponsorLogoDisplayProps {
  logo: CustomLogo | null;
  settings: SponsorLogoSettings;
  onClick?: () => void;
}

export function SponsorLogoDisplay({ logo, settings, onClick }: SponsorLogoDisplayProps) {
  return (
    <div style={{ position: "relative", maxWidth: 260, width: "100%", overflow: "visible" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 80,
          borderRadius: 10,
          border: logo ? "none" : "2px dashed rgba(255,255,255,0.15)",
          background: logo ? "transparent" : "rgba(10, 10, 20, 0.5)",
          backdropFilter: logo ? "none" : "blur(8px)",
          WebkitBackdropFilter: logo ? "none" : "blur(8px)",
          padding: logo ? 0 : 16,
          overflow: "visible",
          cursor: onClick ? "pointer" : "default",
        }}
        onClick={onClick}
      >
        {logo ? (
          <img
            src={logo.dataUrl}
            alt="Sponsor logo"
            style={{
              width: "100%",
              maxHeight: 220,
              objectFit: "contain",
              display: "block",
              transform: `scale(${settings.scale}) translateX(${settings.offsetX}px)`,
              transformOrigin: "center center",
              filter: `brightness(${settings.brightness}) contrast(${settings.contrast})`,
            }}
          />
        ) : (
          <span
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Sponsor Logo
          </span>
        )}
      </div>
    </div>
  );
}

interface SponsorLogoEditButtonProps {
  logo: CustomLogo | null;
  onLogoChange: (logo: CustomLogo | null) => void;
  settings: SponsorLogoSettings;
  onSettingsChange: (settings: Partial<SponsorLogoSettings>) => void;
  disabled: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hidePencil?: boolean;
}

export function SponsorLogoEditButton({ logo, onLogoChange, settings, onSettingsChange, disabled, open, onOpenChange, hidePencil }: SponsorLogoEditButtonProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onOpenChange]);

  const handleResult = useCallback(
    (result: { dataUrl: string; aspect: number }) => {
      onLogoChange(result);
      onOpenChange(false);
      setUrl("");
      setError("");
      setLoading(false);
    },
    [onLogoChange],
  );

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError("");
      try {
        const result = await trimTransparentPixels(file);
        handleResult(result);
      } catch {
        setError("Failed to process image");
        setLoading(false);
      }
    },
    [handleResult],
  );

  const handleUrl = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    try {
      const result = await trimTransparentPixels(trimmed);
      handleResult(result);
    } catch {
      setError("Failed to load image. Try downloading it first, then upload the file.");
      setLoading(false);
    }
  }, [url, handleResult]);

  const handleReset = useCallback(() => {
    onLogoChange(null);
    onOpenChange(false);
    setUrl("");
    setError("");
  }, [onLogoChange, onOpenChange]);

  return (
    <div ref={popoverRef} style={{ position: "relative" }}>
      {!hidePencil && <button
        disabled={disabled}
        onClick={() => onOpenChange(!open)}
        style={{
          background: "rgba(10, 10, 20, 0.8)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 6,
          cursor: disabled ? "not-allowed" : "pointer",
          padding: 4,
          opacity: disabled ? 0.15 : open ? 1 : 0.3,
          transition: "opacity 0.2s",
          lineHeight: 0,
        }}
        onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={(e) => { if (!open && !disabled) e.currentTarget.style.opacity = "0.3"; }}
        title="Edit sponsor logo"
        aria-label="Edit sponsor logo"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      </button>}

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            marginBottom: 8,
            background: "rgba(10, 10, 20, 0.95)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minWidth: 220,
            pointerEvents: "auto",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            style={actionButtonStyle}
          >
            Upload Image
          </button>

          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              placeholder="Paste image URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleUrl(); }}
              style={{
                flex: 1,
                padding: "6px 8px",
                fontSize: 13,
                fontFamily: "var(--font-mono)",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 6,
                color: "var(--text)",
                outline: "none",
              }}
            />
            <button
              onClick={handleUrl}
              disabled={loading || !url.trim()}
              style={{ ...actionButtonStyle, padding: "6px 12px" }}
            >
              Go
            </button>
          </div>

          {logo && (
            <>
              <SliderRow label="Size" min={SCALE_MIN} max={SCALE_MAX} step={SCALE_STEP} value={settings.scale} onChange={(v) => onSettingsChange({ scale: v })} />
              <SliderRow label="Pos" min={OFFSET_MIN} max={OFFSET_MAX} step={OFFSET_STEP} value={settings.offsetX} onChange={(v) => onSettingsChange({ offsetX: v })} />
              <SliderRow label="Brt" min={BRIGHTNESS_MIN} max={BRIGHTNESS_MAX} step={BRIGHTNESS_STEP} value={settings.brightness} onChange={(v) => onSettingsChange({ brightness: v })} />
              <SliderRow label="Con" min={CONTRAST_MIN} max={CONTRAST_MAX} step={CONTRAST_STEP} value={settings.contrast} onChange={(v) => onSettingsChange({ contrast: v })} />
            </>
          )}

          <button
            onClick={handleReset}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              padding: "4px 0",
              textAlign: "left",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.9)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
          >
            Reset to Default
          </button>

          {loading && <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Processing...</div>}
          {error && <div style={{ color: "#ff6b6b", fontSize: 12 }}>{error}</div>}
        </div>
      )}
    </div>
  );
}

const actionButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  fontSize: 14,
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.08)",
  color: "var(--text)",
  cursor: "pointer",
  transition: "background 0.2s",
};
