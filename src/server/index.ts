import express, { Request, Response } from "express";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { runRender } from "../pipeline/runRender";

const execFileAsync = promisify(execFile);

const PORT = Number(process.env.PORT) || 3000;
const projectRoot = process.cwd();
const inputsDir = resolve(projectRoot, "inputs");
const outputsDir = resolve(projectRoot, "outputs");
const samplePlanPath = resolve(projectRoot, "samples/scene-plan.example.json");

const app = express();
app.use(express.json());

let renderInFlight = false;
let lastRender: { startedAt: string; finishedAt?: string; ok?: boolean; error?: string; durationMs?: number } | null = null;

function log(step: string, msg: string) {
  process.stdout.write(`[${step}] ${msg}\n`);
}

/**
 * Generates a 60s silent voiceover.mp3 if one isn't present, so /render-sample
 * works on a fresh deploy without any manual file upload.
 */
async function ensureSampleAudio(): Promise<void> {
  const audioPath = resolve(inputsDir, "voiceover.mp3");
  if (existsSync(audioPath)) return;
  await mkdir(inputsDir, { recursive: true });
  log("boot", "Generating placeholder voiceover.mp3 (60s silence) via ffmpeg");
  await execFileAsync("ffmpeg", [
    "-y", "-f", "lavfi",
    "-i", "anullsrc=r=44100:cl=stereo",
    "-t", "60", "-q:a", "9",
    "-acodec", "libmp3lame", audioPath,
  ]);
}

// ─── routes ──────────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.post("/render-sample", async (_req: Request, res: Response) => {
  if (renderInFlight) {
    res.status(409).json({ error: "render already in progress" });
    return;
  }
  renderInFlight = true;
  lastRender = { startedAt: new Date().toISOString() };

  // Acknowledge immediately — render runs in the background. Clients poll
  // GET /outputs (or GET /outputs/final-video.mp4) to detect completion.
  res.status(202).json({
    status: "started",
    expectedOutput: "/outputs/final-video.mp4",
    pollWith: "GET /outputs/final-video.mp4 (404 = not ready, 200 = ready)",
    statusEndpoint: "GET /render-status",
  });

  void (async () => {
    const startedAt = Date.now();
    try {
      await ensureSampleAudio();
      const result = await runRender({ fromPlan: samplePlanPath, log });
      lastRender = {
        startedAt: lastRender!.startedAt,
        finishedAt: new Date().toISOString(),
        ok: true,
        durationMs: result.durationMs,
      };
      log("render-sample", `done in ${Date.now() - startedAt}ms (${result.scenes} scenes)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastRender = {
        startedAt: lastRender!.startedAt,
        finishedAt: new Date().toISOString(),
        ok: false,
        error: message,
        durationMs: Date.now() - startedAt,
      };
      log("render-sample", `FAILED: ${message}`);
    } finally {
      renderInFlight = false;
    }
  })();
});

app.get("/render-status", (_req: Request, res: Response) => {
  res.json({ inFlight: renderInFlight, lastRender });
});

app.get("/outputs", async (_req: Request, res: Response) => {
  if (!existsSync(outputsDir)) {
    res.json({ files: [] });
    return;
  }
  const names = await readdir(outputsDir);
  const files = await Promise.all(
    names.map(async (name) => {
      const full = resolve(outputsDir, name);
      const s = await stat(full);
      return { name, size: s.size, modified: s.mtime.toISOString() };
    }),
  );
  res.json({ files });
});

const SAFE_FILENAME = /^[a-zA-Z0-9._-]+$/;

app.get("/outputs/:filename", (req: Request, res: Response) => {
  const { filename } = req.params;
  if (!SAFE_FILENAME.test(filename)) {
    res.status(400).json({ error: "invalid filename" });
    return;
  }
  const filepath = resolve(outputsDir, filename);
  if (!filepath.startsWith(outputsDir + "/") && filepath !== outputsDir) {
    res.status(400).json({ error: "invalid path" });
    return;
  }
  if (!existsSync(filepath)) {
    res.status(404).json({ error: "file not found" });
    return;
  }
  res.sendFile(filepath);
});

// ─── boot ────────────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  log("server", `bubba-educational-video-engine listening on :${PORT}`);
  // Best-effort: pre-warm Remotion's Chromium so the first /render-sample is fast.
  try {
    const renderer = await import("@remotion/renderer");
    const ensure = (renderer as { ensureBrowser?: () => Promise<unknown> }).ensureBrowser;
    if (typeof ensure === "function") {
      log("boot", "Ensuring Chromium is downloaded (one-time cost)…");
      await ensure();
      log("boot", "Chromium ready");
    }
  } catch (err) {
    log("boot", `Chromium pre-warm skipped: ${err instanceof Error ? err.message : String(err)}`);
  }
});
