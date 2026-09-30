"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useLearnStore, nextLessonId } from "@/store/useLearnStore";
import { getLesson } from "@/lib/learn/curriculum";
import GrandStaff from "@/components/Score/GrandStaff";

const LETTERS = ["A", "B", "C", "D"];

export default function QuizPlayer() {
  const screen = useLearnStore((s) => s.screen);
  const lessonId = useLearnStore((s) => s.lessonId);
  const questions = useLearnStore((s) => s.questions);
  const index = useLearnStore((s) => s.index);
  const selected = useLearnStore((s) => s.selected);
  const correctCount = useLearnStore((s) => s.correctCount);
  const finished = useLearnStore((s) => s.finished);
  const answer = useLearnStore((s) => s.answer);
  const next = useLearnStore((s) => s.next);
  const toList = useLearnStore((s) => s.toList);
  const startLesson = useLearnStore((s) => s.startLesson);
  const startReview = useLearnStore((s) => s.startReview);

  const total = questions.length;
  const q = questions[index];
  const answered = selected !== null;
  const lesson = lessonId ? getLesson(lessonId) : undefined;
  const title = screen === "review" ? "Ôn tập tổng hợp" : (lesson?.title ?? "Bài học");

  const replay = () => {
    if (screen === "review") startReview();
    else if (lessonId) startLesson(lessonId);
  };

  // ── Màn tổng kết ──
  if (finished) {
    const pct = total ? Math.round((correctCount / total) * 100) : 0;
    const passed = pct >= 60;
    const nid = screen === "lesson" ? nextLessonId(lessonId) : null;
    const nextLesson = nid ? getLesson(nid) : undefined;

    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <div className="text-4xl font-bold">
            {correctCount}
            <span className="text-zinc-300 dark:text-zinc-600">/{total}</span>
          </div>
          <div className="mt-1 text-sm text-zinc-500">{pct}% chính xác</div>
          <p className="mt-3 text-sm font-medium">
            {passed ? "🎉 Đạt yêu cầu!" : "Cố thêm chút nữa nhé!"}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={replay}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <RotateCcw size={15} /> Làm lại
          </button>
          <button
            onClick={toList}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Về danh sách
          </button>
          {nextLesson && (
            <button
              onClick={() => startLesson(nextLesson.id)}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Bài tiếp: {nextLesson.title} <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!q) {
    return <p className="text-sm text-zinc-500">Không có câu hỏi.</p>;
  }

  const progressPct = total ? ((index + (answered ? 1 : 0)) / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Thanh tiêu đề */}
      <div className="flex items-center gap-3">
        <button
          onClick={toList}
          aria-label="Về danh sách"
          className="rounded-md p-1.5 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="font-medium">{title}</div>
        <div className="ml-auto text-sm text-zinc-500">
          Câu {index + 1}/{total}
          <span className="mx-1 text-zinc-300">·</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {correctCount} đúng
          </span>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Câu hỏi */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        {q.staffNotes && q.staffNotes.length > 0 && (
          <GrandStaff
            notes={q.staffNotes}
            sequential={q.sequential}
            result={answered ? (selected === q.answer ? "correct" : "wrong") : "none"}
          />
        )}
        <p className="mt-3 text-center font-medium">{q.prompt}</p>
      </div>

      {/* Đáp án */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.answer;
          const isChosen = i === selected;
          let cls =
            "border-zinc-200 bg-white hover:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-500";
          if (answered) {
            if (isCorrect)
              cls = "border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
            else if (isChosen)
              cls = "border-rose-400 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200";
            else cls = "border-zinc-200 bg-white opacity-50 dark:border-zinc-700 dark:bg-zinc-900";
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => answer(i)}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition disabled:cursor-default ${cls}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/5 text-xs font-bold dark:bg-white/10">
                {LETTERS[i]}
              </span>
              <span className="flex-1">{opt}</span>
              {answered && isCorrect && <CheckCircle2 size={18} className="text-emerald-500" />}
              {answered && isChosen && !isCorrect && <XCircle size={18} className="text-rose-500" />}
            </button>
          );
        })}
      </div>

      {/* Giải thích + chuyển câu */}
      {answered && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2 text-sm font-medium">
            {selected === q.answer ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-500" /> Chính xác!
              </>
            ) : (
              <>
                <XCircle size={16} className="text-rose-500" /> Chưa đúng
              </>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{q.explain}</p>
          <button
            onClick={next}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            {index >= total - 1 ? "Hoàn thành" : "Câu tiếp"}
            <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
