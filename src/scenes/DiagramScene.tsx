import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fadeIn, handDraw, slideIn, staggerStart } from "./animationStyles";
import { SceneComponentProps } from "./SceneComponentProps";
import { theme } from "./theme";
import { getVisualIntensity } from "./visualIntensity";

export const DiagramScene: React.FC<SceneComponentProps> = ({ props, classification }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
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

  const titleSize = theme.font.titleSize * intensity.fontScale;
  const nodeFontSize = 44 * intensity.fontScale;

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
          letterSpacing: -2,
          opacity: titleAnim.opacity,
          textAlign: "center",
          color: intensity.accent.textColor ?? theme.colors.ink,
        }}
      >
        {props.title ?? "Diagram"}
      </div>

      <div
        style={{
          marginTop: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          flexWrap: "wrap",
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

          return (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  background: "#FFFFFF",
                  border: `${intensity.borderWidth}px solid ${intensity.accent.primary}`,
                  borderRadius: 24,
                  padding: `${32 + intensity.paddingBoost}px ${48 + intensity.paddingBoost}px`,
                  fontSize: nodeFontSize,
                  fontWeight: 700 + intensity.weightBoost,
                  minWidth: 220,
                  textAlign: "center",
                  boxShadow: `0 12px 40px ${intensity.accent.soft}`,
                  transform: `translateX(${nodeAnim.translateX}px)`,
                  opacity: nodeAnim.opacity,
                  color: intensity.accent.textColor ?? theme.colors.ink,
                }}
              >
                {node}
              </div>
              {i < nodes.length - 1 && (
                <div
                  style={{
                    width: 80,
                    height: intensity.borderWidth + 2,
                    background: intensity.accent.primary,
                    margin: "0 12px",
                    transformOrigin: "left",
                    transform: `scaleX(${arrowAnim.scaleX})`,
                    opacity: arrowAnim.opacity,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      right: -12,
                      top: -10,
                      width: 0,
                      height: 0,
                      borderTop: "13px solid transparent",
                      borderBottom: "13px solid transparent",
                      borderLeft: `20px solid ${intensity.accent.primary}`,
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
            marginTop: 100,
            fontSize: theme.font.bodySize * intensity.fontScale,
            lineHeight: 1.4,
            textAlign: "center",
            color: theme.colors.muted,
            opacity: bodyAnim.opacity,
            transform: `translateY(${bodyAnim.translateY}px)`,
          }}
        >
          {props.body}
        </div>
      )}
    </AbsoluteFill>
  );
};
