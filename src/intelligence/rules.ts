import { Rule } from "./types";

/**
 * Rule-based classification. Higher priority wins.
 * Keep rules data-only so they can be ported to a YAML/JSON store
 * or replaced by an LLM classifier without touching call sites.
 */
export const rules: Rule[] = [
  // ── WARNINGS / DON'TS ────────────────────────────────────────────
  {
    id: "warning.dont",
    description: "Negative imperatives — 'do not', 'don't', 'never', 'avoid'",
    priority: 100,
    patterns: [
      /\b(do not|don't|never|avoid|do not ever)\b/i,
      /\b(black[- ]?hat|spammy|illegal|prohibited|forbidden)\b/i,
    ],
    outcome: {
      sceneType: "warning",
      tone: "serious",
      emphasis: "high",
      animationStyle: "shake_emphasis",
    },
  },
  {
    id: "warning.caution",
    description: "Caution / be careful / risk language",
    priority: 95,
    patterns: [
      /\b(warning|caution|careful|danger|risk|beware|red flag)\b/i,
      /\b(violat\w+|penalt\w+|ban|banned|suspended)\b/i,
    ],
    outcome: {
      sceneType: "warning",
      tone: "warning",
      emphasis: "high",
      animationStyle: "shake_emphasis",
    },
  },
  {
    id: "warning.mistake",
    description: "Common mistakes / pitfalls",
    priority: 90,
    patterns: [/\b(common mistake|pitfall|gotcha|trap|easy to miss|watch out)\b/i],
    outcome: {
      sceneType: "warning",
      tone: "thoughtful",
      emphasis: "high",
      animationStyle: "shake_emphasis",
    },
  },

  // ── CHECKLIST / STEPS / TIPS ─────────────────────────────────────
  {
    id: "checklist.steps",
    description: "Numbered steps or 'first/second/third'",
    priority: 85,
    patterns: [
      /^\s*(\d+\.|step \d+|first[,:]|second[,:]|third[,:]|finally[,:])/im,
      /\b(steps?|stages?|phases?)\b.*\b(to|for)\b/i,
    ],
    outcome: {
      sceneType: "checklist",
      tone: "educational",
      emphasis: "medium",
      animationStyle: "slide_in",
    },
  },
  {
    id: "checklist.right_way",
    description: "How-to / 'the right way' / best practices",
    priority: 80,
    patterns: [
      /\b(the right way|best practice|pro tip|tip:|how to)\b/i,
      /\b(checklist|to[- ]?dos?|requirements?|essentials)\b/i,
    ],
    outcome: {
      sceneType: "checklist",
      tone: "educational",
      emphasis: "medium",
      animationStyle: "hand_draw",
    },
  },
  {
    id: "checklist.bullets",
    description: "Comma-separated list of 3+ items in a single sentence",
    priority: 60,
    patterns: [/^[^.!?]+,[^.!?]+,[^.!?]+[.!?]?$/],
    outcome: {
      sceneType: "checklist",
      tone: "educational",
      emphasis: "medium",
      animationStyle: "slide_in",
    },
  },
  {
    id: "checklist.recap",
    description: "Recap / summary / takeaways",
    priority: 75,
    patterns: [
      /\b(in summary|to recap|key takeaways?|recap|summary|in short|to sum up)\b/i,
    ],
    outcome: {
      sceneType: "checklist",
      tone: "educational",
      emphasis: "medium",
      animationStyle: "slide_in",
    },
  },

  // ── DIAGRAM / PROCESS / FLOW ─────────────────────────────────────
  {
    id: "diagram.flow",
    description: "Process / pipeline / arrow flow",
    priority: 78,
    patterns: [
      /\b(process|pipeline|workflow|flow|sequence)\b/i,
      /->|→|=>/,
      /\b(leads to|results in|produces|converts? \w+ (to|into))\b/i,
    ],
    outcome: {
      sceneType: "diagram",
      tone: "educational",
      emphasis: "medium",
      animationStyle: "slide_in",
    },
  },
  {
    id: "diagram.compare",
    description: "Comparisons — 'A vs B', 'compared to'",
    priority: 70,
    patterns: [
      /\b\w+\s+vs\.?\s+\w+/i,
      /\b(compared to|in contrast|on the other hand|whereas)\b/i,
    ],
    outcome: {
      sceneType: "diagram",
      tone: "thoughtful",
      emphasis: "medium",
      animationStyle: "slide_in",
    },
  },

  // ── WHITEBOARD / DEFINITIONS / CONCEPTS ──────────────────────────
  {
    id: "whiteboard.definition",
    description: "Definitions — 'X is...', 'means', 'refers to'",
    // Higher than diagram.flow so 'X is the process ...' is read as a definition.
    priority: 82,
    patterns: [
      /\bis defined as\b/i,
      /\b(means|refers to|stands for|is the (process|act|practice|technique) of)\b/i,
      /^\w[\w\s]*\s+is\s+(a|an|the)\b/i,
    ],
    outcome: {
      sceneType: "whiteboard",
      tone: "educational",
      emphasis: "medium",
      animationStyle: "hand_draw",
    },
  },
  {
    id: "whiteboard.concept",
    description: "Conceptual / explanatory",
    priority: 40,
    patterns: [
      /\b(concept|theory|principle|fundamental|understand|grasp)\b/i,
      /\b(let's explore|let's break down|let's look at)\b/i,
    ],
    outcome: {
      sceneType: "whiteboard",
      tone: "educational",
      emphasis: "medium",
      animationStyle: "hand_draw",
    },
  },

  // ── CHARACTER / CONVERSATIONAL ───────────────────────────────────
  {
    id: "character.greeting",
    description: "Welcome / hello / opening greetings",
    priority: 88,
    patterns: [
      /^\s*(welcome|hi|hello|hey|today we|in this lesson)\b/i,
      /\b(great (job|work)|well done|nice work|congrats|congratulations)\b/i,
    ],
    outcome: {
      sceneType: "character",
      tone: "happy",
      emphasis: "medium",
      animationStyle: "bounce",
    },
  },
  {
    id: "character.story",
    description: "Storytelling — 'imagine', 'suppose', 'let's say'",
    priority: 72,
    patterns: [/\b(imagine|suppose|let's say|picture this|consider this scenario)\b/i],
    outcome: {
      sceneType: "character",
      tone: "thoughtful",
      emphasis: "medium",
      animationStyle: "fade_in",
    },
  },
  {
    id: "character.question",
    description: "Direct question to the learner",
    priority: 68,
    patterns: [/\?\s*$/],
    outcome: {
      sceneType: "character",
      tone: "thoughtful",
      emphasis: "medium",
      animationStyle: "bounce",
    },
  },

  // ── TITLE / HEADING ──────────────────────────────────────────────
  {
    id: "title.lesson_intro",
    description: "Lesson intro / module title patterns",
    priority: 92,
    patterns: [
      /^\s*(lesson|module|chapter|part)\s+\d+/i,
      /^\s*introduction to\b/i,
    ],
    outcome: {
      sceneType: "title",
      tone: "neutral",
      emphasis: "high",
      animationStyle: "pop_in",
    },
  },
  {
    id: "title.short_headline",
    description: "Short headline (≤6 words, no terminal punctuation)",
    priority: 30,
    patterns: [/^[^.!?\n]{1,60}$/],
    outcome: {
      sceneType: "title",
      tone: "neutral",
      emphasis: "high",
      animationStyle: "pop_in",
    },
  },

  // ── EMPHASIS / IMPORTANT ─────────────────────────────────────────
  {
    id: "text.important",
    description: "Important / critical / must — emphasised text card",
    priority: 55,
    patterns: [/\b(important|critical|must|essential|crucial|key point)\b/i],
    outcome: {
      sceneType: "text",
      tone: "serious",
      emphasis: "high",
      animationStyle: "type_writer",
    },
  },
  {
    id: "text.statistic",
    description: "Statistic — percentage or grouped number (1,000+)",
    // Bare 2+ digit numbers are too greedy ('101' in 'Photosynthesis 101'),
    // so we only fire on % or comma-grouped numbers.
    priority: 50,
    patterns: [/\b\d+(\.\d+)?\s?%/, /\b\d+,\d{3}\b/],
    outcome: {
      sceneType: "text",
      tone: "neutral",
      emphasis: "high",
      animationStyle: "pop_in",
    },
  },

  // ── DEFAULT FALLBACK ─────────────────────────────────────────────
  {
    id: "text.default",
    description: "Fallback — plain explanatory text",
    priority: 1,
    patterns: [/.*/],
    outcome: {
      sceneType: "text",
      tone: "educational",
      emphasis: "medium",
      animationStyle: "fade_in",
    },
  },
];
