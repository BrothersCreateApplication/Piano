/** Kiểu dữ liệu dùng chung toàn app. */

export type Mode = "NOTE_READING" | "CHORDS";

export type Difficulty = "treble" | "bass" | "both" | "accidentals" | "ledger";

export type Result = "none" | "correct" | "wrong";

/** Một phím trên bàn phím ảo. */
export interface KeyDef {
  midi: number;
  /** Tên nốt kèm octave, ví dụ "C4", "D#4", "Bb4". */
  note: string;
  /** true nếu là phím trắng. */
  white: boolean;
  /** Vị trí trái theo % (0-100) trong container. */
  leftPct: number;
  /** Chiều rộng theo % (0-100). */
  widthPct: number;
  /** Có label hiển thị hay không (chỉ đánh dấu các nốt C). */
  label?: string;
}

/** Trạng thái kết nối MIDI để hiển thị cho người dùng. */
export interface MidiStatus {
  supported: boolean;
  enabled: boolean;
  inputName: string | null;
  error: string | null;
}
