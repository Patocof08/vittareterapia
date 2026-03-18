import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// SVG path: triángulo redondeado apuntando arriba-izquierda (estilo outline chunky)
const CURSOR_PATH =
  "M 4 2 C 2 2 1 3 1 5 L 3 22 C 3 24 5 25 7 24 L 13 20 L 18 27 C 19 29 22 29 23 27 L 25 24 C 26 22 25 19 23 18 L 17 14 L 24 8 C 26 6 25 3 23 2 Z";

type CursorState = "default" | "hover" | "click" | "text";

const SPRING_MAIN   = { stiffness: 150, damping: 15, mass: 0.1 };
const SPRING_TRAIL1 = { stiffness: 100, damping: 15, mass: 0.1 };
const SPRING_TRAIL2 = { stiffness: 70,  damping: 15, mass: 0.1 };
const SPRING_TRAIL3 = { stiffness: 50,  damping: 15, mass: 0.1 };

export function CustomCursor() {
  const [mounted, setMounted]         = useState(false);
  const [visible, setVisible]         = useState(false);
  const [state, setState]             = useState<CursorState>("default");
  const isMouseDown                   = useRef(false);

  // Main cursor position
  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);
  const x  = useSpring(rawX, SPRING_MAIN);
  const y  = useSpring(rawY, SPRING_MAIN);

  // Trailing cursors (progressively laggier)
  const t1x = useSpring(rawX, SPRING_TRAIL1);
  const t1y = useSpring(rawY, SPRING_TRAIL1);
  const t2x = useSpring(rawX, SPRING_TRAIL2);
  const t2y = useSpring(rawY, SPRING_TRAIL2);
  const t3x = useSpring(rawX, SPRING_TRAIL3);
  const t3y = useSpring(rawY, SPRING_TRAIL3);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    setMounted(true);

    const detectState = (target: EventTarget | null): CursorState => {
      if (!target) return "default";
      const el = target as HTMLElement;
      if (el.closest("input, textarea")) return "text";
      if (el.closest("p, h1, h2, h3, h4, h5, h6, li, span, blockquote")) return "text";
      if (el.closest('a, button, [role="button"], select, label, [data-cursor="hover"], [class*="cursor-pointer"]')) return "hover";
      return "default";
    };

    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      setVisible(true);
      if (!isMouseDown.current) setState(detectState(e.target));
    };

    const onOver  = (e: MouseEvent) => {
      if (!isMouseDown.current) setState(detectState(e.target));
    };

    const onDown  = () => { isMouseDown.current = true; setState("click"); };
    const onUp    = (e: MouseEvent) => { isMouseDown.current = false; setState(detectState(e.target)); };
    const onEnter = () => setVisible(true);
    const onLeave = () => setVisible(false);

    document.addEventListener("mousemove",  onMove);
    document.addEventListener("mouseover",  onOver);
    document.addEventListener("mousedown",  onDown);
    document.addEventListener("mouseup",    onUp);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      document.removeEventListener("mousemove",  onMove);
      document.removeEventListener("mouseover",  onOver);
      document.removeEventListener("mousedown",  onDown);
      document.removeEventListener("mouseup",    onUp);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  if (!mounted) return null;

  // ── Visual state helpers ──
  const scale = state === "hover" ? 1.3 : state === "click" ? 0.85 : state === "text" ? 0.6 : 1;
  const fill  = state === "hover" ? "rgba(18,163,87,0.9)" : state === "click" ? "#12A357" : "rgba(255,255,255,0.85)";
  const stroke = (state === "hover" || state === "click") ? "white" : "#1F4D2E";
  const opacity = !visible ? 0 : state === "text" ? 0.5 : 1;

  const springTransition = { type: "spring" as const, stiffness: 300, damping: 20 };
  const clickTransition  = { duration: 0.1 };

  // Hot-spot offset: the tip of the path is at approx (1, 5) in the viewBox
  const OX = "-1px";
  const OY = "-5px";

  const CursorSVG = ({
    fillColor = fill,
    strokeColor = stroke,
  }: { fillColor?: string; strokeColor?: string }) => (
    <svg
      width="30"
      height="32"
      viewBox="0 0 30 32"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <path
        d={CURSOR_PATH}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: "fill 0.15s ease, stroke 0.15s ease" }}
      />
    </svg>
  );

  return (
    <>
      {/* ── Trailing ghosts (back-to-front so main cursor renders on top) ── */}
      {[
        { cx: t3x, cy: t3y, op: 0.05, sc: 0.3 },
        { cx: t2x, cy: t2y, op: 0.12, sc: 0.5 },
        { cx: t1x, cy: t1y, op: 0.25, sc: 0.7 },
      ].map((t, i) => (
        <motion.div
          key={i}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            x: t.cx,
            y: t.cy,
            translateX: OX,
            translateY: OY,
            pointerEvents: "none",
            zIndex: 99997 + i,
            opacity: visible ? t.op : 0,
            scale: t.sc,
            transformOrigin: "1px 5px",
            transition: "opacity 0.3s",
          }}
        >
          <CursorSVG fillColor="rgba(255,255,255,0.7)" strokeColor="#1F4D2E" />
        </motion.div>
      ))}

      {/* ── Main cursor ── */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          x,
          y,
          translateX: OX,
          translateY: OY,
          pointerEvents: "none",
          zIndex: 99999,
          transformOrigin: "1px 5px",
        }}
        animate={{ opacity }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={{ scale }}
          transition={state === "click" ? clickTransition : springTransition}
          style={{ transformOrigin: "1px 5px" }}
        >
          <CursorSVG />
        </motion.div>
      </motion.div>
    </>
  );
}

export default CustomCursor;
