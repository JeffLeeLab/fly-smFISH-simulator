// Renders dam-motion.html frame-by-frame (deterministic GSAP seek) into dam-motion.webm.
// Usage: node render-dam-video.mjs   (uses Playwright's bundled Chromium + ffmpeg;
// that ffmpeg build only decodes MJPEG and encodes VP8, hence JPEG frames -> WebM)
import { createRequire } from "module";
import { spawn, execSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
import os from "os";
import fs from "fs";

const require = createRequire(import.meta.url);
const root = execSync("npm root -g").toString().trim();
const { chromium } = require(path.join(root, "@playwright/cli/node_modules/playwright-core"));
const cache = path.join(os.homedir(), "Library/Caches/ms-playwright");
const ffDir = fs.readdirSync(cache).find((d) => d.startsWith("ffmpeg-"));
const FFMPEG = path.join(cache, ffDir, "ffmpeg-mac");

const here = path.dirname(fileURLToPath(import.meta.url));
const FPS = 30, W = 1920, H = 1080;

// Use whichever headless shell is already installed in the Playwright cache
const shellDir = fs.readdirSync(cache).filter((d) => d.startsWith("chromium_headless_shell-")).sort().pop();
const executablePath = path.join(cache, shellDir, "chrome-headless-shell-mac-arm64/chrome-headless-shell");
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(pathToFileURL(path.join(here, "dam-motion.html")).href + "?render");
await page.waitForFunction(() => window.seekTo);
const dur = await page.evaluate(() => window.DURATION);
const frames = Math.round(dur * FPS);

// This ffmpeg build has no pipe protocol, so frames are concatenated into one MJPEG
// stream on disk and read back through the file: protocol.
const stream = path.join(os.tmpdir(), "dam-frames.mjpeg");
const fd = fs.openSync(stream, "w");
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.seekTo(t), i / FPS);
  fs.writeSync(fd, await page.screenshot({ type: "jpeg", quality: 95 }));
}
fs.closeSync(fd);

const ff = spawn(FFMPEG, ["-y", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(FPS), "-i", "file:" + stream,
  "-c:v", "libvpx", "-b:v", "6M", "-qmin", "0", "-qmax", "20", "-crf", "4", "-pix_fmt", "yuv420p",
  "file:" + path.join(here, "dam-motion.webm")], { stdio: ["ignore", "inherit", "inherit"] });
const code = await new Promise((r) => ff.on("close", r));
fs.unlinkSync(stream);
if (code) { console.error("ffmpeg exited with", code); process.exit(1); }
await browser.close();
console.log(`rendered ${frames} frames (${dur.toFixed(2)} s)`);
