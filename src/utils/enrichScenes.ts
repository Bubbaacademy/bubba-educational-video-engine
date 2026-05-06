import { SceneClassifier } from "../intelligence/types";
import { RawScene, SceneProps } from "../types";
import { ParsedScene } from "./scriptParser";

function buildProps(parsed: ParsedScene): SceneProps {
  const attrs = parsed.attrs;
  return {
    title: attrs.title,
    character: attrs.character,
    items: attrs.items
      ? attrs.items.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    diagramNodes: attrs.nodes
      ? attrs.nodes.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    body: parsed.body || undefined,
  };
}

export async function enrichScenes(
  parsed: ParsedScene[],
  classifier: SceneClassifier,
): Promise<RawScene[]> {
  const enriched: RawScene[] = [];

  for (const scene of parsed) {
    const classifyText = [scene.attrs.title, scene.body].filter(Boolean).join(". ");
    const classification = await classifier.classify({
      text: classifyText || scene.body,
      forcedType: scene.forcedType,
      markers: scene.markers,
      attrs: scene.attrs,
    });

    enriched.push({
      id: scene.id,
      type: classification.sceneType,
      props: buildProps(scene),
      weight: Math.max(1, scene.body.length || (scene.attrs.title?.length ?? 1)),
      classification,
    });
  }

  return enriched;
}
