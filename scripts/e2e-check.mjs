/**
 * Kiểm thử tương tác end-to-end qua Chrome DevTools Protocol.
 * Chạy Edge headless trỏ vào dev server, gọi trực tiếp store để xác nhận
 * logic bấm đúng/sai của cả 2 chế độ.
 *
 * Yêu cầu: dev server đang chạy ở http://localhost:3000
 * Chạy: node scripts/e2e-check.mjs
 */
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const URL = "http://localhost:3000/";
const PORT = 9222;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const userDir = mkdtempSync(join(tmpdir(), "edge-cdp-"));
const child = spawn(
  EDGE,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--no-first-run",
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

function run() {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
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
          const m = await send("Runtime.evaluate", {
            expression,
            awaitPromise: true,
            returnByValue: true,
          });
          if (m.result?.exceptionDetails) {
            throw new Error(JSON.stringify(m.result.exceptionDetails));
          }
          return m.result?.result?.value;
        };

        await send("Runtime.enable", {});

        // Chờ app mount + phơi store
        let ready = false;
        for (let i = 0; i < 40; i++) {
          if ((await evalExpr("!!window.__practiceStore")) === true) {
            ready = true;
            break;
          }
          await sleep(500);
        }
        if (!ready) throw new Error("Store chưa được phơi ra window.__practiceStore");

        const expr = `(async () => {
          const s = window.__practiceStore;
          const g = () => s.getState();
          const sleep = (ms) => new Promise(r => setTimeout(r, ms));
          const out = {};

          // ---- NOTE_READING ----
          g().setMode('NOTE_READING');
          g().nextChallenge();
          await sleep(60);
          const target1 = g().targetNotes[0];
          const wrong1 = target1 === 'C4' ? 'D4' : 'C4';
          g().pressNote(wrong1);
          out.noteWrong = { target: target1, pressed: wrong1, result: g().lastResult };

          g().nextChallenge();
          await sleep(60);
          const target2 = g().targetNotes[0];
          const beforeScore = g().score;
          g().pressNote(target2);
          out.noteCorrect = { target: target2, result: g().lastResult, scoreDelta: g().score - beforeScore };

          // ---- CHORDS ----
          await sleep(1000);
          g().setMode('CHORDS');
          g().nextChallenge();
          await sleep(60);
          const symbol = g().currentChordSymbol;
          const chord = g().targetNotes.slice();
          const before2 = g().score;
          chord.forEach(n => g().pressNote(n));
          await sleep(60);
          out.chord = { symbol, target: chord, result: g().lastResult, scoreDelta: g().score - before2 };

          return out;
        })()`;

        const result = await evalExpr(expr);
        ws.close();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    })();
  });
}

run()
  .then((r) => {
    console.log("KẾT QUẢ E2E:");
    console.log(JSON.stringify(r, null, 2));
    const ok =
      r?.noteWrong?.result === "wrong" &&
      r?.noteCorrect?.result === "correct" &&
      r?.noteCorrect?.scoreDelta === 1 &&
      r?.chord?.result === "correct" &&
      r?.chord?.scoreDelta === 1;
    console.log(ok ? "\n✅ TẤT CẢ PASS" : "\n❌ CÓ TEST FAIL");
    child.kill();
    process.exit(ok ? 0 : 1);
  })
  .catch((err) => {
    console.error("LỖI:", err.message);
    child.kill();
    process.exit(2);
  });
