import {
  AnimationStyle,
  ClassificationResult,
  EmotionalTone,
  EmphasisLevel,
  SceneType,
} from "../types";
import { rules as defaultRules } from "./rules";
import { ClassifierInput, Rule, SceneClassifier } from "./types";

const TONE_KEYWORDS: Record<EmotionalTone, RegExp[]> = {
  serious: [/\b(must|critical|never|do not|don't|warning|danger)\b/i],
  warning: [/\b(warning|caution|careful|risk|danger|beware)\b/i],
  happy: [/\b(great|awesome|nice|well done|congrats|amazing|love)\b/i],
  excited: [/!{2,}|\b(let's go|amazing|wow|incredible|fantastic)\b/i],
  thoughtful: [/\b(consider|think about|reflect|imagine|suppose|notice)\b/i],
  annoyed: [/\b(stop|wrong|bad|frustrating|annoying)\b/i],
  educational: [/\b(learn|understand|explain|concept|principle|example)\b/i],
  neutral: [],
};

const DEFAULT_ANIMATION_BY_TYPE: Record<SceneType, AnimationStyle> = {
  title: "pop_in",
  whiteboard: "hand_draw",
  text: "fade_in",
  checklist: "slide_in",
  character: "bounce",
  warning: "shake_emphasis",
  diagram: "slide_in",
};

function detectTone(text: string, markers: EmotionalTone[]): EmotionalTone {
  if (markers.length > 0) return markers[0];

  for (const tone of Object.keys(TONE_KEYWORDS) as EmotionalTone[]) {
    if (tone === "neutral") continue;
    if (TONE_KEYWORDS[tone].some((re) => re.test(text))) {
      return tone;
    }
  }
  return "educational";
}

function detectEmphasis(text: string): EmphasisLevel {
  const allCapsWords = (text.match(/\b[A-Z]{3,}\b/g) ?? []).length;
  const bangs = (text.match(/!/g) ?? []).length;
  const importantHit = /\b(important|critical|must|never|essential|key)\b/i.test(text);

  if (allCapsWords >= 1 || bangs >= 2 || importantHit) return "high";
  if (text.length < 80) return "medium";
  return "low";
}

function pickRule(text: string, rules: Rule[]): { rule: Rule; matchedPattern?: string } | null {
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);
  for (const rule of sorted) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        return { rule, matchedPattern: pattern.source };
      }
    }
  }
  return null;
}

function inferTypeFromAttrs(attrs: Record<string, string> | undefined): SceneType | null {
  if (!attrs) return null;
  if (attrs.items) return "checklist";
  if (attrs.nodes) return "diagram";
  return null;
}

function ruleConfidence(rule: Rule): number {
  // Map priority [1, 100] → confidence [0.4, 0.95]
  const clamped = Math.max(1, Math.min(100, rule.priority));
  return Number((0.4 + (clamped / 100) * 0.55).toFixed(2));
}

export interface RuleBasedClassifierOptions {
  rules?: Rule[];
}

export class RuleBasedClassifier implements SceneClassifier {
  readonly name = "rule-based-v1";
  private readonly rules: Rule[];

  constructor(opts: RuleBasedClassifierOptions = {}) {
    this.rules = opts.rules ?? defaultRules;
  }

  async classify(input: ClassifierInput): Promise<ClassificationResult> {
    const text = input.text.trim();
    const markers = input.markers ?? [];

    if (input.forcedType) {
      const tone = detectTone(text, markers);
      const emphasis = detectEmphasis(text);
      return {
        sceneType: input.forcedType,
        tone,
        emphasis,
        animationStyle: DEFAULT_ANIMATION_BY_TYPE[input.forcedType],
        confidence: 1,
        matchedRule: "explicit:forcedType",
      };
    }

    // Strong structural hints from script attrs override pattern rules.
    // Writers who provide items/nodes have explicitly chosen the visual shape.
    const attrType = inferTypeFromAttrs(input.attrs);
    if (attrType) {
      return {
        sceneType: attrType,
        tone: markers[0] ?? detectTone(text, markers),
        emphasis: detectEmphasis(text),
        animationStyle: DEFAULT_ANIMATION_BY_TYPE[attrType],
        confidence: 0.9,
        matchedRule: `attrs:${attrType}`,
      };
    }

    const match = pickRule(text, this.rules);
    if (!match) {
      return {
        sceneType: "text",
        tone: detectTone(text, markers),
        emphasis: detectEmphasis(text),
        animationStyle: "fade_in",
        confidence: 0.3,
        matchedRule: "none",
      };
    }

    const { rule } = match;
    const sceneType = rule.outcome.sceneType;
    const tone = markers.length > 0 ? markers[0] : rule.outcome.tone ?? detectTone(text, markers);
    const emphasis = rule.outcome.emphasis ?? detectEmphasis(text);
    const animationStyle =
      rule.outcome.animationStyle ?? DEFAULT_ANIMATION_BY_TYPE[sceneType];

    return {
      sceneType,
      tone,
      emphasis,
      animationStyle,
      confidence: ruleConfidence(rule),
      matchedRule: rule.id,
    };
  }
}

export function createDefaultClassifier(): SceneClassifier {
  return new RuleBasedClassifier();
}
