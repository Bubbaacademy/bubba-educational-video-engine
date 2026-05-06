import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fadeIn, handDraw, popBigger, slideIn, staggerStart } from "./animationStyles";
import { SceneComponentProps } from "./SceneComponentProps";
import { theme } from "./theme";
import { getVisualIntensity } from "./visualIntensity";

export const ChecklistScene: React.FC<SceneComponentProps> = ({ props, classification }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intensity = getVisualIntensity(classification);
  const items = props.items ?? [];

  const titleAnim = fadeIn({ frame, fps, durationFrames: Math.round(fps * 0.5 * intensity.pace) });
  const useHandDraw = classification.animationStyle === "hand_draw";
  const itemStep = Math.round(fps * 0.6 * intensity.pace);
  const itemBase = Math.round(fps * 0.5);

  const titleSize = theme.font.titleSize * intensity.fontScale;
  const itemSize = theme.font.itemSize * intensity.fontScale;
  const fontWeight = 800 + intensity.weightBoost;

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
          letterSpacing: -2,
          opacity: titleAnim.opacity,
          transform: `translateY(${titleAnim.translateY}px)`,
          color: intensity.accent.textColor ?? theme.colors.ink,
        }}
      >
        {props.title ?? "Checklist"}
      </div>

      <div style={{ marginTop: 80, display: "flex", flexDirection: "column", gap: 36 }}>
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

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 32,
                opacity,
                transform: `translateX(${translateX}px)`,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: intensity.accent.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 44,
                  fontWeight: 900,
                  transform: `scale(${checkPop.scale})`,
                }}
              >
                ✓
              </div>
              <div
                style={{
                  fontSize: itemSize,
                  fontWeight: 600 + intensity.weightBoost,
                  // hand_draw underlines each item progressively
                  borderBottom: useHandDraw ? `3px solid ${intensity.accent.primary}` : "none",
                  paddingBottom: useHandDraw ? 6 : 0,
                  transform: useHandDraw ? `scaleX(${scaleX})` : "none",
                  transformOrigin: "left",
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
