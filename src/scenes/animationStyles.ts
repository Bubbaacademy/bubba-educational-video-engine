import { interpolate, spring } from "remotion";

/**
 * Reusable animation primitives. Each helper is a pure function returning
 * numeric values that scenes apply via inline style. Scenes compose multiple
 * helpers (entry + emphasis + ambient pulse) rather than picking just one.
 */

export interface AnimationContext {
  frame: number;
  fps: number;
  startFrame?: number;
  durationFrames?: number;
  intensity?: number;
}

export type SlideDirection = "left" | "right" | "top" | "bottom";

// 1. hand_draw — progressive reveal as if being drawn left-to-right
export function handDraw({ frame, fps, startFrame = 0, durationFrames }: AnimationContext) {
  const dur = durationFrames ?? Math.round(fps * 1.2);
  const local = frame - startFrame;
  const progress = interpolate(local, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { progress, opacity: progress, scaleX: progress };
}

// 2. fade_in — opacity + tiny upward drift
export function fadeIn({ frame, fps, startFrame = 0, durationFrames }: AnimationContext) {
  const dur = durationFrames ?? Math.round(fps * 0.5);
  const local = frame - startFrame;
  const opacity = interpolate(local, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity, translateY: (1 - opacity) * 12 };
}

// 3. pop_bigger — overshooting spring scale with extra punch via intensity
export function popBigger({ frame, fps, startFrame = 0, intensity = 1 }: AnimationContext) {
  const local = Math.max(0, frame - startFrame);
  const base = spring({
    frame: local,
    fps,
    config: { damping: 9, stiffness: 110, mass: 0.6 },
  });
  const overshoot = 1 + 0.06 * intensity;
  return { scale: base * overshoot, opacity: Math.min(1, base * 1.2) };
}

// 4. shake_emphasis — decaying horizontal shake + tiny rotation
export function shakeEmphasis({
  frame,
  fps,
  startFrame = 0,
  intensity = 1,
  durationFrames,
}: AnimationContext) {
  const dur = durationFrames ?? Math.round(fps * 0.7);
  const local = frame - startFrame;
  if (local < 0 || local >= dur) return { translateX: 0, rotate: 0 };
  const decay = 1 - local / dur;
  const amp = 10 * intensity * decay;
  return {
    translateX: Math.sin(local * 1.6) * amp,
    rotate: Math.sin(local * 1.8) * 0.4 * intensity * decay,
  };
}

// 5. slide_in — translate from a direction with spring + opacity
export function slideIn({
  frame,
  fps,
  startFrame = 0,
  intensity = 1,
  durationFrames,
  from = "left",
}: AnimationContext & { from?: SlideDirection }) {
  void durationFrames;
  const local = Math.max(0, frame - startFrame);
  const progress = spring({
    frame: local,
    fps,
    config: { damping: Math.max(8, 14 - intensity * 2), stiffness: 100 },
  });
  const distance = 80 * intensity;
  const signX = from === "left" ? -1 : from === "right" ? 1 : 0;
  const signY = from === "top" ? -1 : from === "bottom" ? 1 : 0;
  return {
    opacity: progress,
    translateX: signX * distance * (1 - progress),
    translateY: signY * distance * (1 - progress),
  };
}

// 6. highlight_reveal — colored bar/bg sweep that grows behind text
export function highlightReveal({
  frame,
  fps,
  startFrame = 0,
  durationFrames,
}: AnimationContext) {
  const dur = durationFrames ?? Math.round(fps * 0.7);
  const local = frame - startFrame;
  const progress = interpolate(local, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { widthPct: progress * 100, opacity: Math.min(1, progress * 2) };
}

// 7. calm_write — slow fade + gentle vertical drift, for thoughtful tones
export function calmWrite({
  frame,
  fps,
  startFrame = 0,
  durationFrames,
  intensity = 1,
}: AnimationContext) {
  const dur = durationFrames ?? Math.round(fps * 1.2);
  const local = frame - startFrame;
  const opacity = interpolate(local, [0, dur * 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity, translateY: (1 - opacity) * 8 * intensity };
}

// 8. serious_warning — slow pulsing alpha + tiny breathing scale, for warning borders/icons
export function seriousWarning({ frame, startFrame = 0, intensity = 1 }: AnimationContext) {
  const local = Math.max(0, frame - startFrame);
  const pulse = (Math.sin(local / 8) + 1) / 2;
  return {
    pulseAlpha: 0.55 + pulse * 0.45 * intensity,
    scale: 1 + Math.sin(local / 12) * 0.015 * intensity,
  };
}

// Stagger helper: returns the start frame for the i-th item given a base delay + step
export function staggerStart(base: number, index: number, stepFrames: number): number {
  return base + index * stepFrames;
}
