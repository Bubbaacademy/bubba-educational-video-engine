import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { calmWrite, fadeIn, popBigger } from "./animationStyles";
import { SceneComponentProps } from "./SceneComponentProps";
import { theme } from "./theme";
import { getVisualIntensity } from "./visualIntensity";

export const TitleScene: React.FC<SceneComponentProps> = ({ props, classification }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intensity = getVisualIntensity(classification);

  const titleAnim = popBigger({ frame, fps, intensity: intensity.motionScale });
  const accentAnim = fadeIn({ frame, fps, startFrame: 4, durationFrames: Math.round(fps * 0.5 * intensity.pace) });
  const subtitle = calmWrite({
    frame,
    fps,
    startFrame: Math.round(fps * 0.8 * intensity.pace),
    durationFrames: Math.round(fps * 1.2 * intensity.pace),
  });

  const titleSize = theme.font.titleSize * 1.6 * intensity.fontScale;
  const fontWeight = 800 + intensity.weightBoost;
  const accentBarWidth = 160 + intensity.paddingBoost * 8;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.colors.bg} 0%, ${intensity.accent.soft} 100%)`,
        padding: theme.spacing.pagePadding,
        fontFamily: theme.font.family,
        color: theme.colors.ink,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: accentBarWidth,
          height: 12 + intensity.paddingBoost,
          borderRadius: 6,
          background: intensity.accent.primary,
          opacity: accentAnim.opacity,
          transform: `scaleX(${accentAnim.opacity})`,
          marginBottom: 60,
        }}
      />

      <div
        style={{
          fontSize: titleSize,
          fontWeight,
          letterSpacing: -4,
          color: theme.colors.ink,
          transform: `scale(${titleAnim.scale})`,
          opacity: titleAnim.opacity,
          maxWidth: 1600,
          lineHeight: 1.05,
        }}
      >
        {props.title ?? props.body ?? "Bubba Academy"}
      </div>

      {props.body && props.title && (
        <div
          style={{
            marginTop: 40,
            fontSize: theme.font.bodySize * 0.85 * intensity.fontScale,
            color: intensity.accent.textColor ?? theme.colors.muted,
            opacity: subtitle.opacity,
            transform: `translateY(${subtitle.translateY}px)`,
            maxWidth: 1200,
            lineHeight: 1.4,
          }}
        >
          {props.body}
        </div>
      )}
    </AbsoluteFill>
  );
};
