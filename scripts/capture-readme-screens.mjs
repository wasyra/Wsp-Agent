/**
 * Capturas para README: requiere el panel accesible (p. ej. docker compose up).
 * Uso: npm install && npx playwright install chromium && npm run screenshots:readme
 *
 * PANEL_URL por defecto http://127.0.0.1:3001 (puerto host de WEB_PUBLISH_PORT).
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const outDir = join(repoRoot, "docs", "readme-screenshots");
const base = (process.env.PANEL_URL || "http://127.0.0.1:3001").replace(/\/$/, "");

async function snap(page, path, file) {
  const url = `${base}${path}`;
  await page.goto(url, { waitUntil: "load", timeout: 120_000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(outDir, file), fullPage: true });
  console.log("ok", file, url);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1360, height: 900 },
  });
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem("wsp_agent_ui_tour_v1_done", "1");
    } catch {
      /* ignore */
    }
  });
  const page = await context.newPage();

  try {
    await snap(page, "/", "01-inicio.png");
    await snap(page, "/chats", "02-chats.png");
    await snap(page, "/conversations", "03-conversaciones.png");
    await snap(page, "/leads", "04-leads.png");
    await snap(page, "/configuracion", "05-configuracion-general.png");

    await page.goto(`${base}/configuracion`, { waitUntil: "load", timeout: 120_000 });
    await page.waitForTimeout(1500);
    await page.locator("#tab-agent").click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(outDir, "06-configuracion-agente.png"), fullPage: true });
    console.log("ok", "06-configuracion-agente.png", `${base}/configuracion (pestaña agente)`);

    await snap(page, "/estado", "07-estado.png");
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
