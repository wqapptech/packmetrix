/**
 * Packmetrix demo — ElevenLabs voice-over generator + ffmpeg muxer
 *
 * 1. Takes the latest .webm from ./videos/ (or a path you pass as argument)
 * 2. Calls ElevenLabs TTS for each narration clip
 * 3. Places every clip at its timestamp using ffmpeg's adelay filter
 * 4. Writes the final video to ./videos/demo-with-voiceover.mp4
 *
 * Requirements:
 *   - ffmpeg installed and on PATH  (brew install ffmpeg)
 *   - ElevenLabs API key
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... npx tsx e2e/voiceover.ts
 *   ELEVENLABS_API_KEY=sk_... npx tsx e2e/voiceover.ts videos/my-recording.webm
 *
 * Tune timing:
 *   After a first run, watch the output and adjust the `startMs` values below
 *   so each narration line lands on the right moment in the video.
 *
 * Find voice IDs at: https://elevenlabs.io/voice-library
 * Default voice is "Rachel" — calm, clear, professional.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execFileSync, spawnSync } from "child_process";

// ── Config ────────────────────────────────────────────────────────────────────

const API_KEY   = process.env.ELEVENLABS_API_KEY ?? "";
const VOICE_ID  = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM"; // Rachel
const MODEL_ID  = process.env.ELEVENLABS_MODEL_ID ?? "eleven_turbo_v2_5";

if (!API_KEY) {
  console.error("\nMissing ELEVENLABS_API_KEY env var.\n");
  process.exit(1);
}

// ── Narration script ──────────────────────────────────────────────────────────
//
// startMs = milliseconds into the video when this line should BEGIN.
//
// These are calibrated estimates based on the Playwright script's beat() calls
// and slowMo: 700ms setting.  Adjust freely after watching the first output.

const CLIPS: Array<{ startMs: number; text: string }> = [
  // ── 0. Landing page ──────────────────────────────────────────────────────
  {
    startMs: 1_000,
    text: "This is Packmetrix — the platform that turns your travel packages into beautiful, branded landing pages under your own domain, in minutes.",
  },

  // ── 1. Login ─────────────────────────────────────────────────────────────
  {
    startMs: 14_000,
    text: "Sign in to your workspace.",
  },

  // ── 2. Packages dashboard ─────────────────────────────────────────────────
  {
    startMs: 25_000,
    text: "This is the packages dashboard — all your live and draft packages in one place, with views, leads, and conversion stats at a glance.",
  },

  // ── 3. Branding page ──────────────────────────────────────────────────────
  {
    startMs: 38_000,
    text: "In the branding settings you set your agency name, logo, and brand colour.",
  },
  {
    startMs: 48_000,
    text: "And here — your custom domain. Every package page is served from your own URL, with no Packmetrix branding anywhere.",
  },

  // ── 4. New package ────────────────────────────────────────────────────────
  {
    startMs: 58_000,
    text: "Back on the dashboard — let's create a new package.",
  },

  // ── 5. Template picker ────────────────────────────────────────────────────
  {
    startMs: 67_000,
    text: "Ten professionally designed templates, each built for a different kind of trip. We're choosing Pulse — it's designed for urgency and conversions.",
  },

  // ── 6. AI extraction ──────────────────────────────────────────────────────
  {
    startMs: 80_000,
    text: "Now watch this. Paste any package description — a WhatsApp message, an itinerary, anything. The AI reads it and fills every field automatically.",
  },

  // ── 7. Core fields review ─────────────────────────────────────────────────
  {
    startMs: 97_000,
    text: "Destination, price, nights, title, description — all extracted in seconds. We just add the WhatsApp number.",
  },

  // ── 8. Cover image ────────────────────────────────────────────────────────
  {
    startMs: 108_000,
    text: "Search millions of photos from Pexels and Unsplash without ever leaving the builder.",
  },

  // ── 9a. Scarcity & Urgency ────────────────────────────────────────────────
  {
    startMs: 118_000,
    text: "The Scarcity and Urgency section is Pulse's superpower. It shows a live countdown timer, the number of spots remaining, and the original price — creating real urgency right at the top of the page.",
  },

  // ── 9b. Itinerary ─────────────────────────────────────────────────────────
  {
    startMs: 136_000,
    text: "A full day-by-day itinerary your clients can follow.",
  },

  // ── 9c. Highlights ────────────────────────────────────────────────────────
  {
    startMs: 146_000,
    text: "Key selling points, displayed as visual tags at the top of the page.",
  },

  // ── 9d. Hotel ─────────────────────────────────────────────────────────────
  {
    startMs: 156_000,
    text: "Hotel name, star rating, and description.",
  },

  // ── 9e. Departures ────────────────────────────────────────────────────────
  {
    startMs: 166_000,
    text: "Available departure dates so clients can book a specific slot.",
  },

  // ── 9f. Pricing ───────────────────────────────────────────────────────────
  {
    startMs: 176_000,
    text: "Flexible pricing tiers — per person, single supplement, child rates, whatever you need.",
  },

  // ── 9g. Reviews ───────────────────────────────────────────────────────────
  {
    startMs: 186_000,
    text: "Traveller testimonials and star ratings to build trust with new clients.",
  },

  // ── 9h. About agency ──────────────────────────────────────────────────────
  {
    startMs: 196_000,
    text: "Your agency story — shown on every package page to reinforce your brand.",
  },

  // ── 10. Publish ───────────────────────────────────────────────────────────
  {
    startMs: 207_000,
    text: "One click to publish. The page goes live instantly.",
  },

  // ── 11. Success screen ────────────────────────────────────────────────────
  {
    startMs: 220_000,
    text: "Your package is live. Notice the URL — it's your own domain, not packmetrix.com. Share it instantly on WhatsApp, Instagram, or Facebook.",
  },

  // ── 12. Live Pulse page ───────────────────────────────────────────────────
  {
    startMs: 232_000,
    text: "And this is what your clients see — the live countdown, the urgency bar, and every section beautifully rendered on the Pulse template.",
  },

  // ── 13. Back to dashboard ─────────────────────────────────────────────────
  {
    startMs: 260_000,
    text: "The new package appears in your workspace, ready to track views and leads in real time. This is Packmetrix.",
  },
];

// ── ElevenLabs TTS ────────────────────────────────────────────────────────────

async function synthesise(text: string, outPath: string): Promise<void> {
  const resp = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.82,
          style: 0.15,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`ElevenLabs error ${resp.status}: ${body}`);
  }

  const buffer = Buffer.from(await resp.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
}

// ── ffmpeg helpers ────────────────────────────────────────────────────────────

function ffmpegAvailable(): boolean {
  const r = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  return r.status === 0;
}

function buildFilterComplex(clips: Array<{ startMs: number; file: string }>): string {
  // Label each clip with adelay so it starts at the right moment in the timeline.
  // adelay accepts ms; "all=1" applies the same delay to all channels.
  const labels = clips.map((c, i) => {
    return `[${i + 1}:a]adelay=${c.startMs}:all=1[a${i}]`;
  });

  // amix blends all delayed streams into one track.
  const mixInputs = clips.map((_, i) => `[a${i}]`).join("");
  const mixFilter = `${mixInputs}amix=inputs=${clips.length}:duration=first:dropout_transition=0[aout]`;

  return [...labels, mixFilter].join(";");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!ffmpegAvailable()) {
    console.error(
      "\nffmpeg is not installed or not on PATH.\n" +
      "Install it:  brew install ffmpeg\n"
    );
    process.exit(1);
  }

  // ── Find the input video ──────────────────────────────────────────────────
  const videosDir = path.join(process.cwd(), "videos");
  let videoPath = process.argv[2];

  if (!videoPath) {
    const files = fs.readdirSync(videosDir)
      .filter((f) => f.endsWith(".webm") || f.endsWith(".mp4"))
      .map((f) => ({ f, mtime: fs.statSync(path.join(videosDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);

    if (!files.length) {
      console.error("\nNo video found in ./videos/. Run npm run record first.\n");
      process.exit(1);
    }
    videoPath = path.join(videosDir, files[0].f);
    console.log(`Using latest recording: ${path.basename(videoPath)}`);
  }

  // ── Temp directory for audio clips ───────────────────────────────────────
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "packmetrix-vo-"));
  console.log(`Temp dir: ${tmpDir}\n`);

  // ── Generate audio clips ──────────────────────────────────────────────────
  const clipsWithFiles: Array<{ startMs: number; file: string }> = [];

  for (let i = 0; i < CLIPS.length; i++) {
    const clip = CLIPS[i];
    const outFile = path.join(tmpDir, `clip_${String(i).padStart(3, "0")}.mp3`);
    const preview = clip.text.length > 60
      ? clip.text.slice(0, 57) + "…"
      : clip.text;

    process.stdout.write(`[${i + 1}/${CLIPS.length}] @${(clip.startMs / 1000).toFixed(1)}s  "${preview}"  `);

    await synthesise(clip.text, outFile);
    console.log("✓");

    clipsWithFiles.push({ startMs: clip.startMs, file: outFile });
  }

  // ── Merge with ffmpeg ─────────────────────────────────────────────────────
  const outputPath = path.join(videosDir, "demo-with-voiceover.mp4");
  const filterComplex = buildFilterComplex(clipsWithFiles);

  // Build ffmpeg args:
  //  -i video  -i clip0  -i clip1  ...
  //  -filter_complex "..."
  //  -map 0:v -map [aout]
  //  -c:v libx264 -c:a aac
  const ffArgs: string[] = [
    "-y",
    "-i", videoPath,
    ...clipsWithFiles.flatMap((c) => ["-i", c.file]),
    "-filter_complex", filterComplex,
    "-map", "0:v",
    "-map", "[aout]",
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "16",
    "-c:a", "aac",
    "-b:a", "256k",
    "-movflags", "+faststart",
    outputPath,
  ];

  console.log("\nMerging audio + video with ffmpeg…");
  execFileSync("ffmpeg", ffArgs, { stdio: "inherit" });

  // ── Clean up temp files ───────────────────────────────────────────────────
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(`\n✓ Done → ${outputPath}\n`);
  console.log("Timing note:");
  console.log("  If any narration is early/late, adjust the startMs values");
  console.log("  in e2e/voiceover.ts and re-run without re-recording the video.\n");
}

main().catch((err) => {
  console.error("Voice-over generation failed:", err.message ?? err);
  process.exit(1);
});
