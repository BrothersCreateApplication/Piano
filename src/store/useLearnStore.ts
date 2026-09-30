/**
 * Store cho tầng "Học lý thuyết": điều khiển lượt học, chấm điểm, và lưu
 * tiến độ (bài đã hoàn thành + điểm cao nhất) vào localStorage.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  generateLessonQuestions,
  generateReviewQuestions,
  getLesson,
  LESSONS,
} from "@/lib/learn/curriculum";
import type { Question } from "@/lib/learn/types";

export interface ProgressEntry {
  completed: boolean;
  best: number;
  total: number;
}

type Screen = "list" | "lesson" | "review";

interface LearnState {
  screen: Screen;
  lessonId: string | null;
  questions: Question[];
  index: number;
  /** Đáp án người dùng đã chọn cho câu hiện tại (null = chưa trả lời). */
  selected: number | null;
  correctCount: number;
  finished: boolean;
  progress: Record<string, ProgressEntry>;

  startLesson: (id: string) => void;
  startReview: () => void;
  answer: (i: number) => void;
  next: () => void;
  toList: () => void;
}

export const useLearnStore = create<LearnState>()(
  persist(
    (set, get) => ({
      screen: "list",
      lessonId: null,
      questions: [],
      index: 0,
      selected: null,
      correctCount: 0,
      finished: false,
      progress: {},

      startLesson: (id) =>
        set({
          screen: "lesson",
          lessonId: id,
          questions: generateLessonQuestions(id),
          index: 0,
          selected: null,
          correctCount: 0,
          finished: false,
        }),

      startReview: () =>
        set({
          screen: "review",
          lessonId: null,
          questions: generateReviewQuestions(),
          index: 0,
          selected: null,
          correctCount: 0,
          finished: false,
        }),

      answer: (i) => {
        const st = get();
        if (st.selected !== null) return; // đã trả lời rồi
        const q = st.questions[st.index];
        if (!q) return;
        set({
          selected: i,
          correctCount: st.correctCount + (i === q.answer ? 1 : 0),
        });
      },

      next: () => {
        const st = get();
        const isLast = st.index >= st.questions.length - 1;
        if (!isLast) {
          set({ index: st.index + 1, selected: null });
          return;
        }

        // Kết thúc lượt. Lưu tiến độ cho bài học (không lưu cho ôn tập).
        if (st.screen === "lesson" && st.lessonId) {
          const total = st.questions.length;
          const passed = st.correctCount >= Math.ceil(total * 0.6);
          const prev = st.progress[st.lessonId];
          set({
            finished: true,
            progress: {
              ...st.progress,
              [st.lessonId]: {
                completed: (prev?.completed ?? false) || passed,
                best: Math.max(prev?.best ?? 0, st.correctCount),
                total,
              },
            },
          });
        } else {
          set({ finished: true });
        }
      },

      toList: () => set({ screen: "list", lessonId: null, finished: false, selected: null }),
    }),
    {
      name: "piano-learn-progress",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ progress: s.progress }),
    },
  ),
);

/** Bài kế tiếp trong lộ trình (dùng để gợi ý sau khi hoàn thành). */
export function nextLessonId(id: string | null): string | null {
  const lesson = id ? getLesson(id) : undefined;
  if (!lesson) return null;
  return LESSONS.find((l) => l.level === lesson.level + 1)?.id ?? null;
}
