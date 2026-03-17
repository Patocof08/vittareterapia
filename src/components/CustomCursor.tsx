import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export const CustomCursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Aura — lento, lag suave
  const auraX = useMotionValue(-100);
  const auraY = useMotionValue(-100);
  const springAuraX = useSpring(auraX, { stiffness: 80, damping: 20, mass: 1 });
  const springAuraY = useSpring(auraY, { stiffness: 80, damping: 20, mass: 1 });

  // Dot — inmediato
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const onMove = (e: MouseEvent) => {
      // Aura centered on cursor (48px / 2 = 24)
      auraX.set(e.clientX - 24);
      auraY.set(e.clientY - 24);
      // Dot centered (4px / 2 = 2)
      dotX.set(e.clientX - 2);
      dotY.set(e.clientY - 2);
      if (!isVisible) setIsVisible(true);
    };

    const onEnter = () => setIsHovering(true);
    const onLeave = () => setIsHovering(false);

    window.addEventListener("mousemove", onMove);

    const attach = () => {
      document
        .querySelectorAll<HTMLElement>(
          "a, button, [role='button'], input, select, textarea, label, [data-cursor-hover]"
        )
        .forEach((el) => {
          el.addEventListener("mouseenter", onEnter);
          el.addEventListener("mouseleave", onLeave);
        });
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      observer.disconnect();
    };
  }, [auraX, auraY, dotX, dotY, isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Aura — círculo suave que flota */}
      <motion.div
        className="fixed top-0 left-0 z-[9998] pointer-events-none rounded-full"
        style={{
          x: springAuraX,
          y: springAuraY,
          width: 48,
          height: 48,
          background: "radial-gradient(circle, rgba(18,163,87,0.18) 0%, rgba(18,163,87,0) 70%)",
        }}
        animate={{
          scale: isHovering ? 2.2 : 1,
          opacity: isHovering ? 1 : 0.8,
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />

      {/* Dot preciso */}
      <motion.div
        className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full"
        style={{
          x: dotX,
          y: dotY,
          width: 4,
          height: 4,
          backgroundColor: "#12A357",
        }}
        animate={{
          scale: isHovering ? 0 : 1,
          opacity: isHovering ? 0 : 1,
        }}
        transition={{ duration: 0.15 }}
      />
    </>
  );
};
