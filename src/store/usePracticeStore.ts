/**
 * Store trung tâm (Zustand). `activeNotes` là nguồn sự thật duy nhất cho cả
 * bàn phím ảo, khuông nhạc (VexFlow) và MIDI.
 */
import { create } from "zustand";
import type { Difficulty, Mode, Result } from "@/lib/types";
import {
  chordVoicing,
  nameToMidi,
  pitchClassSet,
  randomChord,
  randomNote,
  samePitchClasses,
} from "@/lib/music/theory";
import { playNote } from "@/lib/audio/pianoSampler";

/** Timer tự sang câu tiếp theo (module-level để không lưu vào state). */
let advanceTimer: ReturnType<typeof setTimeout> | null = null;

const ADVANCE_DELAY_MS = 900;

function cancelAdvance() {
  if (advanceTimer) {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }
}

interface PracticeState {
  // ── Bàn phím ──
  activeNotes: string[];
  pressNote: (note: string) => void;
  releaseNote: (note: string) => void;
  clearActive: () => void;

  // ── Vòng lặp học ──
  mode: Mode;
  difficulty: Difficulty;
  targetNotes: string[];
  currentChordSymbol: string | null;
  lastResult: Result;
  score: number;
  attempts: number;

  setMode: (m: Mode) => void;
  setDifficulty: (d: Difficulty) => void;
  nextChallenge: () => void;
  checkMatch: () => boolean;
}

export const usePracticeStore = create<PracticeState>((set, get) => {
  /** Người dùng bấm đúng → cộng điểm và tự sang câu mới. */
  function finishCorrect() {
    cancelAdvance();
    set((s) => ({ lastResult: "correct", score: s.score + 1, attempts: s.attempts + 1 }));
    advanceTimer = setTimeout(() => {
      get().nextChallenge();
    }, ADVANCE_DELAY_MS);
  }

  return {
    activeNotes: [],

    pressNote: (note) => {
      const st = get();
      if (!note) return;
      playNote(note);

      if (st.mode === "NOTE_READING") {
        // Đọc nốt: đơn âm — mỗi lần bấm thay thế nốt trước đó.
        set({ activeNotes: [note] });
        const target = st.targetNotes[0];
        const correct =
          target != null && nameToMidi(note) === nameToMidi(target);
        if (correct) finishCorrect();
        else set({ lastResult: "wrong", attempts: st.attempts + 1 });
        return;
      }

      // Hợp âm: tích lũy nhiều phím.
      if (st.activeNotes.includes(note)) return;
      const activeNotes = [...st.activeNotes, note];
      set({ activeNotes });

      const targetPcs = new Set(pitchClassSet(st.targetNotes));
      const activePcs = new Set(pitchClassSet(activeNotes));
      const hasStray = [...activePcs].some((pc) => !targetPcs.has(pc));

      if (hasStray) {
        set({ lastResult: "wrong", attempts: st.attempts + 1 });
      } else if (activePcs.size === targetPcs.size) {
        finishCorrect();
      } else {
        set({ lastResult: "none" });
      }
    },

    releaseNote: (note) => {
      set((s) => ({ activeNotes: s.activeNotes.filter((n) => n !== note) }));
    },

    clearActive: () => set({ activeNotes: [] }),

    mode: "NOTE_READING",
    difficulty: "treble",
    targetNotes: [],
    currentChordSymbol: null,
    lastResult: "none",
    score: 0,
    attempts: 0,

    setMode: (m) => {
      cancelAdvance();
      set({ mode: m, score: 0, attempts: 0, lastResult: "none", activeNotes: [] });
      get().nextChallenge();
    },

    setDifficulty: (d) => {
      cancelAdvance();
      set({ difficulty: d, lastResult: "none", activeNotes: [] });
      get().nextChallenge();
    },

    nextChallenge: () => {
      cancelAdvance();
      const { mode, difficulty } = get();
      if (mode === "NOTE_READING") {
        set({
          targetNotes: [randomNote(difficulty)],
          currentChordSymbol: null,
          activeNotes: [],
          lastResult: "none",
        });
      } else {
        const symbol = randomChord();
        set({
          targetNotes: chordVoicing(symbol),
          currentChordSymbol: symbol,
          activeNotes: [],
          lastResult: "none",
        });
      }
    },

    checkMatch: () => {
      const { mode, activeNotes, targetNotes } = get();
      if (targetNotes.length === 0) return false;
      if (mode === "NOTE_READING") {
        const last = activeNotes[activeNotes.length - 1];
        return last != null && nameToMidi(last) === nameToMidi(targetNotes[0]);
      }
      return samePitchClasses(activeNotes, targetNotes);
    },
  };
});

/** Selector tiện ích: pitch class (số) của các nốt mục tiêu (để tô màu phím). */
export function selectTargetPitchClasses(s: PracticeState): number[] {
  return pitchClassSet(s.targetNotes);
}
