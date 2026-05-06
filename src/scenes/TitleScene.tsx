import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { calmWrite, fadeIn, popBigger } from "./animationStyles";
import { SceneComponentProps } from "./SceneComponentProps";
import { fitFont, safeContentWidth, wrapStyle } from "./textFit";
import { theme } from "./theme";
import { getVisualIntensity } from "./visualIntensity";

export const TitleScene: React.FC<SceneComponentProps> = ({ props, classification }) => {
  const frame = useCurrentFrame();
  const { fps, width: canvasWidth } = useVideoConfig();
  const intensity = getVisualIntensity(classification);

  const titleAnim = popBigger({ frame, fps, intensity: intensity.motionScale });
  const accentAnim = fadeIn({ frame, fps, startFrame: 4, durationFrames: Math.round(fps * 0.5 * intensity.pace) });
  const subtitle = calmWrite({
    frame,
    fps,
    startFrame: Math.round(fps * 0.8 * intensity.pace),
    durationFrames: Math.round(fps * 1.2 * intensity.pace),
  });

  const titleText = props.title ?? props.body ?? "Bubba Academy";
  const safeMax = safeContentWidth(canvasWidth, theme.spacing.pagePadding);
  const baseTitleSize = theme.font.titleSize * 1.6 * intensity.fontScale;
  const titleSize = fitFont(titleText, baseTitleSize, { comfortableChars: 24, minScale: 0.5 });
  const fontWeight = 800 + intensity.weightBoost;
  const accentBarWidth = 120 + intensity.paddingBoost * 6;

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
          height: 8 + intensity.paddingBoost,
          borderRadius: 6,
          background: intensity.accent.primary,
          opacity: accentAnim.opacity,
          transform: `scaleX(${accentAnim.opacity})`,
          marginBottom: 36,
        }}
      />

      <div
        style={{
          fontSize: titleSize,
          fontWeight,
          letterSpacing: -2,
          color: theme.colors.ink,
          transform: `scale(${titleAnim.scale})`,
          opacity: titleAnim.opacity,
          maxWidth: safeMax,
          lineHeight: 1.1,
          ...wrapStyle,
        }}
      >
        {titleText}
      </div>

      {props.body && props.title && (
        <div
          style={{
            marginTop: 28,
            fontSize: theme.font.bodySize * 0.95 * intensity.fontScale,
            color: intensity.accent.textColor ?? theme.colors.muted,
            opacity: subtitle.opacity,
            transform: `translateY(${subtitle.translateY}px)`,
            maxWidth: safeMax,
            lineHeight: 1.4,
            ...wrapStyle,
          }}
        >
          {props.body}
        </div>
      )}
    </AbsoluteFill>
  );
};
