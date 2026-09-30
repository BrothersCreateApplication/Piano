"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildKeyboard, QWERTY_MAP } from "@/lib/music/keyboard";
import { usePracticeStore } from "@/store/usePracticeStore";
import { midiToName, nameToMidi } from "@/lib/music/theory";
import type { KeyDef } from "@/lib/types";

/** Số quãng tám hiển thị cùng lúc (đủ nhỏ để phím to trên điện thoại). */
const OCTAVES = 3;
/** Bề rộng tối thiểu mỗi phím trắng (px) — dưới ngưỡng này sẽ cuộn ngang. */
const MIN_KEY_PX = 32;
const MIN_START_OCTAVE = 0;
const MAX_START_OCTAVE = 6;

export default function PianoKeyboard() {
  const activeNotes = usePracticeStore((s) => s.activeNotes);
  const targetNotes = usePracticeStore((s) => s.targetNotes);
  const pressNote = usePracticeStore((s) => s.pressNote);
  const releaseNote = usePracticeStore((s) => s.releaseNote);

  const [startOctave, setStartOctave] = useState(3);
  const [qwertyOctave, setQwertyOctave] = useState(4);
  const [measured, setMeasured] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const startMidi = 12 * (startOctave + 1);
  const endMidi = startMidi + OCTAVES * 12 - 1;

  const keys = useMemo(() => buildKeyboard(startMidi, endMidi), [startMidi, endMidi]);
  const whiteCount = useMemo(() => keys.filter((k) => k.white).length, [keys]);

  // Bề rộng phím: lấp đầy khung nếu đủ chỗ, nếu không thì giữ mức tối thiểu → cuộn ngang.
  const keyPx = measured > 0 ? Math.max(measured / whiteCount, MIN_KEY_PX) : MIN_KEY_PX;
  const totalPx = keyPx * whiteCount;

  // Đo bề rộng vùng cuộn.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setMeasured(e.contentRect.width);
    });
    ro.observe(el);
    setMeasured(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Nốt đang bấm (theo MIDI) và pitch class của nốt mục tiêu (để tô màu).
  const activeMidis = useMemo(
    () => new Set(activeNotes.map(nameToMidi).filter((x): x is number => x != null)),
    [activeNotes],
  );
  const targetPcs = useMemo(
    () =>
      new Set(
        targetNotes
          .map((n) => {
            const m = nameToMidi(n);
            return m == null ? null : ((m % 12) + 12) % 12;
          })
          .filter((x): x is number => x != null),
      ),
    [targetNotes],
  );

  // Tự dịch cửa sổ quãng tám để chứa nốt mục tiêu, rồi cuộn tới nốt đó.
  useEffect(() => {
    const midis = targetNotes.map(nameToMidi).filter((x): x is number => x != null);
    if (midis.length === 0) return;

    const minM = Math.min(...midis);
    const maxM = Math.max(...midis);
    const winStart = startMidi;
    const winEnd = endMidi;

    if (minM < winStart || maxM > winEnd) {
      let oct = Math.floor(minM / 12) - 1;
      while (12 * (oct + 1) + OCTAVES * 12 - 1 < maxM && oct < MAX_START_OCTAVE) oct++;
      oct = Math.min(Math.max(oct, MIN_START_OCTAVE), MAX_START_OCTAVE);
      setStartOctave(oct);
      return; // render lại sẽ chạy tiếp nhánh cuộn bên dưới
    }

    const container = scrollRef.current;
    const el = container?.querySelector(`[data-midi="${maxM}"]`) as HTMLElement | null;
    if (container && el) {
      container.scrollTo({
        left: el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2,
        behavior: "smooth",
      });
    }
  }, [targetNotes, startMidi, endMidi]);

  // Bàn phím máy tính (QWERTY).
  const heldRef = useRef<Set<string>>(new Set());
  const baseMidi = 12 * (qwertyOctave + 1);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;

      const k = e.key.toLowerCase();
      if (e.repeat) return;
      if (k === "z") {
        setQwertyOctave((o) => Math.max(0, o - 1));
        return;
      }
      if (k === "x") {
        setQwertyOctave((o) => Math.min(7, o + 1));
        return;
      }
      const offset = QWERTY_MAP[k];
      if (offset == null) return;
      e.preventDefault();
      if (heldRef.current.has(k)) return;
      heldRef.current.add(k);
      pressNote(midiToName(baseMidi + offset));
    };

    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const offset = QWERTY_MAP[k];
      if (offset == null) return;
      heldRef.current.delete(k);
      releaseNote(midiToName(baseMidi + offset));
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [pressNote, releaseNote, baseMidi]);

  const isActive = (k: KeyDef) => activeMidis.has(k.midi);
  const inTarget = (k: KeyDef) => targetPcs.has(((k.midi % 12) + 12) % 12);

  const whiteClass = (k: KeyDef) => {
    const base =
      "absolute top-0 bottom-0 rounded-b-md border border-zinc-300 flex items-end justify-center pb-1 text-[10px] transition-colors duration-75 select-none";
    if (isActive(k))
      return `${base} ${inTarget(k) ? "bg-emerald-400 text-emerald-950 border-emerald-500" : "bg-rose-500 text-white border-rose-600"}`;
    return `${base} bg-white text-zinc-400 hover:bg-zinc-100`;
  };

  const blackClass = (k: KeyDef) => {
    const base =
      "absolute top-0 h-[62%] z-10 rounded-b-md border border-black shadow-md transition-colors duration-75 select-none";
    if (isActive(k))
      return `${base} ${inTarget(k) ? "bg-emerald-400 border-emerald-500" : "bg-rose-500 border-rose-600"}`;
    return `${base} bg-zinc-900 hover:bg-zinc-700`;
  };

  const handlers = (k: KeyDef) => ({
    onPointerDown: () => pressNote(k.note),
    onPointerUp: () => releaseNote(k.note),
    onPointerLeave: () => releaseNote(k.note),
    onPointerCancel: () => releaseNote(k.note),
  });

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span>Bàn phím</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setStartOctave((o) => Math.max(MIN_START_OCTAVE, o - 1))}
            disabled={startOctave <= MIN_START_OCTAVE}
            aria-label="Hạ quãng tám"
            className="rounded border border-zinc-300 p-0.5 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="tabular-nums">
            C{startOctave}–B{startOctave + OCTAVES - 1}
          </span>
          <button
            onClick={() => setStartOctave((o) => Math.min(MAX_START_OCTAVE, o + 1))}
            disabled={startOctave >= MAX_START_OCTAVE}
            aria-label="Nâng quãng tám"
            className="rounded border border-zinc-300 p-0.5 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto rounded-lg bg-zinc-800 p-1.5 shadow-inner"
        style={{ touchAction: "pan-x" }}
      >
        <div className="relative h-40 sm:h-48" style={{ width: `${totalPx}px` }}>
          {keys
            .filter((k) => k.white)
            .map((k) => (
              <div
                key={k.midi}
                data-midi={k.midi}
                role="button"
                aria-label={k.note}
                className={whiteClass(k)}
                style={{ left: `${k.leftPct}%`, width: `${k.widthPct}%` }}
                {...handlers(k)}
              >
                {k.label}
              </div>
            ))}
          {keys
            .filter((k) => !k.white)
            .map((k) => (
              <div
                key={k.midi}
                data-midi={k.midi}
                role="button"
                aria-label={k.note}
                className={blackClass(k)}
                style={{ left: `${k.leftPct}%`, width: `${k.widthPct}%` }}
                {...handlers(k)}
              />
            ))}
        </div>
      </div>

      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Trên điện thoại: <b>chạm</b> phím để chơi, <b>vuốt ngang</b> để xem các quãng tám khác. Máy tính gõ{" "}
        <kbd className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">A W S E D F…</kbd> (
        <kbd className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">Z</kbd>/
        <kbd className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">X</kbd> đổi octave, đang ở C{qwertyOctave}).
      </p>
    </div>
  );
}
