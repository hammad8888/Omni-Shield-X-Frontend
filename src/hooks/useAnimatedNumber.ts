import { useEffect, useRef, useState } from "react";

/** Smoothly chases a measured target with responsive spring physics. Does not invent values. */
export function useAnimatedNumber(target: number, timeConstantMs = 150) {
  const safe = Number.isFinite(target) ? Math.max(0, target) : 0;
  const [value, setValue] = useState(safe);
  const current = useRef(safe);
  const velocity = useRef(0);
  const dest = useRef(safe);
  dest.current = safe;

  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.04, Math.max(0.001, (now - last) / 1000));
      last = now;

      // Critically damped spring formulation for realistic, natural needle inertia
      const stiffness = 180;
      const damping = 2 * Math.sqrt(stiffness);
      const displacement = current.current - dest.current;
      const springForce = -stiffness * displacement;
      const dampingForce = -damping * velocity.current;
      const acceleration = springForce + dampingForce;

      velocity.current += acceleration * dt;
      current.current += velocity.current * dt;

      // Fallback exponential smoothing for rapid multi-megabit jumps
      const tau = Math.max(0.03, timeConstantMs / 1000);
      const alpha = 1 - Math.exp(-dt / tau);
      const blend = current.current + (dest.current - current.current) * alpha;
      const next = Math.max(0, (current.current + blend) / 2);

      setValue(next);

      if (Math.abs(dest.current - next) > 0.02 || Math.abs(velocity.current) > 0.05) {
        frame = requestAnimationFrame(tick);
      } else {
        current.current = dest.current;
        velocity.current = 0;
        setValue(dest.current);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [safe, timeConstantMs]);

  return value;
}

