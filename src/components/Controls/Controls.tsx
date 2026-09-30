"use client";

import { SkipForward, Target, Trophy } from "lucide-react";
import { usePracticeStore } from "@/store/usePracticeStore";
import type { Difficulty } from "@/lib/types";

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: "treble", label: "Khuông treble" },
  { key: "bass", label: "Khuông bass" },
  { key: "both", label: "Cả hai khuông" },
  { key: "accidentals", label: "Có thăng/giáng" },
  { key: "ledger", label: "Nốt ngoài khuông" },
];

export default function Controls() {
  const mode = usePracticeStore((s) => s.mode);
  const difficulty = usePracticeStore((s) => s.difficulty);
  const setDifficulty = usePracticeStore((s) => s.setDifficulty);
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
