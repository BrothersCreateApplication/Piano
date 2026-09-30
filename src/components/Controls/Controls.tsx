"use client";

import { Music2, SkipForward, Target, Trophy } from "lucide-react";
import { usePracticeStore } from "@/store/usePracticeStore";
import type { ChordFilter, Difficulty } from "@/lib/types";

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: "treble", label: "Khuông treble" },
  { key: "bass", label: "Khuông bass" },
  { key: "both", label: "Cả hai khuông" },
  { key: "accidentals", label: "Có thăng/giáng" },
  { key: "ledger", label: "Nốt ngoài khuông" },
];

const CHORD_FILTERS: { key: ChordFilter; label: string }[] = [
  { key: "basic", label: "Cơ bản (trưởng/thứ)" },
  { key: "advanced", label: "Nâng cao (7, sus, add…)" },
  { key: "all", label: "Tất cả" },
];

export default function Controls() {
  const mode = usePracticeStore((s) => s.mode);
  const difficulty = usePracticeStore((s) => s.difficulty);
  const setDifficulty = usePracticeStore((s) => s.setDifficulty);
  const chordFilter = usePracticeStore((s) => s.chordFilter);
  const setChordFilter = usePracticeStore((s) => s.setChordFilter);
  const nextChallenge = usePracticeStore((s) => s.nextChallenge);
  const score = usePracticeStore((s) => s.score);
  const attempts = usePracticeStore((s) => s.attempts);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {mode === "NOTE_READING" && (
        <label className="flex items-center gap-2 text-sm">
          <Target size={16} className="text-zinc-400" />
          <span className="text-zinc-500 dark:text-zinc-400">Độ khó</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {mode === "CHORDS" && (
        <label className="flex items-center gap-2 text-sm">
          <Music2 size={16} className="text-zinc-400" />
          <span className="text-zinc-500 dark:text-zinc-400">Loại hợp âm</span>
          <select
            value={chordFilter}
            onChange={(e) => setChordFilter(e.target.value as ChordFilter)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          >
            {CHORD_FILTERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        onClick={() => nextChallenge()}
        className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        <SkipForward size={16} />
        Câu tiếp
      </button>

      <div className="ml-auto flex items-center gap-2 rounded-md bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        <Trophy size={16} />
        {score}
        <span className="text-amber-500/80">/ {attempts}</span>
      </div>
    </div>
  );
}
