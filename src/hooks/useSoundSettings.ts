import { useState, useCallback } from "react";
import { soundManager } from "../audio/soundManager";

export function useSoundSettings() {
  const [volume, setVolumeState] = useState(() => soundManager.getVolume());
  const [muted, setMutedState] = useState(() => soundManager.isMuted());

  const setVolume = useCallback((v: number) => {
    soundManager.setVolume(v);
    setVolumeState(soundManager.getVolume());
  }, []);

  const setMuted = useCallback((m: boolean) => {
    soundManager.setMuted(m);
    setMutedState(m);
  }, []);

  return { volume, muted, setVolume, setMuted };
}
