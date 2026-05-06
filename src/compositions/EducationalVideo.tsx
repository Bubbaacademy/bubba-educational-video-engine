import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneRenderer } from "../scenes/SceneRenderer";
import { ScenePlan } from "../types";

export interface EducationalVideoProps {
  plan: ScenePlan;
}

export const EducationalVideo: React.FC<EducationalVideoProps> = ({ plan }) => {
  const audioSrc = plan.audioPath.startsWith("http")
    ? plan.audioPath
    : staticFile(plan.audioPath);

  return (
    <AbsoluteFill style={{ background: "#FAFAF7" }}>
      <Audio src={audioSrc} />
      {plan.scenes.map((scene) => (
        <Sequence
          key={scene.id}
          from={scene.start}
          durationInFrames={scene.duration}
          name={`${scene.type}:${scene.id}`}
        >
          <SceneRenderer scene={scene} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
