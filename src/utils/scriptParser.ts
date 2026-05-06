import { EmotionalTone, SceneType } from "../types";
import { extractMarkers } from "../intelligence/markerParser";

const SCENE_HEADER = /^\[scene(?::(\w+))?(?:\s+(.*))?\]$/;
const VALID_TYPES: SceneType[] = [
  "title",
  "whiteboard",
  "text",
  "checklist",
  "character",
  "warning",
  "diagram",
];

export interface ParsedScene {
  id: string;
  forcedType?: SceneType;
  body: string;
  attrs: Record<string, string>;
  markers: EmotionalTone[];
}

function parseAttributes(input: string | undefined): Record<string, string> {
  if (!input) return {};
  const out: Record<string, string> = {};
  const re = /(\w+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(input)) !== null) {
    out[match[1]] = match[2];
  }
  return out;
}

export function parseLessonScript(source: string): ParsedScene[] {
  const lines = source.split(/\r?\n/);
  const scenes: ParsedScene[] = [];
  let current: ParsedScene | null = null;
  let bodyBuffer: string[] = [];

  const flush = () => {
    if (!current) return;
    const rawBody = bodyBuffer.join("\n").trim();
    const { text, markers } = extractMarkers(rawBody);
    current.body = text;
    current.markers = markers;
    scenes.push(current);
    current = null;
    bodyBuffer = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    const headerMatch = line.match(SCENE_HEADER);

    if (headerMatch) {
      flush();
      const explicitType = headerMatch[1] as SceneType | undefined;
      if (explicitType && !VALID_TYPES.includes(explicitType)) {
        throw new Error(`Unknown scene type "${explicitType}"`);
      }
      current = {
        id: `scene_${scenes.length + 1}`,
        forcedType: explicitType,
        body: "",
        attrs: parseAttributes(headerMatch[2]),
        markers: [],
      };
      continue;
    }

    if (current && line.length > 0) {
      bodyBuffer.push(line);
    }
  }

  flush();

  if (scenes.length === 0) {
    throw new Error(
      "No scenes found in lesson script. Expected [scene] or [scene:type ...] markers.",
    );
  }

  return scenes;
}
