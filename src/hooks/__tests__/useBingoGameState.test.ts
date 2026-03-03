import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBingoGameState } from "../useBingoGameState";

describe("useBingoGameState", () => {
  it("initializes with 75 active balls and idle phase", () => {
    const { result } = renderHook(() => useBingoGameState());
    expect(result.current.phase).toBe("idle");
    expect(result.current.activeBallNumbers).toHaveLength(75);
    expect(result.current.activeBallNumbers[0]).toBe(1);
    expect(result.current.activeBallNumbers[74]).toBe(75);
    expect(result.current.drawnBalls).toHaveLength(0);
    expect(result.current.selectedBall).toBeNull();
  });

  it("startDraw transitions from idle to mixing", () => {
    const { result } = renderHook(() => useBingoGameState());
    act(() => {
      result.current.startDraw();
    });
    expect(result.current.phase).toBe("mixing");
  });

  it("startDraw does nothing when not idle", () => {
    const { result } = renderHook(() => useBingoGameState());
    act(() => {
      result.current.startDraw();
    });
    act(() => {
      result.current.startDraw();
    });
    expect(result.current.phase).toBe("mixing");
  });

  it("selectBall removes ball, sets selectedBall, transitions to animating", () => {
    const { result } = renderHook(() => useBingoGameState());
    act(() => result.current.startDraw());
    act(() => result.current.selectBall(42, [1, 2, 3], [0, 0, 0, 1]));
    expect(result.current.phase).toBe("animating");
    expect(result.current.selectedBall).toEqual({ number: 42, startPosition: [1, 2, 3], startRotation: [0, 0, 0, 1] });
    expect(result.current.activeBallNumbers).not.toContain(42);
    expect(result.current.activeBallNumbers).toHaveLength(74);
  });

  it("onAnimationComplete adds ball to drawn list and returns to idle", () => {
    const { result } = renderHook(() => useBingoGameState());
    act(() => result.current.startDraw());
    act(() => result.current.selectBall(7, [0, -2, 0], [0, 0, 0, 1]));
    act(() => result.current.onAnimationComplete());
    expect(result.current.phase).toBe("idle");
    expect(result.current.drawnBalls).toEqual([7]);
    expect(result.current.selectedBall).toBeNull();
    expect(result.current.activeBallNumbers).toHaveLength(74);
  });

  it("supports multiple sequential draws", () => {
    const { result } = renderHook(() => useBingoGameState());

    act(() => result.current.startDraw());
    act(() => result.current.selectBall(1, [0, 0, 0], [0, 0, 0, 1]));
    act(() => result.current.onAnimationComplete());

    act(() => result.current.startDraw());
    act(() => result.current.selectBall(75, [0, 0, 0], [0, 0, 0, 1]));
    act(() => result.current.onAnimationComplete());

    expect(result.current.drawnBalls).toEqual([1, 75]);
    expect(result.current.activeBallNumbers).toHaveLength(73);
    expect(result.current.phase).toBe("idle");
  });

  it("registerBody adds and removes bodies from the ref map", () => {
    const { result } = renderHook(() => useBingoGameState());
    const fakeBody = { applyImpulse: () => {} } as unknown as import("@react-three/rapier").RapierRigidBody;

    act(() => result.current.registerBody(1, fakeBody));
    expect(result.current.ballBodiesRef.current.get(1)).toBe(fakeBody);

    act(() => result.current.registerBody(1, null));
    expect(result.current.ballBodiesRef.current.has(1)).toBe(false);
  });

  it("registerMesh adds and removes meshes from the ref map", () => {
    const { result } = renderHook(() => useBingoGameState());
    const fakeMesh = { getWorldPosition: () => {} } as unknown as import("three").Mesh;

    act(() => result.current.registerMesh(1, fakeMesh));
    expect(result.current.ballMeshesRef.current.get(1)).toBe(fakeMesh);

    act(() => result.current.registerMesh(1, null));
    expect(result.current.ballMeshesRef.current.has(1)).toBe(false);
  });

  it("startDraw does nothing when no balls remain", () => {
    const { result } = renderHook(() => useBingoGameState());
    // Draw all 75 balls
    for (let i = 1; i <= 75; i++) {
      act(() => result.current.startDraw());
      act(() => result.current.selectBall(i, [0, 0, 0], [0, 0, 0, 1]));
      act(() => result.current.onAnimationComplete());
    }
    expect(result.current.activeBallNumbers).toHaveLength(0);
    act(() => result.current.startDraw());
    expect(result.current.phase).toBe("idle"); // stays idle
  });
});
