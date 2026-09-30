/**
 * Sinh câu hỏi trắc nghiệm cho từng dạng bài, dùng Tonal để tính nhạc lý.
 * Mỗi hàm trả về một `Question` với 4 đáp án đã trộn và chỉ số đáp án đúng.
 */
import { Note } from "tonal";
import {
  chordInfo,
  chordVoicing,
  pitchClass,
  pitchClassNumber,
  randomNote,
} from "@/lib/music/theory";
import type { Difficulty } from "@/lib/types";
import type { Question, QuestionKind } from "./types";

// ───────────────────────── Tiện ích ─────────────────────────

let seq = 0;
const uid = () => `q${(++seq).toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface BuildOpts {
  staffNotes?: string[];
  sequential?: boolean;
  explain: string;
}

/** Ghép câu hỏi: lấy `correct` + 3 nhiễu (khác correct, không trùng nhau) rồi trộn. */
function build(kind: QuestionKind, prompt: string, correct: string, pool: string[], opts: BuildOpts): Question {
  const seen = new Set([correct]);
  const distractors: string[] = [];
  for (const d of shuffle(pool)) {
    if (seen.has(d)) continue;
    seen.add(d);
    distractors.push(d);
    if (distractors.length === 3) break;
  }
  const raw = shuffle([
    { text: correct, ok: true },
    ...distractors.map((d) => ({ text: d, ok: false })),
  ]);
  return {
    id: uid(),
    kind,
    prompt,
    staffNotes: opts.staffNotes,
    sequential: opts.sequential,
    options: raw.map((o) => o.text),
    answer: raw.findIndex((o) => o.ok),
    explain: opts.explain,
  };
}

// ───────────────────────── Đọc nốt ─────────────────────────

const NATURAL = ["C", "D", "E", "F", "G", "A", "B"];
const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function genNoteQuestion(difficulty: Difficulty, allowAccidentals: boolean): Question {
  const note = randomNote(difficulty);
  const correct = pitchClass(note);
  const correctPc = pitchClassNumber(note);
  const pool = (allowAccidentals ? CHROMATIC : NATURAL).filter(
    (n) => pitchClassNumber(`${n}4`) !== correctPc,
  );
  const acc = /[#b]/.test(correct) ? " (có dấu hoá)" : "";
  return build("note", "Nốt trên khuông này là nốt gì?", correct, pool, {
    staffNotes: [note],
    explain: `Đây là nốt ${correct}${acc}.`,
  });
}

// ───────────────────────── Quãng ─────────────────────────

const INTERVAL_VN: Record<string, string> = {
  "2m": "Quãng 2 thứ",
  "2M": "Quãng 2 trưởng",
  "3m": "Quãng 3 thứ",
  "3M": "Quãng 3 trưởng",
  "4P": "Quãng 4 đúng",
  "5P": "Quãng 5 đúng",
  "6m": "Quãng 6 thứ",
  "6M": "Quãng 6 trưởng",
  "7m": "Quãng 7 thứ",
  "7M": "Quãng 7 trưởng",
  "8P": "Quãng 8 đúng (octave)",
};

export function genIntervalQuestion(): Question {
  const bases = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"];
  const base = pick(bases);
  const iv = pick(Object.keys(INTERVAL_VN));
  const top = Note.transpose(base, iv);
  if (!top) return genIntervalQuestion();

  const correct = INTERVAL_VN[iv];
  const pool = Object.keys(INTERVAL_VN)
    .filter((k) => k !== iv)
    .map((k) => INTERVAL_VN[k]);

  return build("interval", "Hai nốt này tạo thành quãng nào?", correct, pool, {
    staffNotes: [base, top],
    sequential: true,
    explain: `Từ ${pitchClass(base)} lên ${pitchClass(top)} là ${correct}.`,
  });
}

// ───────────────────────── Hợp âm ─────────────────────────

export function genChordQuestion(withSeventh: boolean): Question {
  const roots = ["C", "D", "E", "F", "G", "A", "B"];
  const quals = withSeventh ? ["", "m", "7", "maj7", "m7"] : ["", "m"];

  const root = pick(roots);
  const q = pick(quals);
  const symbol = `${root}${q}`;
  const notes = chordVoicing(symbol);
  const correct = symbol;

  const pool: string[] = [];
  for (const oq of quals) if (oq !== q) pool.push(`${root}${oq}`);
  for (const r of roots) if (r !== root) pool.push(`${r}${q}`);

  const info = chordInfo(symbol);
  return build("chord", "Hợp âm trên khuông là hợp âm gì?", correct, pool, {
    staffNotes: notes,
    explain: `${correct} gồm các nốt ${info.notes.join(" ")} (${info.name}).`,
  });
}

// ───────────────────────── Giọng & khoá nhạc ─────────────────────────

const MAJOR_KEYS = [
  { key: "C", vn: "Đô trưởng (C)", accidentals: 0, type: "none" },
  { key: "G", vn: "Sol trưởng (G)", accidentals: 1, type: "#" },
  { key: "D", vn: "Rê trưởng (D)", accidentals: 2, type: "#" },
  { key: "A", vn: "La trưởng (A)", accidentals: 3, type: "#" },
  { key: "E", vn: "Mi trưởng (E)", accidentals: 4, type: "#" },
  { key: "B", vn: "Si trưởng (B)", accidentals: 5, type: "#" },
  { key: "F", vn: "Fa trưởng (F)", accidentals: 1, type: "b" },
  { key: "Bb", vn: "Si giáng trưởng (Bb)", accidentals: 2, type: "b" },
  { key: "Eb", vn: "Mi giáng trưởng (Eb)", accidentals: 3, type: "b" },
  { key: "Ab", vn: "La giáng trưởng (Ab)", accidentals: 4, type: "b" },
] as const;

export function genKeyQuestion(): Question {
  const k = pick(MAJOR_KEYS.filter((x) => x.accidentals > 0));
  const symbol = k.type === "#" ? "dấu thăng" : "dấu giáng";

  if (pick([0, 1]) === 0) {
    // Giọng X có bao nhiêu dấu hoá?
    const correct = `${k.accidentals} ${symbol}`;
    const pool = [0, 1, 2, 3, 4, 5, 6, 7]
      .filter((n) => n !== k.accidentals)
      .map((n) => `${n} ${symbol}`);
    return build("key", `Giọng ${k.vn} có bao nhiêu ${symbol}?`, correct, pool, {
      explain: `Giọng ${k.vn} có ${k.accidentals} ${symbol}.`,
    });
  }

  // Giọng nào có đúng N dấu thăng? (chỉ hỏi về dấu thăng)
  const sharp = pick(MAJOR_KEYS.filter((x) => x.type === "#"));
  const correct = sharp.vn;
  const pool = MAJOR_KEYS.filter((x) => x.key !== sharp.key).map((x) => x.vn);
  return build("key", `Giọng nào có đúng ${sharp.accidentals} dấu thăng?`, correct, pool, {
    explain: `${sharp.vn} có ${sharp.accidentals} dấu thăng.`,
  });
}

// ───────────────────────── Số chỉ nhịp ─────────────────────────

export function genTimeSigQuestion(): Question {
  if (pick([0, 1]) === 0) {
    const meters = [
      { num: 2, den: 4, beats: 2 },
      { num: 3, den: 4, beats: 3 },
      { num: 4, den: 4, beats: 4 },
    ];
    const m = pick(meters);
    const correct = `${m.beats} phách`;
    const pool = [2, 3, 4, 5, 6].filter((b) => b !== m.beats).map((b) => `${b} phách`);
    return build("timesig", `Nhịp ${m.num}/${m.den} có mấy phách trong mỗi ô nhịp?`, correct, pool, {
      explain: `Số trên là ${m.num} → mỗi ô nhịp có ${m.beats} phách.`,
    });
  }

  const values = [
    { name: "nốt tròn", beats: 4 },
    { name: "nốt trắng", beats: 2 },
    { name: "nốt đen", beats: 1 },
  ];
  const v = pick(values);
  const correct = `${v.beats} phách`;
  const pool = [1, 2, 3, 4].filter((b) => b !== v.beats).map((b) => `${b} phách`);
  return build("timesig", `Trong nhịp 4/4, một ${v.name} tương đương mấy phách?`, correct, pool, {
    explain: `Nhịp 4/4: nốt tròn = 4 phách, nốt trắng = 2, nốt đen = 1. ${v.name} = ${v.beats} phách.`,
  });
}
