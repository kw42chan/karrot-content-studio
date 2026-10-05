import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const base = "http://localhost:3002";
const outDir = "/opt/cursor/artifacts/screenshots";
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();

async function shot(url, path, width, height, fullPage = false, waitFor) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  if (waitFor) {
    await page.waitForSelector(waitFor, { timeout: 30000 });
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path, fullPage });
  await page.close();
}

await shot(
  `${base}/demo/studio/posts`,
  `${outDir}/nav-desktop-posts-1440.png`,
  1440,
  900,
  false,
  ".studio-list-table",
);
await shot(
  `${base}/demo/studio`,
  `${outDir}/nav-desktop-editor-blog-1440.png`,
  1440,
  900,
  false,
  ".studio-channel-tab",
);
await shot(
  `${base}/demo/studio/instagram`,
  `${outDir}/nav-desktop-editor-instagram-1440.png`,
  1440,
  900,
  false,
  ".studio-channel-tab.active",
);
await shot(
  `${base}/demo/studio`,
  `${outDir}/nav-mobile-editor-390.png`,
  390,
  844,
  true,
  ".studio-mobile-segments",
);

await browser.close();
console.log("Saved screenshots to", outDir);
