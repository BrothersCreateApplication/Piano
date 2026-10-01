"use client";

import { useEffect, useRef, useState } from "react";
import { toVexKey, vnNoteName } from "@/lib/music/theory";

interface Props {
  /** Khoá nhạc của khuông. */
  clef: "treble" | "bass";
  /** Các nốt vẽ tuần tự từ trái sang phải, ví dụ ["C4","D4","E4"]. */
  notes: string[];
  /** Hiện tên nốt tiếng Việt ngay dưới mỗi nốt. */
  labels?: boolean;
}

const NOTE_COLOR = "#18181b";

/**
 * Một khuông nhạc đơn vẽ các nốt nối tiếp nhau kèm tên nốt tiếng Việt bên dưới.
 * Dùng cho phần lý thuyết đọc nốt (khoá Sol / khoá Fa) — khác `GrandStaff`,
 * vốn vẽ 2 khuông và không có nhãn.
 */
export default function NoteChart({ clef, notes, labels = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || width === 0 || notes.length === 0) return;

    let cancelled = false;

    (async () => {
      // Dynamic import để tránh SSR (VexFlow cần DOM).
      const VF = await import("vexflow");
      if (cancelled) return;

      container.innerHTML = "";

      const height = 150;
      const margin = 10;
      const staveWidth = Math.max(width - margin * 2, 240);

      const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
      renderer.resize(width, height);
      const context = renderer.getContext();

      const stave = new VF.Stave(margin, 34, staveWidth).addClef(clef);

      try {
        stave.setContext(context).draw();

        const staveNotes = notes.map((n) => {
          const sn = new VF.StaveNote({ keys: [toVexKey(n)], duration: "w", clef });
          sn.setStyle({ fillStyle: NOTE_COLOR, strokeStyle: NOTE_COLOR });
          if (labels) {
            sn.addModifier(
              new VF.Annotation(vnNoteName(n))
                .setFontSize(11)
                .setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM),
              0,
            );
          }
          return sn;
        });

        const voice = new VF.Voice({ numBeats: 4, beatValue: 4 }).setMode(VF.Voice.Mode.SOFT);
        voice.addTickables(staveNotes);
        new VF.Formatter().joinVoices([voice]).formatToStave([voice], stave);
        voice.draw(context, stave);
      } catch {
        // VexFlow có thể ném lỗi khi tập nốt rỗng/bất thường — bỏ qua, không vỡ app.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clef, notes, labels, width]);

  // Nền sáng cố định (kể cả ở dark mode): VexFlow vẽ nốt/khuông màu tối, để nền
  // trong suốt thì trên điện thoại bật dark mode nốt sẽ chìm hẳn vào nền đen.
  // Giống cách GrandStaff làm.
  return (
    <div
      ref={containerRef}
      className="w-full min-h-[150px] rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-50"
    />
  );
}
