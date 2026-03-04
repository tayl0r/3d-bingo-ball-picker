import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("zzfx", () => ({
  zzfx: vi.fn(),
}));

import { VolumeControl } from "../VolumeControl";
import { soundManager } from "../../../audio/soundManager";

describe("VolumeControl", () => {
  beforeEach(() => {
    localStorage.clear();
    soundManager.reset();
  });

  it("renders a mute button", () => {
    render(<VolumeControl paddleEnabled={false} onPaddleToggle={() => {}} />);
    const button = screen.getByTitle("Mute");
    expect(button).toBeInTheDocument();
  });

  it("renders a volume slider", () => {
    render(<VolumeControl paddleEnabled={false} onPaddleToggle={() => {}} />);
    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
  });

  it("toggles mute on button click", () => {
    render(<VolumeControl paddleEnabled={false} onPaddleToggle={() => {}} />);
    let button = screen.getByTitle("Mute");

    // Initially unmuted
    expect(button).toHaveAttribute("title", "Mute");

    // Click to mute
    fireEvent.click(button);
    button = screen.getByTitle("Unmute");
    expect(soundManager.isMuted()).toBe(true);

    // Click to unmute
    fireEvent.click(button);
    button = screen.getByTitle("Mute");
    expect(soundManager.isMuted()).toBe(false);
  });

  it("slider reflects volume value", () => {
    render(<VolumeControl paddleEnabled={false} onPaddleToggle={() => {}} />);
    const slider = screen.getByRole("slider") as HTMLInputElement;
    expect(parseFloat(slider.value)).toBeCloseTo(0.7);
  });

  it("slider updates volume on change", () => {
    render(<VolumeControl paddleEnabled={false} onPaddleToggle={() => {}} />);
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "0.5" } });
    expect(soundManager.getVolume()).toBeCloseTo(0.5);
  });

  it("renders paddle toggle button", () => {
    render(<VolumeControl paddleEnabled={false} onPaddleToggle={() => {}} />);
    expect(screen.getByTitle("Enable ball paddle")).toBeInTheDocument();
  });

  it("paddle button title reflects enabled state", () => {
    render(<VolumeControl paddleEnabled={true} onPaddleToggle={() => {}} />);
    expect(screen.getByTitle("Disable ball paddle")).toBeInTheDocument();
  });

  it("clicking paddle button calls onPaddleToggle with toggled value", () => {
    const onToggle = vi.fn();
    render(<VolumeControl paddleEnabled={false} onPaddleToggle={onToggle} />);
    fireEvent.click(screen.getByTitle("Enable ball paddle"));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("clicking enabled paddle button calls onPaddleToggle with false", () => {
    const onToggle = vi.fn();
    render(<VolumeControl paddleEnabled={true} onPaddleToggle={onToggle} />);
    fireEvent.click(screen.getByTitle("Disable ball paddle"));
    expect(onToggle).toHaveBeenCalledWith(false);
  });
});
