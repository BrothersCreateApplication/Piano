/** Chụp các màn mới ở khổ điện thoại (390×844). */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9225;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const userDir = mkdtempSync(join(tmpdir(), "edge-mv2-"));

const child = spawn(EDGE, ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run", `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDir}`, "http://localhost:3000/"], { stdio: "ignore" });

async function main() {
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      target = list.find((t) => t.type === "page" && t.url.includes("localhost:3000"));
    } catch {}
    if (!target) await sleep(500);
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const shot = async (f) => { const m = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); writeFileSync(f, Buffer.from(m.result.data, "base64")); };

  await send("Runtime.enable", {}); await send("Page.enable", {});
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  for (let i = 0; i < 40; i++) { if (await ev("!!window.__practiceStore")) break; await sleep(500); }
  await sleep(500);

  const clickExact = (t) => `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)})?.click()`;

  const out = {};
  await shot("m-v2-theory-list.png");

  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Dấu thăng & dấu giáng'))?.click()`);
  await sleep(800);
  await shot("m-v2-theory-accidentals.png");

  await ev(clickExact("Hợp âm")); await sleep(400);
  await ev(clickExact("F")); await sleep(400);
  await shot("m-v2-chord-list.png");

  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Fmaj7'))?.click()`);
  await sleep(900);
  await shot("m-v2-chord-detail.png");

  // kiểm tra tràn ngang
  out.scrollWidth = await ev("document.documentElement.scrollWidth");
  out.clientWidth = await ev("document.documentElement.clientWidth");
  out.tranNgang = (await ev("document.documentElement.scrollWidth")) > (await ev("document.documentElement.clientWidth"));

  ws.close(); child.kill();
  console.log("KẾT QUẢ:", JSON.stringify(out));
  process.exit(0);
}
main().catch((e) => { console.error("LỖI:", e.message); child.kill(); process.exit(1); });
