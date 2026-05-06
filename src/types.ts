export type SceneType =
  | "title"
  | "whiteboard"
  | "text"
  | "checklist"
  | "character"
  | "warning"
  | "diagram";

export type EmotionalTone =
  | "neutral"
  | "educational"
  | "serious"
  | "warning"
  | "excited"
  | "happy"
  | "thoughtful"
  | "annoyed";

export type EmphasisLevel = "low" | "medium" | "high";

export type AnimationStyle =
  | "fade_in"
  | "hand_draw"
  | "type_writer"
  | "shake_emphasis"
  | "pop_in"
  | "pop_bigger"
  | "slide_in"
  | "bounce"
  | "highlight_reveal"
  | "calm_write"
  | "serious_warning";

export interface ClassificationResult {
  sceneType: SceneType;
  tone: EmotionalTone;
  emphasis: EmphasisLevel;
  animationStyle: AnimationStyle;
  confidence: number;
  matchedRule?: string;
}

export interface SceneProps {
  title?: string;
  body?: string;
  items?: string[];
  character?: string;
  diagramNodes?: string[];
}

export interface RawScene {
  id: string;
  type: SceneType;
  props: SceneProps;
  weight: number;
  classification: ClassificationResult;
}

export interface PlannedScene extends RawScene {
  start: number;
  duration: number;
  startSeconds: number;
  durationSeconds: number;
}

export interface ScenePlan {
  fps: number;
  width: number;
  height: number;
  audioPath: string;
  audioDurationSeconds: number;
  totalFrames: number;
  scenes: PlannedScene[];
}

export const VIDEO_FPS = 30;
// 720p default keeps Remotion + Chromium under Render starter's 512MB RAM ceiling.
// Bump to 1920x1080 once the host has more headroom (Standard plan = 2GB).
export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;
