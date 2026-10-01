"use client";

import { useMemo } from "react";
import { buildKeyboard } from "@/lib/music/keyboard";
import { nameToMidi, pitchClass, vnNoteName } from "@/lib/music/theory";

interface Props {
  /** Nốt cần chỉ (kèm quãng tám), ví dụ ["F4","A4","C5","E5"]. */
  notes: string[];
  /** "block" = bấm cùng lúc, "sequence" = bấm lần lượt. */
  mode?: "block" | "sequence";
}

/** Bề rộng tối thiểu mỗi phím trắng — hẹp hơn nữa thì cho cuộn ngang. */
const MIN_KEY_PX = 18;
/** Số quãng tám tối đa hiển thị cùng lúc. */
const MAX_OCTAVES = 3;

/**
 * Sơ đồ bàn phím thu nhỏ, tô sáng đúng những phím cần bấm cho một hợp âm / quãng.
 * Đặt ngay dưới nút "Nghe thử" để biết đường bấm trên đàn thật.
 */
export default function PianoKeyGuide({ notes, mode = "block" }: Props) {
  const view = useMemo(() => {
    const midis = notes.map(nameToMidi).filter((m): m is number => m != null);
    if (midis.length === 0) return null;

    const minMidi = Math.min(...midis);
    const maxMidi = Math.max(...midis);

    // Cửa sổ bắt đầu từ nốt Đô ngay dưới nốt thấp nhất, kết thúc ở nốt Đô trên nốt cao nhất.
    const start = minMidi - (((minMidi % 12) + 12) % 12);
    const octaves = Math.min(MAX_OCTAVES, Math.max(1, Math.ceil((maxMidi - start) / 12)));
    let end = start + octaves * 12;
    // Dải nốt rộng hơn giới hạn → nới thêm cho tới khi chứa được nốt cao nhất.
    if (end < maxMidi) end = maxMidi + (12 - (((maxMidi % 12) + 12) % 12));

    const keys = buildKeyboard(start, end);
    return {
      keys,
      whiteCount: keys.filter((k) => k.white).length,
      lit: new Set(midis),
    };
  }, [notes]);

  if (!view) return null;
  const { keys, whiteCount, lit } = view;

  const whiteClass = (midi: number) =>
    `absolute top-0 bottom-0 rounded-b border flex items-end justify-center pb-1 text-[9px] select-none ${
      lit.has(midi)
        ? "bg-emerald-400 border-emerald-500 text-emerald-950 font-semibold"
        : "bg-white border-zinc-300 text-zinc-400"
    }`;

  const blackClass = (midi: number) =>
    `absolute top-0 h-[62%] z-10 rounded-b border flex items-end justify-center pb-1 text-[8px] select-none ${
      lit.has(midi) ? "bg-emerald-500 border-emerald-600 text-white font-semibold" : "bg-zinc-900 border-black"
    }`;

  const names = notes.map(vnNoteName).join(" – ");

  return (
    <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-900/60">
      <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">Vị trí trên đàn</div>

      {/* max-w-lg: trên màn hình rộng không kéo phím dài ngoẵng, chỉ rộng ~500px */}
      <div className="max-w-lg overflow-x-auto rounded-md bg-zinc-800 p-1">
        <div className="relative h-20" style={{ minWidth: `${whiteCount * MIN_KEY_PX}px` }}>
          {keys
            .filter((k) => k.white)
            .map((k) => (
              <div
                key={k.midi}
                className={whiteClass(k.midi)}
                style={{ left: `${k.leftPct}%`, width: `${k.widthPct}%` }}
              >
                {lit.has(k.midi) ? pitchClass(k.note) : k.label}
              </div>
            ))}
          {keys
            .filter((k) => !k.white)
            .map((k) => (
              <div
                key={k.midi}
                className={blackClass(k.midi)}
                style={{ left: `${k.leftPct}%`, width: `${k.widthPct}%` }}
              >
                {lit.has(k.midi) && pitchClass(k.note)}
              </div>
            ))}
        </div>
      </div>

      <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-300">
        {notes.length === 1 ? "Bấm phím" : mode === "block" ? "Bấm cùng lúc" : "Bấm lần lượt"}:{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{names}</span>
      </p>
    </div>
  );
}
