import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fadeIn, handDraw, slideIn, staggerStart } from "./animationStyles";
import { SceneComponentProps } from "./SceneComponentProps";
import { fitFont, safeContentWidth, wrapStyle } from "./textFit";
import { theme } from "./theme";
import { getVisualIntensity } from "./visualIntensity";

export const DiagramScene: React.FC<SceneComponentProps> = ({ props, classification }) => {
  const frame = useCurrentFrame();
  const { fps, width: canvasWidth } = useVideoConfig();
  const intensity = getVisualIntensity(classification);
  const nodes = props.diagramNodes ?? [];

  const titleAnim = fadeIn({ frame, fps, durationFrames: Math.round(fps * 0.5) });
  const nodeStep = Math.round(fps * 0.55 * intensity.pace);
  const nodeBase = Math.round(fps * 0.4);
  const bodyAnim = fadeIn({
    frame,
    fps,
    startFrame: nodeBase + nodeStep * Math.max(1, nodes.length),
    durationFrames: Math.round(fps * 0.7 * intensity.pace),
  });

  const safeMax = safeContentWidth(canvasWidth, theme.spacing.pagePadding);
  const titleSize = fitFont(
    props.title,
    theme.font.titleSize * intensity.fontScale,
    { comfortableChars: 30, minScale: 0.6 },
  );
  // Fit nodes side-by-side: width budget per node minus arrows
  const arrowWidth = 50;
  const totalArrows = Math.max(0, nodes.length - 1);
  const perNodeMax = nodes.length > 0
    ? Math.max(110, (safeMax - totalArrows * arrowWidth) / nodes.length)
    : 220;
  const baseNodeFont = 28 * intensity.fontScale;

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
          fontWeight: 800 + intensity.weightBoost,
          letterSpacing: -1,
          opacity: titleAnim.opacity,
          textAlign: "center",
          color: intensity.accent.textColor ?? theme.colors.ink,
          maxWidth: safeMax,
          marginInline: "auto",
          ...wrapStyle,
        }}
      >
        {props.title ?? "Diagram"}
      </div>

      <div
        style={{
          marginTop: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          flexWrap: "wrap",
          maxWidth: safeMax,
          marginInline: "auto",
        }}
      >
        {nodes.map((node, i) => {
          const startFrame = staggerStart(nodeBase, i, nodeStep);
          const nodeAnim = slideIn({
            frame,
            fps,
            startFrame,
            intensity: intensity.motionScale,
            from: "left",
          });
          const arrowAnim = handDraw({
            frame,
            fps,
            startFrame: startFrame + Math.round(fps * 0.3),
            durationFrames: Math.round(fps * 0.4),
          });
          const nodeFont = fitFont(node, baseNodeFont, {
            comfortableChars: 14,
            minScale: 0.55,
          });

          return (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  background: "#FFFFFF",
                  border: `${intensity.borderWidth}px solid ${intensity.accent.primary}`,
                  borderRadius: 18,
                  padding: `${20 + intensity.paddingBoost}px ${24 + intensity.paddingBoost}px`,
                  fontSize: nodeFont,
                  fontWeight: 700 + intensity.weightBoost,
                  maxWidth: perNodeMax,
                  textAlign: "center",
                  boxShadow: `0 8px 24px ${intensity.accent.soft}`,
                  transform: `translateX(${nodeAnim.translateX}px)`,
                  opacity: nodeAnim.opacity,
                  color: intensity.accent.textColor ?? theme.colors.ink,
                  lineHeight: 1.2,
                  ...wrapStyle,
                }}
              >
                {node}
              </div>
              {i < nodes.length - 1 && (
                <div
                  style={{
                    width: arrowWidth - 20,
                    height: intensity.borderWidth + 1,
                    background: intensity.accent.primary,
                    margin: "0 10px",
                    transformOrigin: "left",
                    transform: `scaleX(${arrowAnim.scaleX})`,
                    opacity: arrowAnim.opacity,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      right: -10,
                      top: -8,
                      width: 0,
                      height: 0,
                      borderTop: "10px solid transparent",
                      borderBottom: "10px solid transparent",
                      borderLeft: `15px solid ${intensity.accent.primary}`,
                      opacity: arrowAnim.opacity,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {props.body && (
        <div
          style={{
            marginTop: 50,
            fontSize: theme.font.bodySize * intensity.fontScale,
            lineHeight: 1.4,
            textAlign: "center",
            color: theme.colors.muted,
            opacity: bodyAnim.opacity,
            transform: `translateY(${bodyAnim.translateY}px)`,
            maxWidth: safeMax,
            marginInline: "auto",
            ...wrapStyle,
          }}
        >
          {props.body}
        </div>
      )}
    </AbsoluteFill>
  );
};
