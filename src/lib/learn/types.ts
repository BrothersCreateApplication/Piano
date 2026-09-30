/** Kiểu dữ liệu cho tầng "Học lý thuyết" (bài học + trắc nghiệm). */

export type QuestionKind = "note" | "interval" | "chord" | "key" | "timesig";

export interface Question {
  id: string;
  kind: QuestionKind;
  /** Câu hỏi dạng chữ (nếu không có khuông nhạc). */
  prompt: string;
  /** Nốt cần vẽ trên khuông (nếu có). */
  staffNotes?: string[];
  /** Vẽ nốt tuần tự trái→phải (quãng) thay vì chồng lên nhau (hợp âm). */
  sequential?: boolean;
  options: string[];
  /** Chỉ số đáp án đúng trong `options` (đã trộn). */
  answer: number;
  /** Giải thích hiện sau khi trả lời. */
  explain: string;
}

export interface Lesson {
  id: string;
  title: string;
  desc: string;
  /** Cấp độ 1..n — dùng để sắp xếp cơ bản → nâng cao. */
  level: number;
}
