"use client";

import { useLearnStore } from "@/store/useLearnStore";
import LessonList from "./LessonList";
import QuizPlayer from "./QuizPlayer";

export default function LearnView() {
  const screen = useLearnStore((s) => s.screen);
  return screen === "list" ? <LessonList /> : <QuizPlayer />;
}
