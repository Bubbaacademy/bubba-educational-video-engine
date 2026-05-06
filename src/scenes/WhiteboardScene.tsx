import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { calmWrite, handDraw } from "./animationStyles";
import { SceneComponentProps } from "./SceneComponentProps";
import { fitFont, safeContentWidth, wrapStyle } from "./textFit";
import { theme } from "./theme";
import { getVisualIntensity } from "./visualIntensity";

export const WhiteboardScene: React.FC<SceneComponentProps> = ({ props, classification }) => {
  const frame = useCurrentFrame();
  const { fps, width: canvasWidth } = useVideoConfig();
  const intensity = getVisualIntensity(classification);

  const titleAnim = handDraw({
    frame,
    fps,
    durationFrames: Math.round(fps * 0.6 * intensity.pace),
  });
  const underline = handDraw({
    frame,
    fps,
    startFrame: Math.round(fps * 0.3),
    durationFrames: Math.round(fps * 0.9 * intensity.pace),
  });
  const body = calmWrite({
    frame,
    fps,
    startFrame: Math.round(fps * 1.1 * intensity.pace),
    durationFrames: Math.round(fps * 1.4 * intensity.pace),
    intensity: intensity.motionScale,
  });

  const safeMax = safeContentWidth(canvasWidth, theme.spacing.pagePadding);
  const titleSize = fitFont(
    props.title,
    theme.font.titleSize * intensity.fontScale,
    { comfortableChars: 30, minScale: 0.55 },
  );
  const fontWeight = 800 + intensity.weightBoost;

  return (
    <AbsoluteFill
      style={{
        background: "#FFFFFF",
        backgroundImage:
          "repeating-linear-gradient(0deg, #F3F4F6 0px, #F3F4F6 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #F3F4F6 0px, #F3F4F6 1px, transparent 1px, transparent 60px)",
        padding: theme.spacing.pagePadding,
        fontFamily: theme.font.family,
        color: theme.colors.ink,
      }}
    >
      <div
        style={{
          fontSize: titleSize,
          fontWeight,
          letterSpacing: -1,
          opacity: titleAnim.opacity,
          transform: `translateY(${(1 - titleAnim.opacity) * 16}px)`,
          color: intensity.accent.textColor ?? theme.colors.ink,
          maxWidth: safeMax,
          ...wrapStyle,
        }}
      >
        {props.title ?? "Whiteboard"}
      </div>

      <div
        style={{
          marginTop: 16,
          height: intensity.borderWidth + 1,
          width: `${underline.scaleX * 100}%`,
          maxWidth: safeMax,
          background: intensity.accent.primary,
          borderRadius: 3,
          transformOrigin: "left",
        }}
      />

      <div
        style={{
          marginTop: 36,
          fontSize: theme.font.bodySize * intensity.fontScale,
          lineHeight: 1.4,
          opacity: body.opacity,
          transform: `translateY(${body.translateY}px)`,
          maxWidth: safeMax,
          ...wrapStyle,
        }}
      >
        {props.body}
      </div>
    </AbsoluteFill>
  );
};
