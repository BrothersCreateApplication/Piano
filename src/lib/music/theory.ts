/**
 * Wrapper nhạc lý quanh Tonal.js v6.
 * Tất cả logic interval / scale / chord / mapping nốt đều đi qua đây.
 */
import { Chord, Note, Scale } from "tonal";
import type { Difficulty } from "@/lib/types";

/** Các pitch class của phím trắng (C D E F G A B). */
const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];

/** Danh sách loại hợp âm dùng cho chế độ luyện tập, ánh xạ sang ký hiệu tonal. */
export const CHORD_QUALITIES = [
  { label: "Trưởng", suffix: "" },
  { label: "Thứ", suffix: "m" },
  { label: "Át 7", suffix: "7" },
  { label: "Trưởng 7", suffix: "maj7" },
  { label: "Thứ 7", suffix: "m7" },
  { label: "Nửa giảm", suffix: "m7b5" },
  { label: "Giảm", suffix: "dim" },
  { label: "Tăng", suffix: "aug" },
  { label: "Sus4", suffix: "sus4" },
  { label: "Add9", suffix: "add9" },
] as const;

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

/** Sinh một ký hiệu hợp âm ngẫu nhiên, ví dụ "Cmaj7", "F#m", "Bb7". */
export function randomChord(): string {
  const root = pick(ROOTS);
  const quality = pick(CHORD_QUALITIES).suffix;
  return `${root}${quality}`;
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
