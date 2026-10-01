"use client";

import NoteChart from "@/components/Score/NoteChart";

/** Một quãng tám nốt trắng, bắt đầu và kết thúc ở nốt Đô. */
const TREBLE_NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
const BASS_NOTES = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"];

/** Chú thích vị trí các dòng kẻ / khe, đọc từ dưới lên. */
function PositionRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-800 dark:text-zinc-200">{items.join(" – ")}</span>
    </div>
  );
}

export default function NoteReadingTheory() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Hai khuông nhạc dưới đây có ghi tên từng nốt. Đọc qua một lượt rồi sang tab{" "}
        <b>Luyện tập</b> để tự kiểm tra.
      </p>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Khoá Sol (𝄞) — tay phải</h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Khoá Sol dùng cho các nốt <b>từ Đô giữa (C4) trở lên</b>. Một quãng tám từ Đô4 đến
          Đô5:
        </p>
        <div className="mt-2">
          <NoteChart clef="treble" notes={TREBLE_NOTES} />
        </div>
        <div className="mt-1 flex flex-col gap-1">
          <PositionRow label="5 dòng kẻ (dưới → trên):" items={["Mi", "Sol", "Si", "Rê", "Fa"]} />
          <PositionRow label="4 khe (dưới → trên):" items={["Fa", "La", "Đô", "Mi"]} />
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Nốt <b>Đô4</b> nằm dưới khuông, phải kẻ thêm một vạch ngắn — đó là <b>Đô giữa</b>, nốt
          thấp nhất của khuông Sol.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Khoá Fa (𝄢) — tay trái</h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Khoá Fa dùng cho các nốt <b>từ Đô giữa (C4) trở xuống</b>. Một quãng tám từ Đô3 đến
          Đô4:
        </p>
        <div className="mt-2">
          <NoteChart clef="bass" notes={BASS_NOTES} />
        </div>
        <div className="mt-1 flex flex-col gap-1">
          <PositionRow label="5 dòng kẻ (dưới → trên):" items={["Sol", "Si", "Rê", "Fa", "La"]} />
          <PositionRow label="4 khe (dưới → trên):" items={["La", "Đô", "Mi", "Sol"]} />
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Khoá Fa có hai chấm bao quanh dòng kẻ thứ 4 — dòng đó là nốt <b>Fa</b>. Nốt <b>Đô4</b> ở
          đây nằm trên khuông, cũng phải kẻ thêm một vạch.
        </p>
      </section>

      <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/50">
        <h2 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
          Đô giữa — nốt gặp nhau của hai khuông
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-indigo-900/80 dark:text-indigo-200/80">
          Cùng là nốt <b>Đô4</b> nhưng viết khác nhau: ở khuông Sol nó nằm <b>dưới</b> khuông,
          ở khuông Fa nó nằm <b>trên</b> khuông. Trên đàn piano đây là phím Đô nằm ngay giữa —
          đó là lý do nó được gọi là &ldquo;Đô giữa&rdquo;.
        </p>
      </section>
    </div>
  );
}
