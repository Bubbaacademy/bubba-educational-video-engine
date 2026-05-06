import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fadeIn, popBigger, seriousWarning, shakeEmphasis } from "./animationStyles";
import { SceneComponentProps } from "./SceneComponentProps";
import { fitFont, safeContentWidth, wrapStyle } from "./textFit";
import { theme } from "./theme";
import { getVisualIntensity } from "./visualIntensity";

export const WarningScene: React.FC<SceneComponentProps> = ({ props, classification }) => {
  const frame = useCurrentFrame();
  const { fps, width: canvasWidth } = useVideoConfig();
  const intensity = getVisualIntensity(classification);

  const iconPop = popBigger({ frame, fps, intensity: intensity.motionScale });
  const shake = shakeEmphasis({
    frame,
    fps,
    intensity: intensity.motionScale,
    durationFrames: Math.round(fps * 0.7),
  });
  const pulse = seriousWarning({ frame, fps, intensity: intensity.motionScale });
  const titleAnim = popBigger({
    frame,
    fps,
    startFrame: Math.round(fps * 0.2),
    intensity: intensity.motionScale,
  });
  const bodyAnim = fadeIn({
    frame,
    fps,
    startFrame: Math.round(fps * 0.6 * intensity.pace),
    durationFrames: Math.round(fps * 0.6 * intensity.pace),
  });

  const safeMax = safeContentWidth(canvasWidth, theme.spacing.pagePadding);
  const baseTitleSize = theme.font.titleSize * intensity.fontScale;
  // Uppercase chars are wider, so apply slightly tighter comfortable threshold
  const titleSize = fitFont(props.title, baseTitleSize, {
    comfortableChars: 22,
    minScale: 0.55,
  });
  const bodySize = theme.font.bodySize * intensity.fontScale;
  const fontWeight = 900 + intensity.weightBoost;

  return (
    <AbsoluteFill
      style={{
        background: intensity.accent.bgTint ?? theme.colors.warningBg,
        padding: theme.spacing.pagePadding,
        fontFamily: theme.font.family,
        color: theme.colors.ink,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* Pulsing border for serious tone */}
      <div
        style={{
          position: "absolute",
          inset: 36,
          border: `${intensity.borderWidth + 2}px solid ${intensity.accent.primary}`,
          borderRadius: 28,
          opacity: pulse.pulseAlpha * 0.6,
          transform: `scale(${pulse.scale})`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          transform: `scale(${iconPop.scale}) translateX(${shake.translateX}px) rotate(${shake.rotate}deg)`,
          opacity: iconPop.opacity,
        }}
      >
        <svg width={140} height={140} viewBox="0 0 100 100">
          <path
            d="M50 10 L95 90 L5 90 Z"
            fill={intensity.accent.primary}
            stroke={theme.colors.ink}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <rect x="46" y="38" width="8" height="28" rx="2" fill={theme.colors.ink} />
          <circle cx="50" cy="76" r="5" fill={theme.colors.ink} />
        </svg>
      </div>

      <div
        style={{
          marginTop: 24,
          fontSize: titleSize,
          fontWeight,
          letterSpacing: -1,
          color: intensity.accent.textColor ?? theme.colors.danger,
          textTransform: "uppercase",
          transform: `scale(${titleAnim.scale}) translateX(${shake.translateX * 0.4}px)`,
          opacity: titleAnim.opacity,
          maxWidth: safeMax,
          lineHeight: 1.1,
          ...wrapStyle,
        }}
      >
        {props.title ?? "Watch Out"}
      </div>

      <div
        style={{
          marginTop: 18,
          fontSize: bodySize,
          lineHeight: 1.4,
          opacity: bodyAnim.opacity,
          transform: `translateY(${bodyAnim.translateY}px)`,
          maxWidth: safeMax,
          color: intensity.accent.textColor ?? theme.colors.ink,
          ...wrapStyle,
        }}
      >
        {props.body}
      </div>
    </AbsoluteFill>
  );
};
