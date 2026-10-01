"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { THEORY_TOPICS, type TheoryExample } from "@/lib/theory/topics";
import GrandStaff from "@/components/Score/GrandStaff";
import PianoKeyGuide from "@/components/Score/PianoKeyGuide";
import { playArpeggio, playChord, playNote } from "@/lib/audio/pianoSampler";

/** In đậm các đoạn **…**, mỗi dòng là một đoạn văn. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line, i) => (
          <p key={i} className="mt-1.5 text-sm leading-relaxed text-zinc-600 first:mt-0 dark:text-zinc-300">
            {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{part}</span>
              ),
            )}
          </p>
        ))}
    </>
  );
}

function ExampleBlock({ example, audioOn }: { example: TheoryExample; audioOn: boolean }) {
  const play = () => {
    const notes = example.notes;
    if (notes.length === 0) return;
    if (example.play === "block") playChord(notes, "block");
    else if (example.play === "arpeggio") playArpeggio(notes);
    else playNote(notes[0]);
  };

  return (
    <div className="mt-3">
      <GrandStaff notes={example.notes} sequential={example.sequential} />
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <button
          onClick={play}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          <Play size={13} /> Nghe thử
        </button>
        {example.caption && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{example.caption}</span>
        )}
      </div>

      <PianoKeyGuide notes={example.notes} mode={example.sequential ? "sequence" : "block"} />

      {!audioOn && (
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
          Bấm &ldquo;Bật âm thanh&rdquo; ở góc trên để nghe tiếng đàn.
        </p>
      )}
    </div>
  );
}

export default function TheoryView({ audioOn }: { audioOn: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const topic = selectedId ? THEORY_TOPICS.find((t) => t.id === selectedId) : undefined;
  const index = topic ? THEORY_TOPICS.indexOf(topic) : -1;

  useEffect(() => {
    if (selectedId) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedId]);

  // ── Danh sách chủ đề ──
  if (!topic) {
    return (
      <div className="flex flex-col gap-2.5">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Đọc để hiểu bản chất trước khi làm trắc nghiệm. Bấm vào từng chủ đề.
        </p>
        {THEORY_TOPICS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setSelectedId(t.id)}
            className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left transition hover:border-indigo-400 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-500"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{t.title}</span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">{t.summary}</span>
            </span>
            <ChevronRight size={16} className="mt-1.5 shrink-0 text-zinc-400" />
          </button>
        ))}
      </div>
    );
  }

  // ── Chi tiết chủ đề ──
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedId(null)}
          aria-label="Về danh sách lý thuyết"
          className="rounded-md p-1.5 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          <BookOpen size={14} /> Lý thuyết
        </div>
        <span className="ml-auto text-xs text-zinc-400">
          {index + 1}/{THEORY_TOPICS.length}
        </span>
      </div>

      <h2 className="text-lg font-bold">{topic.title}</h2>

      {topic.sections.map((section, i) => (
        <section
          key={i}
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{section.heading}</h3>
          <div className="mt-1.5">
            <RichText text={section.body} />
          </div>

          {section.bullets && section.bullets.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {section.bullets.map((b, j) => (
                <li key={j} className="flex gap-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
                  <span>
                    {b.split(/(\*\*[^*]+\*\*)/g).map((part, k) =>
                      part.startsWith("**") && part.endsWith("**") ? (
                        <strong key={k} className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {part.slice(2, -2)}
                        </strong>
                      ) : (
                        <span key={k}>{part}</span>
                      ),
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {section.example && <ExampleBlock example={section.example} audioOn={audioOn} />}
        </section>
      ))}

      {/* Điều hướng bài trước / bài sau */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => index > 0 && setSelectedId(THEORY_TOPICS[index - 1].id)}
          disabled={index <= 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          <ChevronLeft size={15} /> Bài trước
        </button>
        <button
          onClick={() => index < THEORY_TOPICS.length - 1 && setSelectedId(THEORY_TOPICS[index + 1].id)}
          disabled={index >= THEORY_TOPICS.length - 1}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-40"
        >
          Bài sau <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
