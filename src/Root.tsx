import { CalculateMetadataFunction, Composition } from "remotion";
import { EducationalVideo, EducationalVideoProps } from "./compositions/EducationalVideo";
import { ScenePlan, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "./types";

const stubPlan: ScenePlan = {
  fps: VIDEO_FPS,
  width: VIDEO_WIDTH,
  height: VIDEO_HEIGHT,
  audioPath: "voiceover.mp3",
  audioDurationSeconds: 6,
  totalFrames: VIDEO_FPS * 6,
  scenes: [
    {
      id: "stub_1",
      type: "title",
      weight: 1,
      start: 0,
      duration: VIDEO_FPS * 6,
      startSeconds: 0,
      durationSeconds: 6,
      props: {
        title: "Bubba Academy",
        body: "Run `npm run render` to generate a real video from your script + voiceover.",
      },
      classification: {
        sceneType: "title",
        tone: "neutral",
        emphasis: "high",
        animationStyle: "pop_bigger",
        confidence: 1,
        matchedRule: "stub",
      },
    },
  ],
};

const calculateMetadata: CalculateMetadataFunction<EducationalVideoProps> = ({ props }) => {
  const plan = props.plan;
  return {
    durationInFrames: plan.totalFrames,
    fps: plan.fps,
    width: plan.width,
    height: plan.height,
  };
};

export const Root: React.FC = () => {
  return (
    <Composition
      id="EducationalVideo"
      component={EducationalVideo}
      durationInFrames={stubPlan.totalFrames}
      fps={stubPlan.fps}
      width={stubPlan.width}
      height={stubPlan.height}
      defaultProps={{ plan: stubPlan }}
      calculateMetadata={calculateMetadata}
    />
  );
};
