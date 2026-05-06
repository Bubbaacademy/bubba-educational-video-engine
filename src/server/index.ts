import express, { Request, Response } from "express";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { runRender } from "../pipeline/runRender";
import { getAudioDurationSeconds } from "../utils/audio";

const execFileAsync = promisify(execFile);

const PORT = Number(process.env.PORT) || 3000;
const projectRoot = process.cwd();
const inputsDir = resolve(projectRoot, "inputs");
const outputsDir = resolve(projectRoot, "outputs");
const samplePlanPath = resolve(projectRoot, "samples/scene-plan.example.json");

const app = express();
app.use(express.json({ limit: "5mb" }));

interface LastRender {
  source: "render-sample" | "render";
  startedAt: string;
  outputName: string;
  finishedAt?: string;
  ok?: boolean;
  error?: string;
  durationMs?: number;
  audioDurationSeconds?: number;
  scenes?: number;
}

let renderInFlight = false;
let lastRender: LastRender | null = null;

function log(step: string, msg: string) {
  process.stdout.write(`[${step}] ${msg}\n`);
}

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

const SAFE_FILENAME = /^[a-zA-Z0-9._-]+$/;

function sanitizeOutputName(raw: unknown): string {
  if (typeof raw !== "string" || raw.trim() === "") return "final-video.mp4";
  // Strip any path components first
  const base = raw.replace(/^.*[/\\]/, "").trim();
  // Replace non-safe chars with underscore
  let safe = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  // Ensure .mp4 extension
  if (!safe.toLowerCase().endsWith(".mp4")) safe = safe.replace(/\.[^.]*$/, "") + ".mp4";
  // Length cap
  if (safe.length > 80) safe = safe.slice(0, 76) + ".mp4";
  return safe || "final-video.mp4";
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url, {
    headers: { "User-Agent": "BubbaEducationalVideoEngine/0.1 (+render)" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Voiceover download failed: HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  const ab = await res.arrayBuffer();
  if (ab.byteLength < 1024) {
    throw new Error(`Voiceover download too small (${ab.byteLength} bytes) — bad URL?`);
  }
  await mkdir(inputsDir, { recursive: true });
  await writeFile(dest, Buffer.from(ab));
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
  lastRender = {
    source: "render-sample",
    startedAt: new Date().toISOString(),
    outputName: "final-video.mp4",
  };

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
        ...lastRender!,
        finishedAt: new Date().toISOString(),
        ok: true,
        durationMs: result.durationMs,
        audioDurationSeconds: result.audioDurationSeconds,
        scenes: result.scenes,
      };
      log("render-sample", `done in ${Date.now() - startedAt}ms (${result.scenes} scenes)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastRender = {
        ...lastRender!,
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

app.post("/render", async (req: Request, res: Response) => {
  if (renderInFlight) {
    res.status(409).json({ error: "render already in progress" });
    return;
  }

  const { lessonScript, voiceoverUrl, outputName } = (req.body ?? {}) as {
    lessonScript?: unknown;
    voiceoverUrl?: unknown;
    outputName?: unknown;
  };

  if (typeof lessonScript !== "string" || lessonScript.trim() === "") {
    res.status(400).json({ error: "lessonScript (non-empty string) is required" });
    return;
  }
  if (typeof voiceoverUrl !== "string" || !/^https?:\/\//i.test(voiceoverUrl)) {
    res.status(400).json({ error: "voiceoverUrl (http(s) URL) is required" });
    return;
  }

  const safeOutputName = sanitizeOutputName(outputName);
  const videoPath = resolve(outputsDir, safeOutputName);

  renderInFlight = true;
  lastRender = {
    source: "render",
    startedAt: new Date().toISOString(),
    outputName: safeOutputName,
  };

  res.status(202).json({
    status: "started",
    outputName: safeOutputName,
    expectedOutput: `/outputs/${safeOutputName}`,
    pollWith: `GET /outputs/${safeOutputName} (404 = not ready, 200 = ready)`,
    statusEndpoint: "GET /render-status",
  });

  void (async () => {
    const startedAt = Date.now();
    try {
      await mkdir(inputsDir, { recursive: true });
      const scriptPath = resolve(inputsDir, "lesson-script.txt");
      const audioPath = resolve(inputsDir, "voiceover.mp3");

      log("render", `Saving lesson script (${lessonScript.length} chars)`);
      await writeFile(scriptPath, lessonScript, "utf8");

      log("render", `Downloading voiceover from ${voiceoverUrl}`);
      await downloadFile(voiceoverUrl, audioPath);

      // Probe audio duration up front so /render-status surfaces it early,
      // before the heavy bundle/render phase.
      const audioDurationSeconds = await getAudioDurationSeconds(audioPath);
      log("render", `Voiceover duration: ${audioDurationSeconds.toFixed(2)}s`);
      lastRender = { ...lastRender!, audioDurationSeconds };

      const result = await runRender({ videoPath, log });

      lastRender = {
        ...lastRender!,
        finishedAt: new Date().toISOString(),
        ok: true,
        durationMs: result.durationMs,
        audioDurationSeconds: result.audioDurationSeconds,
        scenes: result.scenes,
      };
      log("render", `done in ${Date.now() - startedAt}ms (${result.scenes} scenes) → ${safeOutputName}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastRender = {
        ...lastRender!,
        finishedAt: new Date().toISOString(),
        ok: false,
        error: message,
        durationMs: Date.now() - startedAt,
      };
      log("render", `FAILED: ${message}`);
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
