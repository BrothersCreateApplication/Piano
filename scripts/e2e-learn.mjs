/**
 * Kiểm thử luồng "Học lý thuyết" qua CDP + chụp ảnh màn hình.
 * Yêu cầu: dev server chạy ở http://localhost:3000
 */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const URL = "http://localhost:3000/";
const PORT = 9222;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const userDir = mkdtempSync(join(tmpdir(), "edge-learn-"));
const child = spawn(
  EDGE,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--no-first-run",
    "--hide-scrollbars",
    "--window-size=1100,1000",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDir}`,
    URL,
  ],
  { stdio: "ignore" },
);

async function getTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page" && t.url.includes("localhost:3000"));
      if (page?.webSocketDebuggerUrl) return page;
    } catch {
      /* chưa sẵn sàng */
    }
    await sleep(500);
  }
  throw new Error("Không tìm thấy CDP target");
}

async function main() {
  const target = await getTarget();
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
  const send = (method, params) =>
    new Promise((res) => {
      const i = ++id;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params }));
    });

  const evalExpr = async (expression) => {
    const m = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (m.result?.exceptionDetails) {
      throw new Error(JSON.stringify(m.result.exceptionDetails));
    }
    return m.result?.result?.value;
  };

  const shot = async (file) => {
    const m = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(file, Buffer.from(m.result.data, "base64"));
  };

  await send("Runtime.enable", {});
  await send("Page.enable", {});

  for (let i = 0; i < 40; i++) {
    if ((await evalExpr("!!window.__learnStore")) === true) break;
    await sleep(500);
  }

  // 1) Mở bài "Nốt khuông treble" → chụp
  await evalExpr(`window.__learnStore.getState().startLesson('treble')`);
  await sleep(500);
  await shot("learn-quiz.png");

  const q1 = await evalExpr(`(() => {
    const g = window.__learnStore.getState;
    const q = g().questions[0];
    return { kind: q.kind, staffNotes: q.staffNotes, options: q.options, answer: q.answer, total: g().questions.length };
  })()`);

  // 2) Trả lời SAI câu 1, rồi ĐÚNG hết phần còn lại → tổng kết
  const flow = await evalExpr(`(async () => {
    const s = window.__learnStore;
    const g = () => s.getState();
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const out = {};

    const q1 = g().questions[0];
    const wrongIdx = (q1.answer + 1) % q1.options.length;
    g().answer(wrongIdx);
    out.afterWrong = { selected: g().selected, correct: g().correctCount };

    g().next();
    for (let i = 1; i < g().questions.length; i++) {
      const q = g().questions[g().index];
      g().answer(q.answer);
      g().next();
      await sleep(10);
    }
    out.finished = g().finished;
    out.finalCorrect = g().correctCount;
    out.total = g().questions.length;
    out.progressTreble = g().progress['treble'];
    return out;
  })()`);
  await sleep(300);
  await shot("learn-summary.png");

  // 3) Mở bài "Quãng" (nốt tuần tự) → chụp
  await evalExpr(`window.__learnStore.getState().startLesson('intervals')`);
  await sleep(500);
  await shot("learn-interval.png");

  const iv = await evalExpr(`(() => {
    const q = window.__learnStore.getState().questions[0];
    return { kind: q.kind, staffNotes: q.staffNotes, sequential: q.sequential, prompt: q.prompt };
  })()`);

  // 4) Ôn tập tổng hợp
  const review = await evalExpr(`(() => {
    window.__learnStore.getState().startReview();
    const g = window.__learnStore.getState;
    return { count: g().questions.length, screen: g().screen };
  })()`);

  ws.close();

  const ok =
    q1.kind === "note" &&
    q1.total === 8 &&
    flow.afterWrong.selected !== null &&
    flow.afterWrong.correct === 0 &&
    flow.finished === true &&
    flow.finalCorrect === flow.total - 1 &&
    flow.progressTreble?.completed === true &&
    iv.kind === "interval" &&
    iv.sequential === true &&
    review.count === 12;

  console.log("CÂU 1 (đọc nốt):", JSON.stringify(q1));
  console.log("LUỒNG:", JSON.stringify(flow));
  console.log("QUÃNG:", JSON.stringify(iv));
  console.log("ÔN TẬP:", JSON.stringify(review));
  console.log(ok ? "\n✅ TẤT CẢ PASS" : "\n❌ CÓ TEST FAIL");

  child.kill();
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error("LỖI:", err.message);
  child.kill();
  process.exit(2);
});
