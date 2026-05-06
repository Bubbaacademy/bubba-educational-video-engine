import { EmotionalTone } from "../types";

const KNOWN_MARKERS: EmotionalTone[] = [
  "happy",
  "thoughtful",
  "annoyed",
  "warning",
  "excited",
  "serious",
  "neutral",
  "educational",
];

const MARKER_RE = /\[(happy|thoughtful|annoyed|warning|excited|serious|neutral|educational)\]/gi;

export interface MarkerExtractionResult {
  text: string;
  markers: EmotionalTone[];
}

export function extractMarkers(input: string): MarkerExtractionResult {
  const markers: EmotionalTone[] = [];
  const text = input
    .replace(MARKER_RE, (_, tone: string) => {
      const lower = tone.toLowerCase() as EmotionalTone;
      if (KNOWN_MARKERS.includes(lower) && !markers.includes(lower)) {
        markers.push(lower);
      }
      return "";
    })
    .replace(/\s{2,}/g, " ")
    .trim();

  return { text, markers };
}
