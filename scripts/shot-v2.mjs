/** Chụp các màn mới (Lý thuyết, Thư viện hợp âm) + kiểm tra trắc nghiệm còn chạy. */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9223;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const userDir = mkdtempSync(join(tmpdir(), "edge-v2-"));

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
    } catch {}
    if (!target) await sleep(500);
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  const send = (method, params) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => {
    const m = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 400));
    return m.result?.result?.value;
  };
  const shot = async (file) => {
    const m = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(file, Buffer.from(m.result.data, "base64"));
  };

  await send("Runtime.enable", {});
  await send("Page.enable", {});
  await send("Emulation.setDeviceMetricsOverride", { width: 1100, height: 1050, deviceScaleFactor: 1, mobile: false });

  for (let i = 0; i < 40; i++) { if (await ev("!!window.__practiceStore")) break; await sleep(500); }
  await sleep(400);

  const clickExact = (t) => `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)})?.click()`;
  const clickHas = (t) => `[...document.querySelectorAll('button')].find(b => b.textContent.includes(${JSON.stringify(t)}))?.click()`;

  const out = {};

  // 1) Màn mặc định: danh sách Lý thuyết
  await shot("v2-theory-list.png");

  // 2) Chủ đề "Dấu thăng & dấu giáng"
  await ev(clickHas("Dấu thăng & dấu giáng"));
  await sleep(700);
  await shot("v2-theory-accidentals.png");
  out.accidentalSections = await ev(`document.querySelectorAll('section').length`);
  // kiểm tra có khuông nhạc (svg) trong ví dụ
  out.accidentalSvgs = await ev(`document.querySelectorAll('svg').length`);

  // 3) Thư viện hợp âm: chọn nốt gốc F
  await ev(clickExact("Hợp âm"));
  await sleep(400);
  await ev(clickExact("F"));
  await sleep(400);
  await shot("v2-chord-list.png");
  out.chordCards = await ev(`[...document.querySelectorAll('button')].filter(b => /^F/.test(b.textContent.trim()) && b.textContent.includes('ướng') || /^F/.test(b.textContent.trim()) && b.textContent.includes('ứ')).length`);

  // 4) Chi tiết hợp âm Fmaj7
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Fmaj7'))?.click()`);
  await sleep(700);
  await shot("v2-chord-detail.png");
  out.detailText = await ev(`document.body.innerText.split('\\n').slice(0,0) || ''`);
  out.inversionButtons = await ev(`[...document.querySelectorAll('button')].filter(b => /Thể gốc|Đảo/.test(b.textContent)).length`);
  // bấm đảo 1
  await ev(clickHas("Đảo 1"));
  await sleep(600);
  await shot("v2-chord-inversion.png");

  // 5) Trắc nghiệm vẫn chạy
  await ev(clickHas("Trắc nghiệm"));
  await sleep(300);
  await ev(`window.__learnStore.getState().startLesson('treble')`);
  await sleep(700);
  await shot("v2-quiz.png");
  out.quizQuestions = await ev(`window.__learnStore.getState().questions.length`);
  out.quizKind = await ev(`window.__learnStore.getState().questions[0].kind`);

  ws.close();
  console.log("KẾT QUẢ:", JSON.stringify(out, null, 1));
  child.kill();
  process.exit(0);
}

main().catch((e) => { console.error("LỖI:", e.message); child.kill(); process.exit(1); });
