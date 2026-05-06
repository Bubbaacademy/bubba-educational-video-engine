import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fadeIn, popBigger, seriousWarning, shakeEmphasis } from "./animationStyles";
import { SceneComponentProps } from "./SceneComponentProps";
import { theme } from "./theme";
import { getVisualIntensity } from "./visualIntensity";

export const WarningScene: React.FC<SceneComponentProps> = ({ props, classification }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
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

  const titleSize = theme.font.titleSize * intensity.fontScale;
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
          inset: 60,
          border: `${intensity.borderWidth + 2}px solid ${intensity.accent.primary}`,
          borderRadius: 36,
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
        <svg width={220} height={220} viewBox="0 0 100 100">
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
          marginTop: 40,
          fontSize: titleSize,
          fontWeight,
          letterSpacing: -2,
          color: intensity.accent.textColor ?? theme.colors.danger,
          textTransform: "uppercase",
          transform: `scale(${titleAnim.scale}) translateX(${shake.translateX * 0.4}px)`,
          opacity: titleAnim.opacity,
        }}
      >
        {props.title ?? "Watch Out"}
      </div>

      <div
        style={{
          marginTop: 30,
          fontSize: bodySize,
          lineHeight: 1.4,
          opacity: bodyAnim.opacity,
          transform: `translateY(${bodyAnim.translateY}px)`,
          maxWidth: 1400,
          color: intensity.accent.textColor ?? theme.colors.ink,
        }}
      >
        {props.body}
      </div>
    </AbsoluteFill>
  );
};
