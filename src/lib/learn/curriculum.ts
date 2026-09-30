/**
 * Lộ trình bài học từ cơ bản → nâng cao.
 * Mỗi bài có một "nhà máy" sinh câu hỏi (make) và số câu mỗi lượt.
 */
import {
  genChordQuestion,
  genIntervalQuestion,
  genKeyQuestion,
  genNoteQuestion,
  genTimeSigQuestion,
} from "./generators";
import type { Lesson, Question } from "./types";

/** Số câu hỏi mỗi lượt học. */
export const PER_LESSON = 8;

interface LessonDef extends Lesson {
  make: () => Question;
}

export const LESSONS: LessonDef[] = [
  {
    id: "treble",
    level: 1,
    title: "Nốt khuông treble",
    desc: "5 dòng & 4 khe khoá Sol",
    make: () => genNoteQuestion("treble", false),
  },
  {
    id: "bass",
    level: 2,
    title: "Nốt khuông bass",
    desc: "Đọc nốt khoá Fa",
    make: () => genNoteQuestion("bass", false),
  },
  {
    id: "both",
    level: 3,
    title: "Hai khuông",
    desc: "Trộn treble + bass",
    make: () => genNoteQuestion("both", false),
  },
  {
    id: "accidentals",
    level: 4,
    title: "Thăng & giáng",
    desc: "Nốt có dấu hoá (# / b)",
    make: () => genNoteQuestion("accidentals", true),
  },
  {
    id: "ledger",
    level: 5,
    title: "Nốt ngoài khuông",
    desc: "Ledger lines trên & dưới",
    make: () => genNoteQuestion("ledger", true),
  },
  {
    id: "intervals",
    level: 6,
    title: "Quãng",
    desc: "Nhận biết quãng giữa 2 nốt",
    make: genIntervalQuestion,
  },
  {
    id: "chords",
    level: 7,
    title: "Hợp âm cơ bản",
    desc: "Hợp âm trưởng / thứ",
    make: () => genChordQuestion(false),
  },
  {
    id: "chords7",
    level: 8,
    title: "Hợp âm 7",
    desc: "Hợp âm 7, maj7, m7",
    make: () => genChordQuestion(true),
  },
  {
    id: "keys",
    level: 9,
    title: "Giọng & khoá nhạc",
    desc: "Dấu hoá ở đầu khuông",
    make: genKeyQuestion,
  },
  {
    id: "timesig",
    level: 10,
    title: "Số chỉ nhịp",
    desc: "Phách trong ô nhịp & giá trị nốt",
    make: genTimeSigQuestion,
  },
];

export function getLesson(id: string): LessonDef | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function generateLessonQuestions(id: string): Question[] {
  const lesson = getLesson(id);
  if (!lesson) return [];
  return Array.from({ length: PER_LESSON }, () => lesson.make());
}

/** Ôn tập tổng hợp: trộn ngẫu nhiên câu hỏi từ mọi bài. */
export function generateReviewQuestions(n = 12): Question[] {
  const out: Question[] = [];
  let guard = 0;
  while (out.length < n && guard < n * 6) {
    guard++;
    const lesson = LESSONS[Math.floor(Math.random() * LESSONS.length)];
    out.push(lesson.make());
  }
  return out;
}

export type { Lesson };
