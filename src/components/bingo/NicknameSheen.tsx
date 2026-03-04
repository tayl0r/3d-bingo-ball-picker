import { useEffect, useRef } from "react";

export function NicknameSheen({ displayBall, nicknameText }: { displayBall: number; nicknameText: string }) {
  const anim1Ref = useRef<SVGAnimateElement>(null);
  const anim2Ref = useRef<SVGAnimateElement>(null);

  // Trigger on mount; component remounts via key={displayBall} for each new ball
  useEffect(() => {
    anim1Ref.current?.beginElement();
    anim2Ref.current?.beginElement();
  }, []);

  return (
    <svg
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
            ref={anim1Ref}
            attributeName="x1"
            values="-100%;100%"
            dur="2.5s"
            begin="indefinite"
            fill="freeze"
          />
          <animate
            ref={anim2Ref}
            attributeName="x2"
            values="0%;200%"
            dur="2.5s"
            begin="indefinite"
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
  );
}
