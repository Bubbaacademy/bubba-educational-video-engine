import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fadeIn, highlightReveal, popBigger } from "./animationStyles";
import { SceneComponentProps } from "./SceneComponentProps";
import { theme } from "./theme";
import { getVisualIntensity } from "./visualIntensity";

export const TextOnScreenScene: React.FC<SceneComponentProps> = ({ props, classification }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intensity = getVisualIntensity(classification);
  const isHighlight = classification.emphasis === "high";

  const titleAnim = popBigger({ frame, fps, intensity: intensity.motionScale });
  const bodyAnim = fadeIn({
    frame,
    fps,
    startFrame: Math.round(fps * 0.6 * intensity.pace),
    durationFrames: Math.round(fps * 0.7 * intensity.pace),
  });
  const highlight = highlightReveal({
    frame,
    fps,
    startFrame: Math.round(fps * 0.3),
    durationFrames: Math.round(fps * 0.6 * intensity.pace),
  });

  const titleSize = theme.font.titleSize * 1.2 * intensity.fontScale;
  const fontWeight = 900 + intensity.weightBoost;

  return (
    <AbsoluteFill
      style={{
        background: intensity.accent.bgTint ?? theme.colors.bg,
        padding: theme.spacing.pagePadding,
        fontFamily: theme.font.family,
        color: theme.colors.ink,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div style={{ position: "relative", display: "inline-block" }}>
        {isHighlight && (
          <div
            style={{
              position: "absolute",
              left: -16,
              right: -16,
              bottom: 6,
              height: titleSize * 0.42,
              background: intensity.accent.soft,
              borderRadius: 12,
              transform: `scaleX(${highlight.widthPct / 100})`,
              transformOrigin: "left",
              opacity: highlight.opacity,
              zIndex: 0,
            }}
          />
        )}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            fontSize: titleSize,
            fontWeight,
            letterSpacing: -3,
            color: intensity.accent.primary,
            transform: `scale(${titleAnim.scale})`,
            opacity: titleAnim.opacity,
          }}
        >
          {props.title ?? props.body}
        </div>
      </div>

      {props.body && props.title && (
        <div
          style={{
            marginTop: 40,
            fontSize: theme.font.bodySize * intensity.fontScale,
            lineHeight: 1.4,
            opacity: bodyAnim.opacity,
            transform: `translateY(${bodyAnim.translateY}px)`,
            maxWidth: 1400,
            color: theme.colors.muted,
          }}
        >
          {props.body}
        </div>
      )}
    </AbsoluteFill>
  );
};
