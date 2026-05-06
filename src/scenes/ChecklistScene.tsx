import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fadeIn, handDraw, popBigger, slideIn, staggerStart } from "./animationStyles";
import { SceneComponentProps } from "./SceneComponentProps";
import { fitFont, safeContentWidth, wrapStyle } from "./textFit";
import { theme } from "./theme";
import { getVisualIntensity } from "./visualIntensity";

export const ChecklistScene: React.FC<SceneComponentProps> = ({ props, classification }) => {
  const frame = useCurrentFrame();
  const { fps, width: canvasWidth } = useVideoConfig();
  const intensity = getVisualIntensity(classification);
  const items = props.items ?? [];

  const titleAnim = fadeIn({ frame, fps, durationFrames: Math.round(fps * 0.5 * intensity.pace) });
  const useHandDraw = classification.animationStyle === "hand_draw";
  const itemStep = Math.round(fps * 0.55 * intensity.pace);
  const itemBase = Math.round(fps * 0.5);

  const safeMax = safeContentWidth(canvasWidth, theme.spacing.pagePadding);
  const titleSize = fitFont(
    props.title,
    theme.font.titleSize * intensity.fontScale,
    { comfortableChars: 30, minScale: 0.55 },
  );
  const itemSize = theme.font.itemSize * intensity.fontScale;
  const fontWeight = 800 + intensity.weightBoost;
  const checkBoxSize = 44;
  const itemTextMax = safeMax - checkBoxSize - 20; // account for icon + gap

  return (
    <AbsoluteFill
      style={{
        background: intensity.accent.bgTint ?? theme.colors.bg,
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
          transform: `translateY(${titleAnim.translateY}px)`,
          color: intensity.accent.textColor ?? theme.colors.ink,
          maxWidth: safeMax,
          ...wrapStyle,
        }}
      >
        {props.title ?? "Checklist"}
      </div>

      <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 20 }}>
        {items.map((item, i) => {
          const startFrame = staggerStart(itemBase + itemStep, i, itemStep);
          const draw = handDraw({ frame, fps, startFrame, durationFrames: itemStep });
          const slide = slideIn({
            frame,
            fps,
            startFrame,
            intensity: intensity.motionScale,
            from: "left",
          });
          const checkPop = popBigger({
            frame,
            fps,
            startFrame: startFrame + Math.round(fps * 0.2),
            intensity: intensity.motionScale,
          });

          const opacity = useHandDraw ? draw.opacity : slide.opacity;
          const translateX = useHandDraw ? 0 : slide.translateX;
          const scaleX = useHandDraw ? draw.scaleX : 1;

          // Per-item font shrinking for very long items
          const perItemSize = fitFont(item, itemSize, { comfortableChars: 50, minScale: 0.7 });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 20,
                opacity,
                transform: `translateX(${translateX}px)`,
              }}
            >
              <div
                style={{
                  width: checkBoxSize,
                  height: checkBoxSize,
                  flexShrink: 0,
                  borderRadius: 12,
                  background: intensity.accent.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 30,
                  fontWeight: 900,
                  transform: `scale(${checkPop.scale})`,
                  marginTop: 2,
                }}
              >
                ✓
              </div>
              <div
                style={{
                  fontSize: perItemSize,
                  fontWeight: 600 + intensity.weightBoost,
                  maxWidth: itemTextMax,
                  borderBottom: useHandDraw ? `2px solid ${intensity.accent.primary}` : "none",
                  paddingBottom: useHandDraw ? 4 : 0,
                  transform: useHandDraw ? `scaleX(${scaleX})` : "none",
                  transformOrigin: "left",
                  lineHeight: 1.3,
                  ...wrapStyle,
                }}
              >
                {item}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
