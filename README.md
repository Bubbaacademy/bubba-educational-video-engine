# Bubba Educational Video Engine

Production-grade educational video generation engine for **Bubba Academy**. Turns a lesson script + an ElevenLabs voiceover into an animated educational video using **Remotion** + **FFmpeg**.

The pipeline starts *after* the voiceover has been generated — voice synthesis is out of scope for this engine.

> **Deployment target: Render.** This service is designed to run as a Render Web Service (Docker). See [Deploying to Render](#deploying-to-render).

## Pipeline

```
inputs/lesson-script.txt   ──►  parse  ──►  classify  ──►  plan (timing)  ──►  Remotion render  ──►  outputs/final-video.mp4
inputs/voiceover.mp3   ────────────────────────────────────►  ffprobe duration ───┘                            │
                                                                                                               └──►  outputs/scene-plan.json
```

## Project structure

```
bubba-educational-video-engine/
├── Dockerfile                     # Node + ffmpeg + Chromium libs (used by Render)
├── render.yaml                    # Render Blueprint (env: docker, /health probe)
├── cli/
│   ├── render.ts                  # CLI entrypoint (delegates to runRender())
│   └── test-classifier.ts         # Standalone runner for classifier examples
├── src/
│   ├── index.ts                   # Remotion registerRoot
│   ├── Root.tsx                   # Composition registry + calculateMetadata
│   ├── server/
│   │   └── index.ts               # Express HTTP server (4 endpoints)
│   ├── pipeline/
│   │   └── runRender.ts           # Reusable render pipeline (used by CLI + server)
│   ├── compositions/
│   │   └── EducationalVideo.tsx   # Audio + sequenced scenes
│   ├── scenes/                    # 7 scene templates + animationStyles + visualIntensity
│   ├── intelligence/              # Scene Intelligence Layer (classifier + rules)
│   ├── utils/                     # parser, planner, audio probe
│   └── types.ts                   # SceneType, tone, emphasis, ClassificationResult, ScenePlan
├── inputs/
│   ├── lesson-script.txt
│   └── voiceover.mp3              # auto-generated on first /render-sample if missing
├── samples/
│   └── scene-plan.example.json    # ready-made plan demonstrating all scene types
├── outputs/                       # generated at runtime
├── package.json
├── remotion.config.ts
└── tsconfig.json
```

## Deploying to Render

The project ships with a [`Dockerfile`](Dockerfile) and a [`render.yaml`](render.yaml) Blueprint. The Dockerfile installs ffmpeg and the Chromium runtime libs Remotion needs, so the deploy works without any per-platform tweaking.

### One-time setup (5 minutes)

1. **Push this repo to GitHub.**

   ```bash
   git init
   git add .
   git commit -m "Initial Bubba Educational Video Engine"
   git branch -M main
   git remote add origin git@github.com:<you>/bubba-educational-video-engine.git
   git push -u origin main
   ```

2. **Connect the repo to Render.**

   - Sign in at <https://render.com>.
   - Click **New +** → **Blueprint**.
   - Pick the GitHub repo you just pushed. Render reads `render.yaml` automatically.
   - Confirm the service name (`bubba-educational-video-engine`) and click **Apply**.

3. **First build takes ~5–10 minutes** — Render is building the Docker image (apt-installing ffmpeg + Chromium libs, then `npm ci`). Subsequent deploys are faster thanks to layer caching.

4. **Render will print a public URL** like `https://bubba-educational-video-engine.onrender.com`. Use this as `$BASE_URL` below.

### Verifying the deploy

```bash
# 1. Health check — should return {"status":"ok"} as soon as boot finishes
curl $BASE_URL/health

# 2. Trigger the sample render (returns 202 immediately, render runs in background)
curl -X POST $BASE_URL/render-sample

# 3. Poll status
curl $BASE_URL/render-status

# 4. Once `lastRender.ok === true`, list generated files
curl $BASE_URL/outputs

# 5. Download the MP4
curl -o final-video.mp4 $BASE_URL/outputs/final-video.mp4
```

The first `/render-sample` call also downloads Remotion's bundled Chromium and generates a placeholder `voiceover.mp3` — both are one-time costs (~30s) and the next render is much faster.

### Notes on persistence

- **Outputs are ephemeral by default.** Each Render deploy starts a fresh container, so files in `/app/outputs` disappear. For demos this is fine.
- To **persist outputs across deploys**, uncomment the `disk:` block in [`render.yaml`](render.yaml). Disks are paid-plan only and add ~$0.25/GB/month.
- **Free plan caveat:** free instances spin down after 15 minutes idle, and a cold start re-downloads Chromium. Use `plan: starter` for production demos.

## HTTP API

| Method | Path                       | Description                                                              |
|--------|----------------------------|--------------------------------------------------------------------------|
| GET    | `/health`                  | Liveness probe. Returns `{"status":"ok"}`.                               |
| POST   | `/render-sample`           | Kicks off a render of `samples/scene-plan.example.json`. Returns 202.     |
| GET    | `/render-status`           | Returns `{ inFlight, lastRender: { startedAt, finishedAt, ok, ... } }`.  |
| GET    | `/outputs`                 | Lists files in `/app/outputs` with size + mtime.                         |
| GET    | `/outputs/:filename`       | Streams a generated file. Filename is sanitized (`a-zA-Z0-9._-` only).   |

`POST /render-sample` is **fire-and-forget** — it returns immediately so HTTP timeouts don't kill long renders. Only one render can be in-flight at a time (returns 409 otherwise). Poll `/render-status` or `/outputs/final-video.mp4` to detect completion.

## Local development (optional)

The supported runtime is Render. If you do want to run it locally, you need ffmpeg + Chromium libs available on your machine — the easiest way is to build and run the same Docker image:

```bash
docker build -t bubba .
docker run --rm -p 3000:3000 bubba
# then in another terminal:
curl -X POST http://localhost:3000/render-sample
```

Pure-Node CLI invocations also work if you have ffmpeg on your `PATH`:

```bash
npm install
npm run prepare-sample-audio   # 60s silent placeholder
npm run render:sample          # renders the demo plan
npm run render                 # renders the lesson-script.txt
npm run plan                   # write scene-plan.json only, skip rendering
npm run test:classifier        # run classifier examples (pass/fail)
npm run dev                    # open Remotion Studio for live preview
```

The `render` CLI accepts `--from-plan <path>` to skip the parser/classifier and render an existing plan directly.

## Lesson script format

Each scene is introduced by a header on its own line, followed by the narration body that the voiceover speaks during that scene. The scene type is **optional** — when omitted, the Scene Intelligence Layer picks one automatically.

```
[scene]                                           ← auto-classified
Body text for this scene.

[scene:<type>]                                    ← explicit type
Body text for this scene.

[scene title="..." items="a,b,c"]                 ← attrs hint the type (items → checklist)
Body text for this scene.

[scene]
[happy] Body text starting with an emotional marker.
```

Supported types and attributes:

| Type        | Attributes              | Notes                                   |
|-------------|-------------------------|-----------------------------------------|
| `title`     | `title`                 | Big animated card, gradient background  |
| `text`      | `title`                 | Centered title + body                   |
| `whiteboard`| `title`                 | Underlined title, body fades in         |
| `checklist` | `title`, `items="a,b,c"`| Items animate in with checkmarks        |
| `diagram`   | `title`, `nodes="a,b,c"`| Boxes connected by animated arrows      |
| `warning`   | `title`                 | Yellow alert with shaking icon          |
| `character` | `title`                 | Cartoon character with speech bubble    |

## Scene Intelligence Layer

When the scene type is not given explicitly, the engine classifies it from the body text. Each scene gets a full **classification** persisted in `scene-plan.json`:

```json
{
  "sceneType": "warning",
  "tone": "serious",
  "emphasis": "high",
  "animationStyle": "shake_emphasis",
  "confidence": 0.95,
  "matchedRule": "warning.dont"
}
```

### How the classifier decides

1. **Explicit `[scene:type]`** in the script → that type is used (confidence 1.0). Tone/emphasis/animation still derived.
2. **Structural attrs** like `items=` or `nodes=` → strong hint (`items` ⇒ checklist, `nodes` ⇒ diagram, confidence 0.9).
3. **Rule table** at [`src/intelligence/rules.ts`](src/intelligence/rules.ts) — priority-ranked patterns (warnings > greetings > steps > best-practice > flow > definition > comparison > question > stat > concept > short-headline > default).
4. **Tone analyzer** — keyword detection across 8 tones (serious, warning, happy, excited, thoughtful, annoyed, educational, neutral).
5. **Emphasis analyzer** — `ALL CAPS` words, multiple `!`, or `important/critical/must` ⇒ `high`; short text ⇒ `medium`; long prose ⇒ `low`.
6. **Animation style** — taken from the matched rule, or defaulted per scene type.

### Emotional markers

Inline markers at the start of the body force the tone, regardless of text:

```
[happy]      [thoughtful]    [annoyed]     [warning]
[excited]    [serious]       [neutral]     [educational]
```

Example: `[warning] Do not skip validation.` ⇒ tone forced to `warning`.

### Replacing with an LLM later

The classifier is an interface:

```ts
interface SceneClassifier {
  readonly name: string;
  classify(input: ClassifierInput): Promise<ClassificationResult>;
}
```

`RuleBasedClassifier` is the v1 implementation. To swap in an LLM, write a new class implementing `SceneClassifier` and pass it to `enrichScenes(parsed, yourClassifier)`. Nothing downstream changes — the plan, the scenes, and the renderer all consume the same `ClassificationResult`.

## Visual layer — how scenes respond to classification

Every scene template receives the full `classification` and adapts itself. Two shared modules drive the look:

### [`src/scenes/animationStyles.ts`](src/scenes/animationStyles.ts)

Eight pure animation primitives — each a function returning numeric values (opacity, scale, translate, etc.) that scenes apply via inline style:

| Helper            | Used for                                                          |
|-------------------|-------------------------------------------------------------------|
| `handDraw`        | Progressive left-to-right reveal (whiteboard, diagram arrows)     |
| `fadeIn`          | Default body / paragraph reveal                                   |
| `popBigger`       | Spring-overshoot scale (titles, icons, character entry)           |
| `shakeEmphasis`   | Decaying horizontal shake (warning entry)                         |
| `slideIn`         | Translate from a side with spring (checklist items, diagram nodes)|
| `highlightReveal` | Colored bar sweeping behind text (high-emphasis text scenes)      |
| `calmWrite`       | Slow fade + tiny drift (thoughtful tone, whiteboard body)         |
| `seriousWarning`  | Pulsing border alpha + tiny breathing scale (warning ambience)    |

Scenes compose multiple helpers (entry + emphasis + ambient pulse) rather than picking exactly one. The `animationStyle` field in classification is a hint — scenes are free to interpret it (e.g., `ChecklistScene` switches between `slideIn` and `handDraw` based on the hint, but always uses `popBigger` for its check icons).

### [`src/scenes/visualIntensity.ts`](src/scenes/visualIntensity.ts)

`getVisualIntensity(classification)` maps tone + emphasis to concrete styling values:

- **Tone → accent palette** — serious/annoyed get red, warning gets amber, happy gets green, thoughtful gets purple, educational/neutral keep the blue accent.
- **Emphasis → font scale, weight boost, motion scale, border width, padding** — `high` ⇒ 1.18× font, +100 weight, 1.4× motion; `low` ⇒ 0.9× font, 0.7× motion.
- **Tone → animation pace** — thoughtful 1.4× slower, excited 0.8× faster.

### Examples of what changes per classification

| Input classification                                    | Visual outcome                                                                         |
|---------------------------------------------------------|----------------------------------------------------------------------------------------|
| `warning` + `serious` + `high`                          | Red palette, pulsing red border, shaking title, oversize bold body                     |
| `title` + `neutral` + `high`                            | Big pop-bigger title, wider accent bar, gradient background                            |
| `checklist` + `educational` + `medium` + `hand_draw`    | Items appear with underline-draw effect (instead of slide-in)                          |
| `text` + `serious` + `high` (e.g., a key point)         | Highlight bar sweeps behind title in red, oversized type                               |
| `character` + `thoughtful`                              | Slower bob, calm-write body reveal, neutral mouth                                      |
| `character` + `happy`                                   | Bigger bob, faster bubble entry, green accent                                          |

### About `animationStyle` values

The classifier emits `pop_in`/`pop_bigger`, `slide_in`, `hand_draw`, etc. Scenes interpret these as intent, not as a strict 1:1 helper mapping — `pop_in` and `pop_bigger` both render via the `popBigger` helper, with `emphasis` controlling the actual overshoot intensity. New animation styles (`pop_bigger`, `highlight_reveal`, `calm_write`, `serious_warning`) coexist with the original set so plans can express richer intent without breaking existing rules.

## How timing works

`src/utils/timing.ts` reads the voiceover's actual duration via `ffprobe`, then distributes that duration across scenes:

- Each scene gets a minimum floor (2s).
- Remaining time is distributed proportionally to each scene's narration length (a rough proxy for how long the voice will spend on it).
- The last scene absorbs any rounding remainder so audio + video end on the same frame.

This is intentionally simple. Future versions can swap in word-level timestamps from ElevenLabs to align scene boundaries to spoken phrases.

## Outputs

- `outputs/scene-plan.json` — the full timing plan (scenes, frames, props). Inspect this to debug timing.
- `outputs/final-video.mp4` — H.264 MP4, 1920×1080 @ 30fps, with audio muxed in.

## Extending

- **New scene type**: add a `XxxScene.tsx` in `src/scenes/`, register it in `SceneRenderer.tsx`, and add the type to `SceneType` in `src/types.ts`.
- **Different output sizes**: change `VIDEO_WIDTH`/`VIDEO_HEIGHT`/`VIDEO_FPS` in `src/types.ts` (or pass overrides into `buildScenePlan`).
- **Smarter timing**: replace `buildScenePlan` with one driven by ElevenLabs word timestamps.
