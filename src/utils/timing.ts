import { PlannedScene, RawScene, ScenePlan, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "../types";

const MIN_SCENE_SECONDS = 2;

export interface PlanOptions {
  audioPath: string;
  audioDurationSeconds: number;
  fps?: number;
  width?: number;
  height?: number;
}

export function buildScenePlan(rawScenes: RawScene[], opts: PlanOptions): ScenePlan {
  const fps = opts.fps ?? VIDEO_FPS;
  const totalSeconds = opts.audioDurationSeconds;

  const minTotal = MIN_SCENE_SECONDS * rawScenes.length;
  if (totalSeconds < minTotal) {
    throw new Error(
      `Audio is too short (${totalSeconds.toFixed(2)}s) for ${rawScenes.length} scenes. ` +
        `Need at least ${minTotal}s.`,
    );
  }

  const totalWeight = rawScenes.reduce((sum, s) => sum + s.weight, 0);
  const distributable = totalSeconds - minTotal;

  let cursorSeconds = 0;
  const scenes: PlannedScene[] = rawScenes.map((scene, idx) => {
    const share = (scene.weight / totalWeight) * distributable;
    const isLast = idx === rawScenes.length - 1;
    const durationSeconds = isLast
      ? totalSeconds - cursorSeconds
      : MIN_SCENE_SECONDS + share;

    const startFrame = Math.round(cursorSeconds * fps);
    const endFrame = Math.round((cursorSeconds + durationSeconds) * fps);
    const durationFrames = endFrame - startFrame;

    const planned: PlannedScene = {
      ...scene,
      start: startFrame,
      duration: durationFrames,
      startSeconds: Number(cursorSeconds.toFixed(3)),
      durationSeconds: Number(durationSeconds.toFixed(3)),
    };

    cursorSeconds += durationSeconds;
    return planned;
  });

  const totalFrames = scenes.reduce((sum, s) => sum + s.duration, 0);

  return {
    fps,
    width: opts.width ?? VIDEO_WIDTH,
    height: opts.height ?? VIDEO_HEIGHT,
    audioPath: opts.audioPath,
    audioDurationSeconds: totalSeconds,
    totalFrames,
    scenes,
  };
}
