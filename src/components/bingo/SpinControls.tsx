interface SpinControlsProps {
  spinTime: number;
  setSpinTime: (v: number) => void;
  spinSpeed: number;
  setSpinSpeed: (v: number) => void;
}

export function SpinControls({ spinTime, setSpinTime, spinSpeed, setSpinSpeed }: SpinControlsProps) {
  return (
    <div style={{
      position: "absolute",
      bottom: 40,
      right: 40,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      zIndex: 10,
      color: "white",
      fontFamily: "sans-serif",
      fontSize: 14,
    }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        Spin Time: {spinTime.toFixed(1)}s
        <input
          type="range"
          min={2} max={10} step={0.5}
          value={spinTime}
          onChange={(e) => setSpinTime(Number(e.target.value))}
          style={{ width: 140 }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        Spin Speed: {spinSpeed.toFixed(1)}x
        <input
          type="range"
          min={0.5} max={3} step={0.1}
          value={spinSpeed}
          onChange={(e) => setSpinSpeed(Number(e.target.value))}
          style={{ width: 140 }}
        />
      </label>
    </div>
  );
}
