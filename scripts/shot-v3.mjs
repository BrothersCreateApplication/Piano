/** Kiểm tra 3 thay đổi mới: bỏ luyện tập ở Hợp âm, sơ đồ phím, tách Đọc nốt. */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9230;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const userDir = mkdtempSync(join(tmpdir(), "edge-v3-"));

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
  if (!target) throw new Error("Không thấy CDP target");

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => {
    const m = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 300));
    return m.result?.result?.value;
  };
  const shot = async (f) => { const m = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(f, Buffer.from(m.result.data, "base64")); };

  await send("Runtime.enable", {}); await send("Page.enable", {});
  await send("Emulation.setDeviceMetricsOverride", { width: 1100, height: 1000, deviceScaleFactor: 2, mobile: false });
  for (let i = 0; i < 40; i++) { if (await ev("!!window.__practiceStore")) break; await sleep(500); }
  await sleep(500);

  const clickExact = (t) => `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)})?.click()`;
  const out = {};

  // ── 1) Tab Hợp âm: chỉ còn thư viện, KHÔNG còn nút "Luyện tập" ──
  await ev(clickExact("Hợp âm")); await sleep(400);
  out.conNutLuyenTapOHopAm = await ev(`!![...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Luyện tập')`);

  // mở chi tiết hợp âm để xem sơ đồ phím
  await ev(clickExact("F")); await sleep(300);
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Fmaj7'))?.click()`);
  await sleep(1000);
  out.coSoDoPhimOHopAm = await ev(`document.body.innerText.includes('Vị trí trên đàn')`);
  out.huongDanBam = await ev(`[...document.querySelectorAll('p')].map(p=>p.innerText).find(t => t.startsWith('Bấm cùng lúc')) || null`);
  await shot("v3-chord-detail.png");

  // ── 2) Tab Đọc nốt: có 2 phần, mặc định là Lý thuyết ──
  await ev(clickExact("Đọc nốt")); await sleep(1200);
  out.coHaiPhan = await ev(`['Lý thuyết','Luyện tập'].every(t => !![...document.querySelectorAll('button')].find(b => b.textContent.trim() === t))`);
  out.coKhoaSol = await ev(`document.body.innerText.includes('Khoá Sol')`);
  out.coKhoaFa = await ev(`document.body.innerText.includes('Khoá Fa')`);
  out.soKhuongNhac = await ev(`document.querySelectorAll('div[class*="min-h-\\\\[150px\\\\]"] svg').length`);
  await shot("v3-note-theory.png");

  // ── 3) Phần Luyện tập giữ nguyên ──
  await ev(clickExact("Luyện tập")); await sleep(1200);
  out.luyenTapCoBanPhim = await ev(`document.body.innerText.includes('Bàn phím')`);
  out.luyenTapCoKhuong = await ev(`!!document.querySelector('div[class*="min-h-\\\\[250px\\\\]"] svg')`);
  await shot("v3-note-practice.png");

  // ── 4) Lý thuyết: ví dụ có sơ đồ phím ──
  await ev(clickExact("Lý thuyết")); await sleep(400);
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Quãng'))?.click()`);
  await sleep(1200);
  out.soDoPhimTrongLyThuyet = await ev(`document.body.innerText.split('Vị trí trên đàn').length - 1`);
  await shot("v3-theory-interval.png");

  // cuộn xuống để thấy sơ đồ phím trong ví dụ lý thuyết
  await ev(`window.scrollTo(0, document.body.scrollHeight * 0.45)`);
  await sleep(600);
  await shot("v3-theory-keyguide.png");

  console.log("KẾT QUẢ:", JSON.stringify(out, null, 1));
  ws.close(); child.kill(); process.exit(0);
}
main().catch((e) => { console.error("LỖI:", e.message); child.kill(); process.exit(1); });
