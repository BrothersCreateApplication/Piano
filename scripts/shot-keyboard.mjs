/** Chụp bàn phím ở viewport điện thoại. Yêu cầu dev server ở localhost:3000. */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9222;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const userDir = mkdtempSync(join(tmpdir(), "edge-mob-"));

const child = spawn(
  EDGE,
  ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run", `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDir}`, "http://localhost:3000/"],
  { stdio: "ignore" },
);

async function main() {
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      target = list.find((t) => t.type === "page" && t.url.includes("localhost:3000"));
    } catch {
      /* chờ */
    }
    if (!target) await sleep(500);
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  };
  const send = (method, params) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

  await send("Runtime.enable", {});
  await send("Page.enable", {});
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

  for (let i = 0; i < 40; i++) {
    if (await ev("!!window.__practiceStore")) break;
    await sleep(500);
  }

  // Chuyển sang tab "Đọc nốt" và tạo câu hỏi để thấy nốt mục tiêu
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Đọc nốt')?.click()`);
  await sleep(300);
  await ev(`window.__practiceStore.getState().setDifficulty('bass')`);
  await sleep(800);

  const m = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync("mobile-keyboard.png", Buffer.from(m.result.data, "base64"));
  ws.close();
  console.log("đã lưu mobile-keyboard.png");
  child.kill();
  process.exit(0);
}

main().catch((e) => {
  console.error(e.message);
  child.kill();
  process.exit(1);
});
