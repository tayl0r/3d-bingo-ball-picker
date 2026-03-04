import { useState, useRef, useEffect, useCallback } from "react";
import type { CustomLogo } from "../../utils/logoStorage";
import { trimTransparentPixels } from "../../utils/trimTransparentPixels";

interface LogoEditButtonProps {
  onLogoChange: (logo: CustomLogo | null) => void;
  disabled?: boolean;
}

export function LogoEditButton({ onLogoChange, disabled }: LogoEditButtonProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleResult = useCallback(
    (result: { dataUrl: string; aspect: number }) => {
      onLogoChange(result);
      setOpen(false);
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
    setOpen(false);
    setUrl("");
    setError("");
  }, [onLogoChange]);

  return (
    <div ref={popoverRef} style={{ position: "absolute", top: 16, left: 16, zIndex: 20 }}>
      <button
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "none",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          padding: 6,
          opacity: disabled ? 0.15 : open ? 1 : 0.3,
          transition: "opacity 0.2s",
        }}
        onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={(e) => { if (!open && !disabled) e.currentTarget.style.opacity = "0.3"; }}
        title="Edit logo"
        aria-label="Edit logo"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      </button>

      {/* Popover */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 0,
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
