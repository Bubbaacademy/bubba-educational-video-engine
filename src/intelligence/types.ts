import {
  AnimationStyle,
  ClassificationResult,
  EmotionalTone,
  EmphasisLevel,
  SceneType,
} from "../types";

export interface ClassifierInput {
  text: string;
  forcedType?: SceneType;
  markers?: EmotionalTone[];
  attrs?: Record<string, string>;
}

export interface SceneClassifier {
  readonly name: string;
  classify(input: ClassifierInput): Promise<ClassificationResult>;
}

export interface Rule {
  id: string;
  description: string;
  priority: number;
  patterns: RegExp[];
  outcome: {
    sceneType: SceneType;
    tone?: EmotionalTone;
    emphasis?: EmphasisLevel;
    animationStyle?: AnimationStyle;
  };
}

export interface RuleMatch {
  rule: Rule;
  matchedPattern: string;
}
