import { ClassificationResult, EmotionalTone, EmphasisLevel } from "../types";
import { theme } from "./theme";

export interface ToneAccent {
  primary: string;
  soft: string;
  bgTint?: string;
  textColor?: string;
}

export const toneAccents: Record<EmotionalTone, ToneAccent> = {
  serious: { primary: "#DC2626", soft: "#FEE2E2", bgTint: "#FEF2F2", textColor: "#7F1D1D" },
  warning: { primary: "#F59E0B", soft: "#FEF3C7", bgTint: "#FFFBEB", textColor: "#78350F" },
  annoyed: { primary: "#DC2626", soft: "#FEE2E2", bgTint: "#FEF2F2", textColor: "#7F1D1D" },
  happy: { primary: "#10B981", soft: "#D1FAE5", bgTint: "#ECFDF5", textColor: "#064E3B" },
  excited: { primary: "#F97316", soft: "#FFEDD5", bgTint: "#FFF7ED", textColor: "#7C2D12" },
  thoughtful: { primary: "#7C3AED", soft: "#EDE9FE", bgTint: "#F5F3FF", textColor: "#4C1D95" },
  educational: { primary: theme.colors.accent, soft: theme.colors.accentSoft },
  neutral: { primary: theme.colors.accent, soft: theme.colors.accentSoft },
};

export interface EmphasisStyle {
  fontScale: number;
  weightBoost: number;
  motionScale: number;
  borderWidth: number;
  paddingBoost: number;
}

export const emphasisStyles: Record<EmphasisLevel, EmphasisStyle> = {
  low: { fontScale: 0.9, weightBoost: 0, motionScale: 0.7, borderWidth: 2, paddingBoost: 0 },
  medium: { fontScale: 1.0, weightBoost: 0, motionScale: 1.0, borderWidth: 4, paddingBoost: 0 },
  high: { fontScale: 1.18, weightBoost: 100, motionScale: 1.4, borderWidth: 6, paddingBoost: 8 },
};

// Pace multiplier on animation durations. >1 = slower, <1 = faster.
export const tonePace: Record<EmotionalTone, number> = {
  thoughtful: 1.4,
  serious: 1.1,
  warning: 1.0,
  educational: 1.0,
  neutral: 1.0,
  happy: 0.85,
  excited: 0.8,
  annoyed: 0.95,
};

export interface VisualIntensity extends EmphasisStyle {
  accent: ToneAccent;
  pace: number;
}

export function getVisualIntensity(c: ClassificationResult): VisualIntensity {
  return {
    ...emphasisStyles[c.emphasis],
    accent: toneAccents[c.tone],
    pace: tonePace[c.tone],
  };
}
