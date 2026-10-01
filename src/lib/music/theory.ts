/**
 * Wrapper nhạc lý quanh Tonal.js v6.
 * Tất cả logic interval / scale / chord / mapping nốt đều đi qua đây.
 */
import { Chord, Note, Scale } from "tonal";
import type { ChordFilter, ChordGroup, Difficulty } from "@/lib/types";

/** Các pitch class của phím trắng (C D E F G A B). */
const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];

export interface ChordQuality {
  /** Tên loại hợp âm bằng tiếng Việt. */
  label: string;
  /** Hậu tố ký hiệu hợp âm (rỗng = hợp âm trưởng). */
  suffix: string;
  /** "basic" = 2 hợp âm nền tảng (trưởng/thứ); "advanced" = phần còn lại. */
  group: ChordGroup;
}

/**
 * Danh sách loại hợp âm dùng cho cả chế độ luyện tập lẫn bài trắc nghiệm,
 * ánh xạ sang ký hiệu tonal. `group` là nguồn sự thật duy nhất cho việc
 * phân loại cơ bản / nâng cao.
 */
export const CHORD_QUALITIES = [
  { label: "Trưởng", suffix: "", group: "basic" },
  { label: "Thứ", suffix: "m", group: "basic" },
  { label: "Át 7", suffix: "7", group: "advanced" },
  { label: "Trưởng 7", suffix: "maj7", group: "advanced" },
  { label: "Thứ 7", suffix: "m7", group: "advanced" },
  { label: "Nửa giảm", suffix: "m7b5", group: "advanced" },
  { label: "Giảm", suffix: "dim", group: "advanced" },
  { label: "Tăng", suffix: "aug", group: "advanced" },
  { label: "Sus4", suffix: "sus4", group: "advanced" },
  { label: "Add9", suffix: "add9", group: "advanced" },
] as const satisfies readonly ChordQuality[];

/** Các loại hợp âm thuộc một nhóm (hoặc tất cả). Không bao giờ trả về mảng rỗng. */
function qualitiesOf(group: ChordFilter): readonly ChordQuality[] {
  const pool = group === "all" ? CHORD_QUALITIES : CHORD_QUALITIES.filter((q) => q.group === group);
  return pool.length > 0 ? pool : CHORD_QUALITIES;
}

/** Hậu tố của các loại hợp âm trong một nhóm — dùng chung cho luyện tập & trắc nghiệm. */
export function chordSuffixes(group: ChordFilter): string[] {
  return qualitiesOf(group).map((q) => q.suffix);
}

const ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

// ───────────────────────── Mapping nốt / MIDI ─────────────────────────

/** MIDI number → tên nốt (mặc định dùng dấu thăng). */
export function midiToName(midi: number, preferSharp = true): string {
  return (preferSharp ? Note.fromMidiSharps(midi) : Note.fromMidi(midi)) ?? "C4";
}

/** Tên nốt (kèm octave) → MIDI number, null nếu thiếu octave. */
export function nameToMidi(note: string): number | null {
  return Note.midi(note);
}

/** Bỏ octave, chỉ giữ pitch class. "C#4" → "C#". */
export function pitchClass(note: string): string {
  return note.replace(/-?\d+$/, "");
}

/** Octave của nốt. "C#4" → 4. */
export function octaveOf(note: string): number {
  const m = note.match(/-?\d+$/);
  return m ? parseInt(m[0], 10) : 4;
}

/** Chuyển tên nốt sang định dạng key của VexFlow. "C#4" → "c#/4", "Eb4" → "eb/4". */
export function toVexKey(note: string): string {
  const m = note.match(/^([A-Ga-g])(#{1,2}|b{1,2})?(-?\d+)$/);
  if (!m) return note.toLowerCase();
  const [, letter, acc, oct] = m;
  return `${letter.toLowerCase()}${acc ?? ""}/${oct}`;
}

/** Nốt nằm trên khuông treble? (từ middle C trở lên). */
export function isTreble(note: string): boolean {
  const midi = nameToMidi(note);
  return midi == null ? true : midi >= 60;
}

function isWhiteMidi(midi: number): boolean {
  return WHITE_PCS.includes(((midi % 12) + 12) % 12);
}

// ───────────────────────── Sinh nốt / hợp âm ngẫu nhiên ─────────────────────────

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Sinh một nốt ngẫu nhiên theo độ khó.
 * - treble/bass: giới hạn trong khuông, chỉ phím trắng.
 * - both: cả hai khuông.
 * - accidentals: cho phép nốt thăng/giáng.
 * - ledger: mở rộng ngoài khuông (ledger lines), cho phép nốt thăng/giáng.
 */
export function randomNote(difficulty: Difficulty): string {
  const chromatic = difficulty === "accidentals" || difficulty === "ledger";
  let range: [number, number];

  switch (difficulty) {
    case "treble":
      range = [60, 79]; // C4..G5
      break;
    case "bass":
      range = [43, 60]; // G2..C4
      break;
    case "both":
      range = Math.random() < 0.5 ? [60, 79] : [43, 60];
      break;
    case "accidentals":
      range = Math.random() < 0.5 ? [60, 79] : [43, 60];
      break;
    case "ledger":
      range = Math.random() < 0.5 ? [57, 86] : [34, 64];
      break;
  }

  let midi: number;
  if (chromatic) {
    midi = randInt(range[0], range[1]);
  } else {
    const whites: number[] = [];
    for (let m = range[0]; m <= range[1]; m++) if (isWhiteMidi(m)) whites.push(m);
    midi = pick(whites);
  }
  const preferSharp = !chromatic || Math.random() < 0.5;
  return midiToName(midi, preferSharp);
}

/** Sinh một ký hiệu hợp âm ngẫu nhiên trong một nhóm, ví dụ "Cmaj7", "F#m", "Bb7". */
export function randomChord(group: ChordFilter = "all"): string {
  const root = pick(ROOTS);
  const quality = pick(chordSuffixes(group));
  return `${root}${quality}`;
}

// ───────────────────────── Tên tiếng Việt ─────────────────────────

/** Tên nốt theo tiếng Việt (gọi tên Đô Rê Mi). */
const VN_NOTE_NAMES: Record<string, string> = {
  C: "Đô",
  D: "Rê",
  E: "Mi",
  F: "Fa",
  G: "Sol",
  A: "La",
  B: "Si",
};

const VN_ACCIDENTALS: Record<string, string> = {
  "#": " thăng",
  "##": " thăng kép",
  b: " giáng",
  bb: " giáng kép",
};

/**
 * Tên loại hợp âm tiếng Việt, suy ra từ CHORD_QUALITIES để hai bảng không lệch nhau.
 * "" (không hậu tố) là hợp âm trưởng.
 */
const VN_QUALITY: Record<string, string> = Object.fromEntries(
  CHORD_QUALITIES.map((q) => [q.suffix, q.label.toLowerCase()]),
);

/** "F#4" → "Pha thăng", "Bb" → "Si giáng". Không đọc được thì trả lại nguyên chuỗi. */
export function vnNoteName(note: string): string {
  const m = note.match(/^([A-Ga-g])(#{1,2}|b{1,2})?/);
  if (!m) return note;
  const [, letter, accidental] = m;
  const base = VN_NOTE_NAMES[letter.toUpperCase()] ?? letter;
  return accidental ? `${base}${VN_ACCIDENTALS[accidental] ?? ""}` : base;
}

/** Ký hiệu hợp âm: gốc + hậu tố + (tuỳ chọn) nốt nền sau dấu "/". */
const CHORD_SYMBOL_RE = /^([A-Ga-g](?:#{1,2}|b{1,2})?)([^/]*)(?:\/([A-Ga-g](?:#{1,2}|b{1,2})?))?$/;

/**
 * Tên hợp âm tiếng Việt: "Cmaj7" → "Đô trưởng 7", "F#m7b5" → "Pha thăng nửa giảm",
 * "D7/F#" → "Rê át 7 / Pha thăng". Hậu tố lạ thì ghép thẳng hậu tố vào tên nốt;
 * ký hiệu không đọc được thì trả lại nguyên văn.
 */
export function chordNameVn(symbol: string): string {
  const m = symbol.trim().match(CHORD_SYMBOL_RE);
  if (!m) return symbol;
  const [, root, suffix, bass] = m;
  const quality = VN_QUALITY[suffix] ?? suffix;
  const name = `${vnNoteName(root)} ${quality}`.trim();
  return bass ? `${name} / ${vnNoteName(bass)}` : name;
}

// ───────────────────────── Hợp âm ─────────────────────────

/**
 * Các nốt của hợp âm, đã gắn octave và xếp tăng dần quanh octave cơ sở.
 * Chord.get() trả về pitch class (không octave) → hàm này gắn octave.
 */
export function chordVoicing(symbol: string, baseOctave = 4): string[] {
  const chord = Chord.get(symbol);
  if (!chord || chord.empty || chord.notes.length === 0) return [];

  const result: string[] = [];
  let prevMidi = -Infinity;

  for (const pc of chord.notes) {
    let midi = Note.midi(`${pc}${baseOctave}`);
    if (midi == null) {
      // ví dụ pitch class có double accidental không ghép được → bỏ qua
      midi = Note.midi(pc);
      if (midi == null) continue;
    }
    while (midi <= prevMidi) midi += 12;
    prevMidi = midi;
    const oct = Math.floor(midi / 12) - 1;
    result.push(`${pc}${oct}`);
  }
  return result;
}

/** Nâng một nốt lên đúng 1 quãng tám, giữ nguyên cách viết. "C4" → "C5", "Bb3" → "Bb4". */
function raiseOctave(note: string): string {
  const m = note.match(/^([A-Ga-g](?:#{1,2}|b{1,2})?)(-?\d+)$/);
  if (!m) return note;
  return `${m[1]}${parseInt(m[2], 10) + 1}`;
}

/**
 * Các thể đảo của hợp âm. Phần tử [0] là thể gốc, [1] là đảo 1, …
 * Mỗi thể đảo giữ nguyên cách viết tên nốt (không đổi giáng thành thăng).
 */
export function chordInversions(symbol: string, baseOctave = 4): string[][] {
  const notes = chordVoicing(symbol, baseOctave);
  if (notes.length < 2) return notes.length ? [notes] : [];

  const result: string[][] = [];
  for (let i = 0; i < notes.length; i++) {
    result.push([...notes.slice(i), ...notes.slice(0, i).map(raiseOctave)]);
  }
  return result;
}

/** Thông tin hiển thị của hợp âm. */
export interface ChordInfo {
  symbol: string;
  name: string;
  notes: string[]; // pitch classes
  intervals: string[];
}

export function chordInfo(symbol: string): ChordInfo {
  const c = Chord.get(symbol);
  return {
    symbol: c.symbol || symbol,
    name: c.name || symbol,
    notes: c.notes,
    intervals: c.intervals,
  };
}

/**
 * Nhận diện tên hợp âm (và thể đảo) từ tập nốt.
 * Ví dụ ['C4','E4','G4'] → ['C']; ['F#','A','C','D'] → ['D7/F#'].
 */
export function detectChord(notes: string[]): string[] {
  if (notes.length < 2) return [];
  const pcs = notes.map(pitchClass);
  return Chord.detect(pcs);
}

// ───────────────────────── Scale (tiện ích mở rộng) ─────────────────────────

/** Bậc của scale (1-based) trong một giọng. */
export function scaleDegrees(scale: string, degrees: number[]): string[] {
  const deg = Scale.degrees(scale);
  return degrees.map((d) => deg(d)).filter((n): n is string => n != null);
}

// ───────────────────────── So khớp ─────────────────────────

/**
 * Pitch class dạng số (0-11) của một nốt. Dùng số thay vì chuỗi để tránh lệch
 * enharmonic: nốt giáng ("Ab") và nốt thăng ("G#") cùng phím phải khớp nhau.
 */
export function pitchClassNumber(note: string): number | null {
  const m = nameToMidi(note);
  return m == null ? null : ((m % 12) + 12) % 12;
}

/** Tập pitch class (số) của một danh sách nốt — đã sắp xếp, không trùng. */
export function pitchClassSet(notes: string[]): number[] {
  const set = new Set<number>();
  for (const n of notes) {
    const pc = pitchClassNumber(n);
    if (pc != null) set.add(pc);
  }
  return Array.from(set).sort((a, b) => a - b);
}

/** Hai tập nốt có cùng pitch class không (bỏ qua octave/đảo/enharmonic spelling). */
export function samePitchClasses(a: string[], b: string[]): boolean {
  const sa = pitchClassSet(a);
  const sb = pitchClassSet(b);
  return sa.length === sb.length && sa.every((n, i) => n === sb[i]);
}
