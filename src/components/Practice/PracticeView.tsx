"use client";

import { usePracticeStore } from "@/store/usePracticeStore";
import GrandStaff from "@/components/Score/GrandStaff";
import PianoKeyboard from "@/components/PianoKeyboard/PianoKeyboard";
import Controls from "@/components/Controls/Controls";
import ChordDisplay from "@/components/ChordDisplay/ChordDisplay";

/**
 * Khu vực luyện tập (bấm phím): khuông nhạc + thông tin hợp âm + điều khiển
 * + bàn phím ảo. Chế độ (đọc nốt / hợp âm) lấy từ practice store.
 */
export default function PracticeView({ audioOn }: { audioOn: boolean }) {
  const mode = usePracticeStore((s) => s.mode);
  const targetNotes = usePracticeStore((s) => s.targetNotes);
  const result = usePracticeStore((s) => s.lastResult);

  return (
    <>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {mode === "NOTE_READING"
          ? "Bấm đúng nốt hiển thị trên khuông nhạc (bàn phím ảo, đàn MIDI, hoặc QWERTY)."
          : "Bấm tổ hợp phím tạo thành hợp âm hiển thị. Thể đảo nào cũng được tính đúng."}
      </p>

      <div className="relative">
        <GrandStaff notes={targetNotes} result={result} />
        {result !== "none" && (
          <div
            className={`pointer-events-none absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
              result === "correct" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
            }`}
          >
            {result === "correct" ? "Chính xác!" : "Chưa đúng"}
          </div>
        )}
      </div>

      <ChordDisplay />
      <Controls />
      <PianoKeyboard />

      {!audioOn && (
        <p className="text-center text-xs text-amber-600 dark:text-amber-400">
          Nhấn &ldquo;Bật âm thanh&rdquo; để nghe tiếng đàn (cần internet để tải mẫu piano).
        </p>
      )}
    </>
  );
}
