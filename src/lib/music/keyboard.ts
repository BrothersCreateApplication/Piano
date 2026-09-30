/** Dựng layout bàn phím đàn (mặc định 88 phím, A0..C8 = MIDI 21..108). */
import { midiToName } from "@/lib/music/theory";
import type { KeyDef } from "@/lib/types";

const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];

export const A0 = 21;
export const C8 = 108;

/** Bàn phím đầy đủ 88 phím. */
export function buildKeyboard(startMidi = A0, endMidi = C8): KeyDef[] {
  let whiteCount = 0;
  for (let m = startMidi; m <= endMidi; m++) {
    if (WHITE_PCS.includes(((m % 12) + 12) % 12)) whiteCount++;
  }

  const whiteW = 100 / whiteCount;
  const blackW = whiteW * 0.62;

  const keys: KeyDef[] = [];
  let whiteIndex = -1;

  for (let m = startMidi; m <= endMidi; m++) {
    const pc = ((m % 12) + 12) % 12;
    const isWhite = WHITE_PCS.includes(pc);
    const note = midiToName(m, true);

    if (isWhite) {
      whiteIndex++;
      keys.push({
        midi: m,
        note,
        white: true,
        leftPct: whiteIndex * whiteW,
        widthPct: whiteW,
        // Chỉ dán nhãn cho các nốt C cho đỡ rối mắt
        label: pc === 0 ? note : undefined,
      });
    } else {
      keys.push({
        midi: m,
        note,
        white: false,
        leftPct: (whiteIndex + 1) * whiteW - blackW / 2,
        widthPct: blackW,
      });
    }
  }

  return keys;
}

/** Map QWERTY → offset nửa cung so với một octave cơ sở (kiểu layout DAW phổ biến). */
export const QWERTY_MAP: Record<string, number> = {
  a: 0, // C
  w: 1, // C#
  s: 2, // D
  e: 3, // D#
  d: 4, // E
  f: 5, // F
  t: 6, // F#
  g: 7, // G
  y: 8, // G#
  h: 9, // A
  u: 10, // A#
  j: 11, // B
  k: 12, // C (octave trên)
  o: 13, // C#
  l: 14, // D
  p: 15, // D#
  ";": 16, // E
};
