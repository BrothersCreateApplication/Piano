/**
 * Store trung tâm (Zustand). `activeNotes` là nguồn sự thật duy nhất cho cả
 * bàn phím ảo, khuông nhạc (VexFlow) và MIDI.
 */
import { create } from "zustand";
import type { ChordFilter, Difficulty, Mode, PreviewStyle, Result } from "@/lib/types";
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

/** Timer của phần nghe thử trên bàn phím (rải từng nốt + xoá cuối). */
let previewTimers: ReturnType<typeof setTimeout>[] = [];

const ADVANCE_DELAY_MS = 900;

/** Nhịp rải mỗi nốt — phải khớp `i * 0.22` trong playArpeggio (pianoSampler.ts). */
const PREVIEW_STEP_MS = 220;
/** Thời gian giữ phím sáng sau khi phát xong. */
const PREVIEW_HOLD_MS = 1000;

function cancelAdvance() {
  if (advanceTimer) {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }
}

function cancelPreviewTimers() {
  previewTimers.forEach(clearTimeout);
  previewTimers = [];
}

interface PracticeState {
  // ── Bàn phím ──
  activeNotes: string[];
  pressNote: (note: string) => void;
  releaseNote: (note: string) => void;
  clearActive: () => void;

  // ── Nghe thử (chỉ để hiển thị, KHÔNG ảnh hưởng điểm số) ──
  previewNotes: string[];
  previewChord: (notes: string[], style: PreviewStyle) => void;
  cancelPreview: () => void;

  // ── Vòng lặp học ──
  mode: Mode;
  difficulty: Difficulty;
  chordFilter: ChordFilter;
  targetNotes: string[];
  currentChordSymbol: string | null;
  lastResult: Result;
  score: number;
  attempts: number;

  setMode: (m: Mode) => void;
  setDifficulty: (d: Difficulty) => void;
  setChordFilter: (f: ChordFilter) => void;
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

    previewNotes: [],

    /**
     * Nghe thử hợp âm: sáng phím trên bàn phím ảo theo đúng cách phát tiếng.
     * "block" sáng tất cả cùng lúc, "arpeggio" sáng lần lượt từng nốt.
     * Chỉ là hiển thị — không đi qua `pressNote` nên không chấm điểm.
     */
    previewChord: (notes, style) => {
      cancelPreviewTimers();
      if (notes.length === 0) {
        set({ previewNotes: [] });
        return;
      }

      if (style === "block") {
        set({ previewNotes: [...notes] });
        previewTimers.push(setTimeout(() => set({ previewNotes: [] }), PREVIEW_HOLD_MS));
        return;
      }

      set({ previewNotes: [] });
      notes.forEach((note, i) => {
        previewTimers.push(
          setTimeout(() => set((s) => ({ previewNotes: [...s.previewNotes, note] })), i * PREVIEW_STEP_MS),
        );
      });
      previewTimers.push(
        setTimeout(() => set({ previewNotes: [] }), (notes.length - 1) * PREVIEW_STEP_MS + PREVIEW_HOLD_MS),
      );
    },

    cancelPreview: () => {
      cancelPreviewTimers();
      set({ previewNotes: [] });
    },

    mode: "NOTE_READING",
    difficulty: "treble",
    // Mặc định luyện nhóm cơ bản (trưởng/thứ); chọn "Tất cả" để trộn như trước.
    chordFilter: "basic",
    targetNotes: [],
    currentChordSymbol: null,
    lastResult: "none",
    score: 0,
    attempts: 0,

    setMode: (m) => {
      cancelAdvance();
      cancelPreviewTimers();
      set({ mode: m, score: 0, attempts: 0, lastResult: "none", activeNotes: [], previewNotes: [] });
      get().nextChallenge();
    },

    setDifficulty: (d) => {
      cancelAdvance();
      cancelPreviewTimers();
      set({ difficulty: d, lastResult: "none", activeNotes: [], previewNotes: [] });
      get().nextChallenge();
    },

    setChordFilter: (f) => {
      cancelAdvance();
      cancelPreviewTimers();
      set({ chordFilter: f, lastResult: "none", activeNotes: [], previewNotes: [] });
      get().nextChallenge();
    },

    nextChallenge: () => {
      cancelAdvance();
      cancelPreviewTimers();
      const { mode, difficulty, chordFilter } = get();
      if (mode === "NOTE_READING") {
        set({
          targetNotes: [randomNote(difficulty)],
          currentChordSymbol: null,
          activeNotes: [],
          previewNotes: [],
          lastResult: "none",
        });
      } else {
        const symbol = randomChord(chordFilter);
        set({
          targetNotes: chordVoicing(symbol),
          currentChordSymbol: symbol,
          activeNotes: [],
          previewNotes: [],
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
