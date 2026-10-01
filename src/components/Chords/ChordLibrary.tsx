"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Play } from "lucide-react";
import {
  CHORD_QUALITIES,
  chordInfo,
  chordInversions,
  chordNameVn,
  chordVoicing,
} from "@/lib/music/theory";
import GrandStaff from "@/components/Score/GrandStaff";
import PianoKeyGuide from "@/components/Score/PianoKeyGuide";
import { playArpeggio, playChord } from "@/lib/audio/pianoSampler";

const ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

const INVERSION_LABELS = ["Thể gốc", "Đảo 1", "Đảo 2", "Đảo 3"];

/** Tên quãng tiếng Việt cho phần chi tiết. */
const INTERVAL_VN: Record<string, string> = {
  "1P": "Quãng 1 đúng",
  "2m": "Quãng 2 thứ",
  "2M": "Quãng 2 trưởng",
  "2A": "Quãng 2 tăng",
  "3m": "Quãng 3 thứ",
  "3M": "Quãng 3 trưởng",
  "4P": "Quãng 4 đúng",
  "4A": "Quãng 4 tăng",
  "5d": "Quãng 5 giảm",
  "5P": "Quãng 5 đúng",
  "6m": "Quãng 6 thứ",
  "6M": "Quãng 6 trưởng",
  "7m": "Quãng 7 thứ",
  "7M": "Quãng 7 trưởng",
  "8P": "Quãng 8 đúng",
  "9M": "Quãng 9 trưởng",
};

/** Chi tiết một hợp âm. Tách riêng để `key={symbol}` tự đặt lại thể đảo khi đổi hợp âm. */
function ChordDetail({
  symbol,
  audioOn,
  onBack,
}: {
  symbol: string;
  audioOn: boolean;
  onBack: () => void;
}) {
  const [inversion, setInversion] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const info = chordInfo(symbol);
  const inversions = chordInversions(symbol);
  const current = inversions[inversion] ?? chordVoicing(symbol);
  const pcs = current.map((n) => n.replace(/-?\d+$/, ""));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          aria-label="Về danh sách hợp âm"
          className="rounded-md p-1.5 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Thư viện hợp âm</span>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-3xl font-bold tracking-tight">{symbol}</span>
          <span className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">
            {chordNameVn(symbol)}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{info.name}</span>
        </div>

        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="text-zinc-500 dark:text-zinc-400">Các nốt:</dt>
            <dd className="font-medium">{pcs.join("  ")}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-zinc-500 dark:text-zinc-400">Cấu tạo:</dt>
            <dd className="font-medium">
              {info.intervals.map((iv) => INTERVAL_VN[iv] ?? iv).join(" · ")}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <GrandStaff notes={current} sequential={false} />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => playChord(current, "block")}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <Play size={14} /> Hợp âm
          </button>
          <button
            onClick={() => playArpeggio(current)}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <Play size={14} /> Rải (arpeggio)
          </button>
        </div>

        <PianoKeyGuide notes={current} mode="block" />
      </div>

      {/* Thể đảo */}
      {inversions.length > 1 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold">Thể đảo</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Cùng hợp âm nhưng đổi nốt trầm nhất. Bấm để xem và nghe từng thể.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {inversions.map((inv, i) => (
              <button
                key={i}
                onClick={() => setInversion(i)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                  i === inversion
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                }`}
              >
                {INVERSION_LABELS[i] ?? `Đảo ${i}`}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {INVERSION_LABELS[inversion] ?? `Đảo ${inversion}`}:{" "}
            <span className="font-medium">
              {current.map((n) => n.replace(/-?\d+$/, "")).join(" – ")}
            </span>
          </p>
        </div>
      )}

      {!audioOn && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Bấm &ldquo;Bật âm thanh&rdquo; ở góc trên để nghe tiếng đàn.
        </p>
      )}
    </div>
  );
}

export default function ChordLibrary({ audioOn }: { audioOn: boolean }) {
  const [root, setRoot] = useState<string>("C");
  const [symbol, setSymbol] = useState<string | null>(null);

  // ── Chi tiết hợp âm ──
  if (symbol) {
    return (
      <ChordDetail key={symbol} symbol={symbol} audioOn={audioOn} onBack={() => setSymbol(null)} />
    );
  }

  // ── Danh sách hợp âm theo nốt gốc ──
  const chords = CHORD_QUALITIES.map((q) => `${root}${q.suffix}`).filter(
    (s) => chordVoicing(s).length > 0,
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Chọn nốt gốc rồi bấm vào hợp âm để xem chi tiết (nốt, cấu tạo, thể đảo, nghe thử).
      </p>

      <div>
        <div className="mb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Nốt gốc</div>
        <div className="flex flex-wrap gap-1.5">
          {ROOTS.map((r) => (
            <button
              key={r}
              onClick={() => setRoot(r)}
              className={`h-9 w-10 rounded-md border text-sm font-semibold transition ${
                r === root
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-zinc-300 bg-white hover:border-indigo-400 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-indigo-500"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {chords.map((s) => (
          <button
            key={s}
            onClick={() => setSymbol(s)}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left transition hover:border-indigo-400 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-500"
          >
            <span className="w-14 shrink-0 text-lg font-bold tracking-tight">{s}</span>
            <span className="min-w-0 flex-1 text-sm text-zinc-600 dark:text-zinc-300">
              {chordNameVn(s)}
            </span>
            <ChevronRight size={16} className="shrink-0 text-zinc-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
