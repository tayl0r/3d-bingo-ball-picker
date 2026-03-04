import { useState, useCallback, useRef } from "react";
import type { RapierRigidBody } from "@react-three/rapier";
import type * as THREE from "three";
import {
  getOrCreateActiveGame,
  createGame,
  updateGame,
  setActiveGameId,
  type SavedGame,
} from "../utils/gameStorage";

export type GamePhase = "idle" | "mixing" | "settling" | "selecting" | "animating";

export interface SelectedBall {
  number: number;
  startPosition: [number, number, number];
  startRotation: [number, number, number, number]; // quaternion xyzw
}

function ballsFromDrawn(drawn: number[]): number[] {
  const drawnSet = new Set(drawn);
  return Array.from({ length: 75 }, (_, i) => i + 1).filter((n) => !drawnSet.has(n));
}

export function useBingoGameState() {
  const initialGameRef = useRef(getOrCreateActiveGame());
  const [currentGameId, setCurrentGameId] = useState<string>(initialGameRef.current.id);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const phaseRef = useRef<GamePhase>("idle");
  const [activeBallNumbers, setActiveBallNumbers] = useState<number[]>(() =>
    ballsFromDrawn(initialGameRef.current.drawnBalls),
  );
  const [drawnBalls, setDrawnBalls] = useState<number[]>(initialGameRef.current.drawnBalls);
  const [patternId, setPatternId] = useState<string>(initialGameRef.current.patternId ?? "any-line");
  const [selectedBall, setSelectedBall] = useState<SelectedBall | null>(null);
  const selectedBallRef = useRef<SelectedBall | null>(null);
  const ballBodiesRef = useRef<Map<number, RapierRigidBody>>(new Map());
  const ballMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());

  const setPhaseTracked = useCallback((p: GamePhase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const registerBody = useCallback((num: number, body: RapierRigidBody | null) => {
    if (body) {
      ballBodiesRef.current.set(num, body);
    } else {
      ballBodiesRef.current.delete(num);
    }
  }, []);

  const registerMesh = useCallback((num: number, mesh: THREE.Mesh | null) => {
    if (mesh) {
      ballMeshesRef.current.set(num, mesh);
    } else {
      ballMeshesRef.current.delete(num);
    }
  }, []);

  const startDraw = useCallback(() => {
    if (phase !== "idle" || activeBallNumbers.length === 0) return;
    setPhaseTracked("mixing");
  }, [phase, activeBallNumbers.length, setPhaseTracked]);

  const selectBall = useCallback((num: number, position: [number, number, number], rotation: [number, number, number, number]) => {
    if (phaseRef.current !== "mixing" && phaseRef.current !== "settling" && phaseRef.current !== "selecting") return;
    const ball = { number: num, startPosition: position, startRotation: rotation };
    selectedBallRef.current = ball;
    setSelectedBall(ball);
    setActiveBallNumbers((prev) => prev.filter((n) => n !== num));
    setPhaseTracked("animating");
  }, [setPhaseTracked]);

  const onAnimationComplete = useCallback(() => {
    const current = selectedBallRef.current;
    if (current) {
      setDrawnBalls((prev) => [...prev, current.number]);
      // Persist outside the state updater to avoid double-writes in StrictMode
      const nextDrawn = [...drawnBalls, current.number];
      updateGame(currentGameId, nextDrawn);
    }
    selectedBallRef.current = null;
    setSelectedBall(null);
    setPhaseTracked("idle");
  }, [setPhaseTracked, currentGameId, drawnBalls]);

  const newGame = useCallback((selectedPatternId: string) => {
    if (phase !== "idle") return;
    const game = createGame(selectedPatternId);
    setCurrentGameId(game.id);
    setDrawnBalls([]);
    setActiveBallNumbers(Array.from({ length: 75 }, (_, i) => i + 1));
    setPatternId(selectedPatternId);
  }, [phase]);

  const loadGame = useCallback((game: SavedGame) => {
    if (phase !== "idle") return;
    setActiveGameId(game.id);
    setCurrentGameId(game.id);
    setDrawnBalls(game.drawnBalls);
    setActiveBallNumbers(ballsFromDrawn(game.drawnBalls));
    setPatternId(game.patternId ?? "any-line");
  }, [phase]);

  return {
    phase,
    setPhase: setPhaseTracked,
    activeBallNumbers,
    drawnBalls,
    selectedBall,
    ballBodiesRef,
    ballMeshesRef,
    registerBody,
    registerMesh,
    startDraw,
    selectBall,
    onAnimationComplete,
    newGame,
    loadGame,
    currentGameId,
    patternId,
  };
}
