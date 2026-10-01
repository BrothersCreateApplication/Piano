"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Volume2,
  VolumeX,
  Loader2,
  Music2,
  Radio,
  Keyboard as KeyboardIcon,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { usePracticeStore } from "@/store/usePracticeStore";
import { useMidiInput } from "@/lib/midi/useMidiInput";
import { unlockAudio, warmUpAudio } from "@/lib/audio/pianoSampler";
import LearnView from "@/components/Learn/LearnView";
import TheoryView from "@/components/Theory/TheoryView";
import ChordLibrary from "@/components/Chords/ChordLibrary";
import PracticeView from "@/components/Practice/PracticeView";

type Tab = "theory" | "quiz" | "chord" | "note";

const TABS: { key: Tab; label: string; icon: ReactNode }[] = [
  { key: "theory", label: "Lý thuyết", icon: <BookOpen size={16} /> },
  { key: "quiz", label: "Trắc nghiệm", icon: <GraduationCap size={16} /> },
  { key: "chord", label: "Hợp âm", icon: <Music2 size={16} /> },
  { key: "note", label: "Đọc nốt", icon: <KeyboardIcon size={16} /> },
];

export default function PianoApp() {
  const setMode = usePracticeStore((s) => s.setMode);
  const nextChallenge = usePracticeStore((s) => s.nextChallenge);

  const midi = useMidiInput();

  const [tab, setTab] = useState<Tab>("theory");
  const [chordView, setChordView] = useState<"library" | "practice">("library");
  const [audioOn, setAudioOn] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sinh câu hỏi luyện tập đầu tiên + phơi store (dev) để tự động hoá kiểm thử.
  useEffect(() => {
    warmUpAudio();
    nextChallenge();
    if (process.env.NODE_ENV !== "production") {
      const w = window as unknown as {
        __practiceStore?: typeof usePracticeStore;
        __learnStore?: typeof import("@/store/useLearnStore").useLearnStore;
      };
      w.__practiceStore = usePracticeStore;
      import("@/store/useLearnStore").then((m) => {
        w.__learnStore = m.useLearnStore;
      });
    }
  }, [nextChallenge]);

  function changeTab(t: Tab) {
    setTab(t);
    if (t === "note") setMode("NOTE_READING");
    else if (t === "chord") setMode("CHORDS");
  }

  async function handleEnableAudio() {
    setLoading(true);
    try {
      await unlockAudio();
      setAudioOn(true);
    } finally {
      setLoading(false);
    }
  }

  const showPractice = tab === "note" || (tab === "chord" && chordView === "practice");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight">
          Học Piano <span className="text-zinc-400">·</span> Lý thuyết &amp; Thực hành
        </h1>

        <button
          onClick={handleEnableAudio}
          disabled={audioOn || loading}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : audioOn ? (
            <Volume2 size={16} />
          ) : (
            <VolumeX size={16} />
          )}
          {audioOn ? "Đã bật âm thanh" : loading ? "Đang tải…" : "Bật âm thanh"}
        </button>

        <span
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          title={midi.error ?? undefined}
        >
          <Radio size={14} className={midi.inputName ? "text-emerald-500" : "text-zinc-400"} />
          {midi.error
            ? "MIDI: không khả dụng"
            : midi.inputName
              ? `MIDI: ${midi.inputName}`
              : "MIDI: chưa kết nối"}
        </span>
      </header>

      {/* Tabs chính */}
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => changeTab(t.key)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium leading-tight transition sm:text-sm ${
              tab === t.key
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Hợp âm có 2 chế độ: thư viện (tra cứu) và luyện tập (bấm phím) */}
      {tab === "chord" && (
        <div className="flex gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-700">
          {(["library", "practice"] as const).map((v) => (
            <button
              key={v}
              onClick={() => {
                setChordView(v);
                if (v === "practice") setMode("CHORDS");
              }}
              className={`flex-1 rounded-md px-3 py-1 text-xs font-medium transition ${
                chordView === v
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {v === "library" ? "Thư viện" : "Luyện tập"}
            </button>
          ))}
        </div>
      )}

      {/* Nội dung */}
      {tab === "theory" && <TheoryView audioOn={audioOn} />}
      {tab === "quiz" && <LearnView />}
      {tab === "chord" && chordView === "library" && <ChordLibrary audioOn={audioOn} />}
      {showPractice && <PracticeView audioOn={audioOn} />}
    </main>
  );
}
