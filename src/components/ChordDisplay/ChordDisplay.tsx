"use client";

import { Play } from "lucide-react";
import { usePracticeStore } from "@/store/usePracticeStore";
import { chordInfo, detectChord, pitchClass } from "@/lib/music/theory";
import { playArpeggio, playChord } from "@/lib/audio/pianoSampler";

export default function ChordDisplay() {
  const mode = usePracticeStore((s) => s.mode);
  const symbol = usePracticeStore((s) => s.currentChordSymbol);
  const targetNotes = usePracticeStore((s) => s.targetNotes);
  const activeNotes = usePracticeStore((s) => s.activeNotes);

  if (mode !== "CHORDS" || !symbol) return null;

  const info = chordInfo(symbol);
  const detected = detectChord(activeNotes);
  const targetPcs = targetNotes.map(pitchClass).join("  ");

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold tracking-tight">{symbol}</span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{info.name}</span>
      </div>

      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Các nốt: <span className="font-medium">{targetPcs}</span>
        <span className="mx-2 text-zinc-300">•</span>
        Quãng: <span className="font-mono">{info.intervals.join(" ")}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => playChord(targetNotes, "block")}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          <Play size={14} /> Hợp âm
        </button>
        <button
          onClick={() => playArpeggio(targetNotes)}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          <Play size={14} /> Rải (arpeggio)
        </button>
      </div>

      <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
        Bạn đang bấm:{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-200">
          {activeNotes.length ? activeNotes.join(" ") : "—"}
        </span>
        {detected.length > 0 && (
          <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Nhận diện: {detected[0]}
          </span>
        )}
      </div>
    </div>
  );
}
