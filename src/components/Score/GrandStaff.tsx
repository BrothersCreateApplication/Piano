"use client";

import { useEffect, useRef, useState } from "react";
import { isTreble, toVexKey } from "@/lib/music/theory";
import type { Result } from "@/lib/types";

interface Props {
  /** Nốt (kèm octave) cần vẽ, ví dụ ["C4","E4","G4"]. */
  notes: string[];
  /** Kết quả hiện tại — tô màu nốt xanh/đỏ. */
  result?: Result;
  /** Vẽ nốt tuần tự trái→phải (quãng) thay vì chồng lên nhau (hợp âm). */
  sequential?: boolean;
}

const COLORS: Record<Result, string> = {
  none: "#18181b",
  correct: "#059669", // emerald-600
  wrong: "#e11d48", // rose-600
};

function accidentalOf(note: string): "#" | "b" | "##" | "bb" | null {
  const m = note.match(/^[A-Ga-g](#{1,2}|b{1,2})/);
  return m ? (m[1] as "#" | "b" | "##" | "bb") : null;
}

export default function GrandStaff({ notes, result = "none", sequential = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // Theo dõi bề rộng container để vẽ lại khi đổi kích thước.
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
    if (!container || width === 0) return;

    let cancelled = false;

    (async () => {
      // Dynamic import để tránh SSR (VexFlow cần DOM).
      const VF = await import("vexflow");
      if (cancelled) return;

      // Xoá sạch trước khi vẽ lại (Factory.draw KHÔNG tự xoá canvas cũ).
      container.innerHTML = "";

      const height = 250;
      const margin = 12;
      const staveWidth = Math.max(width - margin * 2, 280);
      const trebleY = 24;
      const bassY = 150;

      const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
      renderer.resize(width, height);
      const context = renderer.getContext();

      const treble = new VF.Stave(margin, trebleY, staveWidth)
        .addClef("treble")
        .addTimeSignature("4/4");
      const bass = new VF.Stave(margin, bassY, staveWidth).addClef("bass");

      const color = COLORS[result];

      const trebleNotes = notes.filter((n) => isTreble(n));
      const bassNotes = notes.filter((n) => !isTreble(n));

      const makeStaveNote = (list: string[], clef: "treble" | "bass") => {
        const sn = new VF.StaveNote({
          keys: list.map(toVexKey),
          duration: "w",
          clef,
        });
        list.forEach((n, i) => {
          const acc = accidentalOf(n);
          if (acc) sn.addModifier(new VF.Accidental(acc), i);
        });
        sn.setStyle({ fillStyle: color, strokeStyle: color });
        return sn;
      };

      try {
        // Vẽ 2 khuông TRƯỚC (kèm khoá + chỉ nhịp). FormatAndDraw không vẽ modifier
        // của khuông nên phải tự draw để khoá nhạc hiện ra.
        treble.setContext(context).draw();
        bass.setContext(context).draw();

        const drawVoice = (
          stave: InstanceType<typeof VF.Stave>,
          list: string[],
          clef: "treble" | "bass",
        ) => {
          if (list.length === 0) return;
          const staveNotes = sequential
            ? list.map((n) => makeStaveNote([n], clef))
            : [makeStaveNote(list, clef)];
          const voice = new VF.Voice({ numBeats: 4, beatValue: 4 }).setMode(VF.Voice.Mode.SOFT);
          voice.addTickables(staveNotes);
          new VF.Formatter()
            .joinVoices([voice])
            .format([voice], Math.max(staveWidth - 100, 80));
          voice.draw(context, stave);
        };

        drawVoice(treble, trebleNotes, "treble");
        drawVoice(bass, bassNotes, "bass");

        // Dấu ngoặc nhọn nối 2 khuông + vạch nhịp trái.
        new VF.StaveConnector(treble, bass).setType("brace").setContext(context).draw();
        new VF.StaveConnector(treble, bass).setType("singleLeft").setContext(context).draw();
      } catch {
        // VexFlow có thể ném lỗi khi tập nốt rỗng/bất thường — bỏ qua, không vỡ app.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [notes, result, width, sequential]);

  return (
    <div
      ref={containerRef}
      className="w-full min-h-[250px] rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-50"
    />
  );
}
