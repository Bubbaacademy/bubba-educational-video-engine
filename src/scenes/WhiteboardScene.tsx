import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { calmWrite, handDraw } from "./animationStyles";
import { SceneComponentProps } from "./SceneComponentProps";
import { theme } from "./theme";
import { getVisualIntensity } from "./visualIntensity";

export const WhiteboardScene: React.FC<SceneComponentProps> = ({ props, classification }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
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

  const titleSize = theme.font.titleSize * intensity.fontScale;
  const fontWeight = 800 + intensity.weightBoost;

  return (
    <AbsoluteFill
      style={{
        background: "#FFFFFF",
        backgroundImage:
          "repeating-linear-gradient(0deg, #F3F4F6 0px, #F3F4F6 1px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, #F3F4F6 0px, #F3F4F6 1px, transparent 1px, transparent 80px)",
        padding: theme.spacing.pagePadding,
        fontFamily: theme.font.family,
        color: theme.colors.ink,
      }}
    >
      <div
        style={{
          fontSize: titleSize,
          fontWeight,
          letterSpacing: -2,
          opacity: titleAnim.opacity,
          transform: `translateY(${(1 - titleAnim.opacity) * 20}px)`,
          color: intensity.accent.textColor ?? theme.colors.ink,
        }}
      >
        {props.title ?? "Whiteboard"}
      </div>

      <div
        style={{
          marginTop: 24,
          height: intensity.borderWidth + 2,
          width: `${underline.scaleX * 100}%`,
          background: intensity.accent.primary,
          borderRadius: 3,
          transformOrigin: "left",
        }}
      />

      <div
        style={{
          marginTop: 60,
          fontSize: theme.font.bodySize * intensity.fontScale,
          lineHeight: 1.4,
          opacity: body.opacity,
          transform: `translateY(${body.translateY}px)`,
          maxWidth: "85%",
        }}
      >
        {props.body}
      </div>
    </AbsoluteFill>
  );
};
