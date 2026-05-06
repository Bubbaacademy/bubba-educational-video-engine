import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fadeIn, highlightReveal, popBigger } from "./animationStyles";
import { SceneComponentProps } from "./SceneComponentProps";
import { fitFont, safeContentWidth, wrapStyle } from "./textFit";
import { theme } from "./theme";
import { getVisualIntensity } from "./visualIntensity";

export const TextOnScreenScene: React.FC<SceneComponentProps> = ({ props, classification }) => {
  const frame = useCurrentFrame();
  const { fps, width: canvasWidth } = useVideoConfig();
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

  const titleText = props.title ?? props.body ?? "";
  const safeMax = safeContentWidth(canvasWidth, theme.spacing.pagePadding);
  const baseTitleSize = theme.font.titleSize * 1.15 * intensity.fontScale;
  const titleSize = fitFont(titleText, baseTitleSize, { comfortableChars: 26, minScale: 0.55 });
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
      <div style={{ position: "relative", display: "inline-block", maxWidth: safeMax }}>
        {isHighlight && (
          <div
            style={{
              position: "absolute",
              left: -10,
              right: -10,
              bottom: 4,
              height: titleSize * 0.4,
              background: intensity.accent.soft,
              borderRadius: 10,
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
            letterSpacing: -2,
            color: intensity.accent.primary,
            transform: `scale(${titleAnim.scale})`,
            opacity: titleAnim.opacity,
            lineHeight: 1.15,
            ...wrapStyle,
          }}
        >
          {titleText}
        </div>
      </div>

      {props.body && props.title && (
        <div
          style={{
            marginTop: 28,
            fontSize: theme.font.bodySize * intensity.fontScale,
            lineHeight: 1.4,
            opacity: bodyAnim.opacity,
            transform: `translateY(${bodyAnim.translateY}px)`,
            maxWidth: safeMax,
            color: theme.colors.muted,
            ...wrapStyle,
          }}
        >
          {props.body}
        </div>
      )}
    </AbsoluteFill>
  );
};
