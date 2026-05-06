import { PlannedScene } from "../types";
import { CharacterExplainerScene } from "./CharacterExplainerScene";
import { ChecklistScene } from "./ChecklistScene";
import { DiagramScene } from "./DiagramScene";
import { TextOnScreenScene } from "./TextOnScreenScene";
import { TitleScene } from "./TitleScene";
import { WarningScene } from "./WarningScene";
import { WhiteboardScene } from "./WhiteboardScene";

export const SceneRenderer: React.FC<{ scene: PlannedScene }> = ({ scene }) => {
  const common = { props: scene.props, classification: scene.classification };
  switch (scene.type) {
    case "title":
      return <TitleScene {...common} />;
    case "whiteboard":
      return <WhiteboardScene {...common} />;
    case "text":
      return <TextOnScreenScene {...common} />;
    case "checklist":
      return <ChecklistScene {...common} />;
    case "character":
      return <CharacterExplainerScene {...common} />;
    case "warning":
      return <WarningScene {...common} />;
    case "diagram":
      return <DiagramScene {...common} />;
    default: {
      const _exhaustive: never = scene.type;
      throw new Error(`Unhandled scene type: ${_exhaustive}`);
    }
  }
};
