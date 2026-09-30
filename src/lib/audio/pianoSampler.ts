/**
 * Audio engine dùng Tone.js Sampler với piano thật (Salamander Grand Piano).
 * Hotlink mẫu từ CDN của Tone.js → cần internet khi chạy.
 *
 * Tone.js được nạp ĐỘNG (dynamic import) để không bị đánh giá lúc SSR
 * (tránh lỗi "window is not defined"). Mọi hàm ở đây chỉ gọi từ phía client.
 *
 * ⚠️ Quirk: tên FILE dùng "s" thay cho "#" (Ds1.mp3) nhưng KEY là tên nốt thật ("D#1").
 */
type ToneModule = typeof import("tone");

const SALAMANDER_BASE = "https://tonejs.github.io/audio/salamander/";

const SALAMANDER_URLS: Record<string, string> = {
  A0: "A0.mp3",
  C1: "C1.mp3",
  "D#1": "Ds1.mp3",
  "F#1": "Fs1.mp3",
  A1: "A1.mp3",
  C2: "C2.mp3",
  "D#2": "Ds2.mp3",
  "F#2": "Fs2.mp3",
  A2: "A2.mp3",
  C3: "C3.mp3",
  "D#3": "Ds3.mp3",
  "F#3": "Fs3.mp3",
  A3: "A3.mp3",
  C4: "C4.mp3",
  "D#4": "Ds4.mp3",
  "F#4": "Fs4.mp3",
  A4: "A4.mp3",
  C5: "C5.mp3",
  "D#5": "Ds5.mp3",
  "F#5": "Fs5.mp3",
  A5: "A5.mp3",
  C6: "C6.mp3",
  "D#6": "Ds6.mp3",
  "F#6": "Fs6.mp3",
  A6: "A6.mp3",
  C7: "C7.mp3",
  "D#7": "Ds7.mp3",
  "F#7": "Fs7.mp3",
  A7: "A7.mp3",
  C8: "C8.mp3",
};

let tone: ToneModule | null = null;
let sampler: import("tone").Sampler | null = null;
let setupPromise: Promise<void> | null = null;
let loadPromise: Promise<void> | null = null;
let ready = false;

async function ensureTone(): Promise<ToneModule> {
  if (!tone) tone = await import("tone");
  return tone;
}

/** Tạo sampler (idempotent) và bắt đầu tải mẫu. Trả về khi mẫu tải xong. */
function ensureSampler(): Promise<void> {
  if (setupPromise) return setupPromise;
  setupPromise = (async () => {
    const T = await ensureTone();
    sampler = new T.Sampler({
      urls: SALAMANDER_URLS,
      baseUrl: SALAMANDER_BASE,
      release: 1,
      attack: 0.005,
    }).toDestination();
    loadPromise = T.loaded().then(() => {
      ready = true;
    });
    await loadPromise;
  })();
  return setupPromise;
}

/** Nạp trước sampler (không cần gesture người dùng). */
export function warmUpAudio(): void {
  void ensureSampler();
}

/**
 * Mở AudioContext (BẮT BUỘC gọi từ một cử chỉ người dùng) và đợi mẫu tải xong.
 */
export async function unlockAudio(): Promise<void> {
  await ensureSampler();
  const T = await ensureTone();
  await T.start();
}

export function isAudioReady(): boolean {
  return ready;
}

// ───────────────────────── Phát tiếng ─────────────────────────

/** Phát 1 nốt. */
export function playNote(note: string, duration = "8n", velocity = 0.9): void {
  if (!ready || !sampler) {
    void ensureSampler();
    return;
  }
  sampler.triggerAttackRelease(note, duration, undefined, velocity);
}

export type ChordPlayStyle = "block" | "strum";

/** Phát hợp âm: block (cùng lúc) hoặc strum (quét nhẹ vài ms). */
export function playChord(notes: string[], style: ChordPlayStyle = "block", duration = "1n"): void {
  if (!ready || !sampler || !tone || notes.length === 0) {
    void ensureSampler();
    return;
  }
  if (style === "block") {
    sampler.triggerAttackRelease(notes, duration);
    return;
  }
  const t0 = tone.now();
  notes.forEach((n, i) => sampler!.triggerAttackRelease(n, duration, t0 + i * 0.03));
}

/** Phát arpeggio (nốt rải lần lượt). */
export function playArpeggio(notes: string[], duration = "8n"): void {
  if (!ready || !sampler || !tone || notes.length === 0) {
    void ensureSampler();
    return;
  }
  const t0 = tone.now();
  notes.forEach((n, i) => sampler!.triggerAttackRelease(n, duration, t0 + i * 0.22));
}
