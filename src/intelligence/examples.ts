import { ClassificationResult, EmotionalTone } from "../types";

export interface ClassifierTestCase {
  name: string;
  input: {
    text: string;
    markers?: EmotionalTone[];
    forcedType?: ClassificationResult["sceneType"];
  };
  expect: Partial<Pick<ClassificationResult, "sceneType" | "tone" | "emphasis" | "animationStyle">>;
}

export const examples: ClassifierTestCase[] = [
  // ── from spec ────────────────────────────────────────────────────
  {
    name: "spec: don't use black-hat methods",
    input: { text: "Do not use black-hat review methods." },
    expect: {
      sceneType: "warning",
      tone: "serious",
      emphasis: "high",
      animationStyle: "shake_emphasis",
    },
  },
  {
    name: "spec: use vine program the right way",
    input: { text: "Use Vine Program the Right Way" },
    expect: {
      sceneType: "checklist",
      tone: "educational",
      emphasis: "medium",
      animationStyle: "hand_draw",
    },
  },

  // ── warnings ─────────────────────────────────────────────────────
  {
    name: "warning: never share your API key",
    input: { text: "Never share your API key publicly." },
    expect: { sceneType: "warning", emphasis: "high", animationStyle: "shake_emphasis" },
  },
  {
    name: "warning: caution when editing config",
    input: { text: "Caution: editing this config can break the build." },
    expect: { sceneType: "warning", tone: "warning" },
  },
  {
    name: "warning: common mistake — forgetting await",
    input: { text: "A common mistake is forgetting to await the promise." },
    expect: { sceneType: "warning", emphasis: "high" },
  },

  // ── checklists ───────────────────────────────────────────────────
  {
    name: "checklist: numbered steps",
    input: { text: "1. Install dependencies. 2. Configure env. 3. Run the dev server." },
    expect: { sceneType: "checklist" },
  },
  {
    name: "checklist: best practices",
    input: { text: "Here are the best practices for writing clean tests." },
    expect: { sceneType: "checklist", animationStyle: "hand_draw" },
  },
  {
    name: "checklist: recap",
    input: { text: "To recap: we covered variables, types, and functions." },
    expect: { sceneType: "checklist" },
  },

  // ── diagrams ─────────────────────────────────────────────────────
  {
    name: "diagram: process",
    input: { text: "The build process compiles, bundles, and ships your code." },
    expect: { sceneType: "diagram" },
  },
  {
    name: "diagram: comparison",
    input: { text: "Server-side rendering vs client-side rendering." },
    expect: { sceneType: "diagram" },
  },

  // ── whiteboard ───────────────────────────────────────────────────
  {
    name: "whiteboard: definition",
    input: { text: "Photosynthesis is the process plants use to make food." },
    expect: { sceneType: "whiteboard", animationStyle: "hand_draw" },
  },

  // ── character ────────────────────────────────────────────────────
  {
    name: "character: greeting",
    input: { text: "Welcome back! Today we're learning about loops." },
    expect: { sceneType: "character", tone: "happy" },
  },
  {
    name: "character: imagine scenario",
    input: { text: "Imagine you're shipping a feature to a million users." },
    expect: { sceneType: "character" },
  },
  {
    name: "character: question",
    input: { text: "What happens if the request times out?" },
    expect: { sceneType: "character" },
  },

  // ── title ────────────────────────────────────────────────────────
  {
    name: "title: lesson 3",
    input: { text: "Lesson 3: Async Patterns" },
    expect: { sceneType: "title", animationStyle: "pop_in" },
  },
  {
    name: "title: short headline",
    input: { text: "Photosynthesis 101" },
    expect: { sceneType: "title" },
  },

  // ── emphasis ─────────────────────────────────────────────────────
  {
    name: "text: important note",
    input: { text: "It is important to validate user input on the server." },
    expect: { sceneType: "text", emphasis: "high" },
  },
  {
    name: "text: statistic",
    input: { text: "Around 87% of users abandon slow pages." },
    expect: { sceneType: "text", emphasis: "high" },
  },

  // ── markers override tone ────────────────────────────────────────
  {
    name: "marker [happy] forces happy tone",
    input: { text: "This concept can be tricky.", markers: ["happy"] },
    expect: { tone: "happy" },
  },
  {
    name: "marker [annoyed] forces annoyed tone",
    input: { text: "Let's try this again.", markers: ["annoyed"] },
    expect: { tone: "annoyed" },
  },

  // ── forcedType wins ──────────────────────────────────────────────
  {
    name: "forcedType=diagram overrides text",
    input: { text: "Here's how the data flows.", forcedType: "diagram" },
    expect: { sceneType: "diagram" },
  },
];
