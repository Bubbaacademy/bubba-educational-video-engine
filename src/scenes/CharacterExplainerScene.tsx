import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { calmWrite, popBigger, slideIn } from "./animationStyles";
import { SceneComponentProps } from "./SceneComponentProps";
import { fitFont, safeContentWidth, wrapStyle } from "./textFit";
import { theme } from "./theme";
import { getVisualIntensity } from "./visualIntensity";

export const CharacterExplainerScene: React.FC<SceneComponentProps> = ({
  props,
  classification,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: canvasWidth } = useVideoConfig();
  const intensity = getVisualIntensity(classification);
  const isThoughtful = classification.tone === "thoughtful";

  const characterEntry = popBigger({ frame, fps, intensity: intensity.motionScale });
  const bubbleEntry = slideIn({
    frame,
    fps,
    startFrame: Math.round(fps * 0.35),
    intensity: intensity.motionScale,
    from: "left",
  });
  const bodyAnim = isThoughtful
    ? calmWrite({
        frame,
        fps,
        startFrame: Math.round(fps * 0.7 * intensity.pace),
        durationFrames: Math.round(fps * 1.5 * intensity.pace),
      })
    : { opacity: 1, translateY: 0 };

  const bobAmp = isThoughtful ? 3 : classification.tone === "happy" || classification.tone === "excited" ? 9 : 6;
  const bob = Math.sin(frame / (isThoughtful ? 18 : 12)) * bobAmp;

  // Character SVG sized for 720p (was 420 wide for 1080p)
  const charWidth = 260;
  const charHeight = 320;
  const safeMax = safeContentWidth(canvasWidth, theme.spacing.pagePadding);
  const bubbleMax = Math.max(360, safeMax - charWidth - 60);

  const titleSize = fitFont(props.title, 44 * intensity.fontScale, {
    comfortableChars: 28,
    minScale: 0.6,
  });
  const bodySize = theme.font.bodySize * intensity.fontScale;

  return (
    <AbsoluteFill
      style={{
        background: intensity.accent.bgTint ?? theme.colors.accentSoft,
        padding: theme.spacing.pagePadding,
        fontFamily: theme.font.family,
        color: theme.colors.ink,
        flexDirection: "row",
        alignItems: "center",
        gap: 40,
      }}
    >
      <div
        style={{
          transform: `translateY(${bob}px) scale(${characterEntry.scale})`,
          opacity: characterEntry.opacity,
          flexShrink: 0,
        }}
      >
        <svg width={charWidth} height={charHeight} viewBox="0 0 200 240">
          <ellipse cx="100" cy="220" rx="70" ry="10" fill="rgba(0,0,0,0.1)" />
          <rect x="55" y="110" width="90" height="100" rx="20" fill={intensity.accent.primary} />
          <circle cx="100" cy="70" r="50" fill="#FCD7B6" />
          <circle cx="82" cy="68" r="6" fill={theme.colors.ink} />
          <circle cx="118" cy="68" r="6" fill={theme.colors.ink} />
          <path
            d={
              isThoughtful
                ? "M 80 92 Q 100 92 120 92"
                : "M 80 90 Q 100 105 120 90"
            }
            stroke={theme.colors.ink}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M 50 30 Q 100 0 150 30 L 150 50 Q 100 35 50 50 Z" fill={theme.colors.ink} />
        </svg>
      </div>

      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 28,
          padding: 32 + intensity.paddingBoost * 2,
          boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
          opacity: bubbleEntry.opacity,
          transform: `translateX(${bubbleEntry.translateX}px)`,
          maxWidth: bubbleMax,
          position: "relative",
          borderLeft: `${intensity.borderWidth}px solid ${intensity.accent.primary}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -22,
            top: 60,
            width: 0,
            height: 0,
            borderTop: "16px solid transparent",
            borderBottom: "16px solid transparent",
            borderRight: "22px solid #FFFFFF",
          }}
        />
        {props.title && (
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 800 + intensity.weightBoost,
              marginBottom: 12,
              color: intensity.accent.textColor ?? theme.colors.ink,
              ...wrapStyle,
            }}
          >
            {props.title}
          </div>
        )}
        <div
          style={{
            fontSize: bodySize,
            lineHeight: 1.4,
            opacity: bodyAnim.opacity,
            transform: `translateY(${bodyAnim.translateY}px)`,
            ...wrapStyle,
          }}
        >
          {props.body}
        </div>
      </div>
    </AbsoluteFill>
  );
};
