import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { createDefaultClassifier } from "../intelligence/sceneClassifier";
import { ScenePlan } from "../types";
import { getAudioDurationSeconds } from "../utils/audio";
import { enrichScenes } from "../utils/enrichScenes";
import { parseLessonScript } from "../utils/scriptParser";
import { buildScenePlan } from "../utils/timing";

export interface RunRenderOptions {
  fromPlan?: string;
  planOnly?: boolean;
  scriptPath?: string;
  audioPath?: string;
  planPath?: string;
  videoPath?: string;
  publicDir?: string;
  entryPoint?: string;
  log?: (step: string, msg: string) => void;
}

export interface RunRenderResult {
  planPath: string;
  videoPath?: string;
  durationMs: number;
  scenes: number;
}

const defaultLog = (step: string, msg: string) => process.stdout.write(`[${step}] ${msg}\n`);

export async function runRender(opts: RunRenderOptions = {}): Promise<RunRenderResult> {
  const projectRoot = process.cwd();
  const log = opts.log ?? defaultLog;

  const scriptPath = opts.scriptPath ?? resolve(projectRoot, "inputs/lesson-script.txt");
  const audioPath = opts.audioPath ?? resolve(projectRoot, "inputs/voiceover.mp3");
  const planPath = opts.planPath ?? resolve(projectRoot, "outputs/scene-plan.json");
  const videoPath = opts.videoPath ?? resolve(projectRoot, "outputs/final-video.mp4");
  const publicDir = opts.publicDir ?? resolve(projectRoot, "inputs");
  const entryPoint = opts.entryPoint ?? resolve(projectRoot, "src/index.ts");

  const startTime = Date.now();
  let plan: ScenePlan;

  if (opts.fromPlan) {
    const abs = resolve(projectRoot, opts.fromPlan);
    if (!existsSync(abs)) throw new Error(`Plan file not found: ${abs}`);
    const raw = await readFile(abs, "utf8");
    plan = JSON.parse(raw) as ScenePlan;
    if (!plan.scenes || !Array.isArray(plan.scenes)) {
      throw new Error(`Invalid scene plan at ${abs}: missing scenes[]`);
    }
    log("plan", `Loaded plan from ${abs} (${plan.scenes.length} scenes)`);
  } else {
    if (!existsSync(scriptPath)) throw new Error(`Lesson script not found: ${scriptPath}`);
    if (!existsSync(audioPath)) throw new Error(`Voiceover not found: ${audioPath}`);

    log("parse", `Reading lesson script ${basename(scriptPath)}`);
    const scriptSource = await readFile(scriptPath, "utf8");
    const parsedScenes = parseLessonScript(scriptSource);
    log("parse", `Found ${parsedScenes.length} scene block(s)`);

    const classifier = createDefaultClassifier();
    log("classify", `Using classifier: ${classifier.name}`);
    const rawScenes = await enrichScenes(parsedScenes, classifier);
    for (const scene of rawScenes) {
      const c = scene.classification;
      log(
        "classify",
        `  ${scene.id} → ${c.sceneType} | tone=${c.tone} | emphasis=${c.emphasis} | anim=${c.animationStyle}`,
      );
    }

    log("audio", `Probing voiceover duration via ffprobe`);
    const durationSeconds = await getAudioDurationSeconds(audioPath);
    log("audio", `Voiceover duration: ${durationSeconds.toFixed(2)}s`);

    plan = buildScenePlan(rawScenes, {
      audioPath: basename(audioPath),
      audioDurationSeconds: durationSeconds,
    });
  }

  await mkdir(dirname(planPath), { recursive: true });
  await writeFile(planPath, JSON.stringify(plan, null, 2), "utf8");
  log("plan", `Wrote ${planPath}`);

  if (opts.planOnly) {
    return { planPath, durationMs: Date.now() - startTime, scenes: plan.scenes.length };
  }

  log("bundle", `Bundling Remotion project`);
  const bundleLocation = await bundle({ entryPoint, publicDir });

  // Tunings for resource-constrained hosts (Render starter = 512MB RAM):
  // - timeoutInMilliseconds: 120s page-render timeout (default 33s is too tight on cold container)
  // - concurrency: 1 to keep memory in budget
  // - chromiumOptions.gl: 'swiftshader' avoids GPU init wait in headless Linux
  const RENDER_TIMEOUT_MS = 120_000;
  const RENDER_CONCURRENCY = 1;
  const CHROMIUM_OPTIONS = { gl: "swiftshader" as const };

  log("compose", `Selecting composition`);
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "EducationalVideo",
    inputProps: { plan },
    timeoutInMilliseconds: RENDER_TIMEOUT_MS,
    chromiumOptions: CHROMIUM_OPTIONS,
  });

  log(
    "render",
    `Rendering ${composition.width}x${composition.height} @ ${composition.fps}fps, ${composition.durationInFrames} frames`,
  );

  await mkdir(dirname(videoPath), { recursive: true });
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: videoPath,
    inputProps: { plan },
    timeoutInMilliseconds: RENDER_TIMEOUT_MS,
    concurrency: RENDER_CONCURRENCY,
    chromiumOptions: CHROMIUM_OPTIONS,
    jpegQuality: 70,
  });

  return {
    planPath,
    videoPath,
    durationMs: Date.now() - startTime,
    scenes: plan.scenes.length,
  };
}
