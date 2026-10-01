/**
 * Kiểm tra chế độ TỐI ở khổ điện thoại (390×844).
 *
 * Lưu ý: `Emulation.setDeviceMetricsOverride` KHÔNG mô phỏng `prefers-color-scheme`
 * — phải gọi thêm `Emulation.setEmulatedMedia`. Đây là lý do các script trước
 * không phát hiện ra nốt nhạc bị chìm vào nền đen.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9232;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const userDir = mkdtempSync(join(tmpdir(), "edge-dark-"));

const child = spawn(EDGE, ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run", `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDir}`, "http://localhost:3000/"], { stdio: "ignore" });

/** Selector khớp container khuông nhạc (Tailwind escape `[` `]` trong tên class). */
const CHART150 = 'div[class*="min-h-\\[150px\\]"]';
const CHART250 = 'div[class*="min-h-\\[250px\\]"]';

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
    if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 400));
    return m.result?.result?.value;
  };
  const shot = async (f) => { const m = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(f, Buffer.from(m.result.data, "base64")); };

  await send("Runtime.enable", {}); await send("Page.enable", {});
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  // ⬇️ Điểm mấu chốt: giả lập "điện thoại đang bật nền tối".
  await send("Emulation.setEmulatedMedia", { media: "", features: [{ name: "prefers-color-scheme", value: "dark" }] });

  for (let i = 0; i < 40; i++) { if (await ev("!!window.__practiceStore")) break; await sleep(500); }
  await sleep(800);

  const clickExact = (t) => `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)})?.click()`;

  // ── Helper đo tương phản, cài một lần vào trang ──
  // Màu nền đi ngược lên tổ tiên gần nhất có nền đục; màu nét lấy từ SVG.
  // Dùng canvas để chuẩn hoá màu: Tailwind v4 trả `lab(...)`, không phải `rgb(...)`.
  await ev(`(() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const toRgb = (css) => {
      if (!css || css === 'transparent' || css === 'none') return null;
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000';           // nền lót: bỏ qua alpha, chỉ cần màu hiển thị
      ctx.fillStyle = css;
      if (ctx.fillStyle === '#000' && !/^(#000|black|rgb\\(0, ?0, ?0\\))$/i.test(css)) return null;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return { r: d[0], g: d[1], b: d[2] };
    };
    const lum = (c) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    window.__doTuongPhan = (el) => {
      if (!el) return { loi: 'không thấy phần tử' };
      const svg = el.querySelector('svg');
      if (!svg) return { loi: 'không thấy svg' };
      let bgCss = null, node = el;
      while (node) {
        const c = getComputedStyle(node).backgroundColor;
        if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') { bgCss = c; break; }
        node = node.parentElement;
      }
      const net = svg.querySelector('path, rect');
      const strokeCss = net ? (net.getAttribute('stroke') || getComputedStyle(net).stroke) : null;
      const B = toRgb(bgCss), S = toRgb(strokeCss);
      if (!B || !S) return { nenCss: bgCss, netCss: strokeCss, loi: 'không đọc được màu' };
      const c = (Math.max(lum(S), lum(B)) + 0.05) / (Math.min(lum(S), lum(B)) + 0.05);
      return {
        nenCss: bgCss,
        netCss: strokeCss,
        nenRgb: B, netRgb: S,
        tuongPhan: Math.round(c * 100) / 100,
        duDeThay: c >= 4.5,
      };
    };
    return true;
  })()`);

  const doKhuong = (sel, index = 0) =>
    ev(`window.__doTuongPhan([...document.querySelectorAll(${JSON.stringify(sel)})][${index}])`);

  const out = {};
  out.darkThatChua = await ev(`matchMedia('(prefers-color-scheme: dark)').matches`);
  out.nenBody = await ev(`getComputedStyle(document.body).backgroundColor`);

  // ── 1) Đọc nốt > Lý thuyết: 2 khuông Sol/Fa ──
  await ev(clickExact("Đọc nốt")); await sleep(1800);
  out.soKhuongDocNot = await ev(`document.querySelectorAll(${JSON.stringify(CHART150)}).length`);
  out.khuongSol = await doKhuong(CHART150, 0);
  await ev(`document.querySelectorAll(${JSON.stringify(CHART150)})[0].scrollIntoView({block:'center'})`);
  await sleep(700);
  await shot("dark-note-treble.png");

  out.khuongFa = await doKhuong(CHART150, 1);
  await ev(`document.querySelectorAll(${JSON.stringify(CHART150)})[1].scrollIntoView({block:'center'})`);
  await sleep(700);
  await shot("dark-note-bass.png");

  // ── 2) Đọc nốt > Luyện tập: grand staff ──
  await ev(clickExact("Luyện tập")); await sleep(1800);
  out.khuongLuyenTap = await doKhuong(CHART250, 0);
  await ev(`document.querySelector(${JSON.stringify(CHART250)}).scrollIntoView({block:'center'})`);
  await sleep(700);
  await shot("dark-note-practice.png");

  // ── 3) Hợp âm > chi tiết: grand staff + sơ đồ phím ──
  await ev(clickExact("Hợp âm")); await sleep(500);
  await ev(clickExact("F")); await sleep(400);
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Fmaj7'))?.click()`);
  await sleep(1800);
  out.khuongHopAm = await doKhuong(CHART250, 0);
  await ev(`document.querySelector(${JSON.stringify(CHART250)}).scrollIntoView({block:'center'})`);
  await sleep(700);
  await shot("dark-chord-staff.png");

  // sơ đồ phím trong chi tiết hợp âm — kiểm tra phím tô sáng có nổi không
  out.soDoPhimHopAm = await ev(`(() => {
    const p = [...document.querySelectorAll('p')].find(p => p.innerText.startsWith('Bấm cùng lúc'));
    if (!p) return null;
    const outer = p.parentElement;                            // khối "Vị trí trên đàn"
    const khung = outer.querySelector('div[class*="bg-zinc-800"]');
    const lit = outer.querySelector('div[class*="bg-emerald"]');
    const white = outer.querySelector('div[class*="bg-white"]');
    const mauNen = (el) => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 1;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle ='#ff00ff'; ctx.fillStyle = getComputedStyle(el).backgroundColor; ctx.fillRect(0,0,1,1);
      const d = ctx.getImageData(0,0,1,1).data; return [d[0], d[1], d[2]];
    };
    return {
      coKhung: !!khung,
      nenKhung: khung ? mauNen(khung) : null,
      soPhimSang: outer.querySelectorAll('div[class*="bg-emerald"]').length,
      soPhimTrang: outer.querySelectorAll('div[class*="bg-white"]').length,
      phimTrangNen: white ? mauNen(white) : null,
      phimSangNen: lit ? mauNen(lit) : null,
    };
  })()`);
  await ev(`[...document.querySelectorAll('p')].find(p => p.innerText.startsWith('Bấm cùng lúc'))?.scrollIntoView({block:'center'})`);
  await sleep(700);
  await shot("dark-chord-keyguide.png");

  // ── 4) Lý thuyết: ví dụ có grand staff + sơ đồ phím ──
  await ev(clickExact("Lý thuyết")); await sleep(500);
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Quãng'))?.click()`);
  await sleep(1800);
  out.khuongLyThuyet = await doKhuong(CHART250, 0);
  out.soKhuongLyThuyet = await ev(`document.querySelectorAll(${JSON.stringify(CHART250)}).length`);
  out.nenCacKhuongLyThuyet = await ev(`[...document.querySelectorAll(${JSON.stringify(CHART250)})].map(el => {
    let n = el; while (n) { const c = getComputedStyle(n).backgroundColor;
      if (c && c !== 'rgba(0, 0, 0, 0)') return c; n = n.parentElement; } return null;
  })`);
  await ev(`document.querySelector(${JSON.stringify(CHART250)}).scrollIntoView({block:'center'})`);
  await sleep(700);
  await shot("dark-theory.png");

  out.tranNgang = (await ev("document.documentElement.scrollWidth")) > (await ev("document.documentElement.clientWidth"));

  console.log("KẾT QUẢ:", JSON.stringify(out, null, 1));

  // Kết luận gọn
  const khuong = ["khuongSol", "khuongFa", "khuongLuyenTap", "khuongHopAm", "khuongLyThuyet"];
  const hong = khuong.filter((k) => out[k] && out[k].duDeThay === false);
  console.log(hong.length === 0
    ? "\n✅ TẤT CẢ khuông nhạc đều đủ tương phản ở dark mode."
    : `\n❌ CÒN CHÌM: ${hong.join(", ")}`);

  ws.close(); child.kill(); process.exit(0);
}
main().catch((e) => { console.error("LỖI:", e.message); child.kill(); process.exit(1); });
