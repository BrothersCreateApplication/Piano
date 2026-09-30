"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Shuffle } from "lucide-react";
import { LESSONS } from "@/lib/learn/curriculum";
import { useLearnStore } from "@/store/useLearnStore";

export default function LessonList() {
  const startLesson = useLearnStore((s) => s.startLesson);
  const startReview = useLearnStore((s) => s.startReview);
  const progress = useLearnStore((s) => s.progress);

  // Tránh lệch hydration: chỉ hiện tiến độ (đọc từ localStorage) sau khi mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={startReview}
        className="flex items-center gap-3 rounded-xl bg-indigo-600 px-4 py-3 text-left text-white transition hover:bg-indigo-500"
      >
        <Shuffle size={22} />
        <span>
          <span className="block text-sm font-semibold">Ôn tập tổng hợp</span>
          <span className="block text-xs text-indigo-100">
            Trộn ngẫu nhiên câu hỏi từ mọi bài đã học
          </span>
        </span>
      </button>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {LESSONS.map((lesson) => {
          const p = mounted ? progress[lesson.id] : undefined;
          const done = p?.completed;
          return (
            <button
              key={lesson.id}
              onClick={() => startLesson(lesson.id)}
              className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left transition hover:border-indigo-400 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-500"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {lesson.level}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-medium">{lesson.title}</span>
                  {done && <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />}
                </span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  {lesson.desc}
                </span>
                {p && (
                  <span className="mt-0.5 block text-xs text-amber-600 dark:text-amber-400">
                    Điểm cao nhất: {p.best}/{p.total}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
