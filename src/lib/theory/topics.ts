/**
 * Nội dung phần "Lý thuyết" — tài liệu tham khảo đọc hiểu, tách biệt với
 * phần trắc nghiệm (chỉ để học, không chấm điểm).
 *
 * Quy ước định dạng: trong `body`, dùng **…** để in đậm, mỗi dòng là một đoạn.
 */

export interface TheoryExample {
  /** Chú thích dưới khuông nhạc. */
  caption?: string;
  /** Nốt (kèm octave) để vẽ trên khuông. */
  notes: string[];
  /** Vẽ nốt tuần tự trái→phải (giai điệu) thay vì chồng lên nhau (hợp âm). */
  sequential?: boolean;
  /** Cách phát khi bấm nghe thử. */
  play?: "block" | "arpeggio" | "single";
}

export interface TheorySection {
  heading: string;
  body: string;
  bullets?: string[];
  example?: TheoryExample;
}

export interface TheoryTopic {
  id: string;
  title: string;
  summary: string;
  sections: TheorySection[];
}

export const THEORY_TOPICS: TheoryTopic[] = [
  // ───────────────────────────── 1 ─────────────────────────────
  {
    id: "staff",
    title: "Khuông nhạc & khoá nhạc",
    summary: "Nốt được ghi ở đâu, đọc theo hướng nào",
    sections: [
      {
        heading: "Khuông nhạc là gì?",
        body: "Khuông nhạc gồm **5 dòng kẻ** song song tạo thành **4 khe** ở giữa. Nốt được đặt **trên dòng** hoặc **trong khe**.\nCàng lên cao thì nốt càng **cao** (âm thanh bổng hơn); càng xuống thấp thì nốt càng **trầm**. Đọc theo thứ tự từ trái sang phải.",
      },
      {
        heading: "Khoá Sol (treble clef) — tay phải",
        body: "Vòng xoáy của khoá Sol quấn quanh **dòng thứ 2 từ dưới lên**, và dòng đó chính là nốt **Sol (G)**. Đây là khoá dùng cho âm vực cao, thường là tay phải.",
        bullets: [
          "5 dòng (từ dưới lên): Mi – Sol – Si – Rê – Fa  (E G B D F)",
          "4 khe (từ dưới lên): Fa – La – Đô – Mi  (F A C E)",
        ],
        example: { notes: ["G4"], caption: "Nốt Sol — nằm ngay dòng mà khoá Sol quấn quanh" },
      },
      {
        heading: "Khoá Fa (bass clef) — tay trái",
        body: "Hai dấu chấm của khoá Fa kẹp lấy **dòng thứ 4 từ dưới lên**, và dòng đó là nốt **Fa (F)**. Khoá này dùng cho âm vực trầm, thường là tay trái.",
        bullets: [
          "5 dòng (từ dưới lên): Sol – Si – Rê – Fa – La  (G B D F A)",
          "4 khe (từ dưới lên): La – Đô – Mi – Sol  (A C E G)",
        ],
        example: { notes: ["F3"], caption: "Nốt Fa — nằm trên dòng mà 2 chấm khoá Fa kẹp lấy" },
      },
      {
        heading: "Vì sao cần 2 khoá?",
        body: "Một khuông chỉ có 5 dòng nên chỉ ghi được khoảng 1,5 quãng tám. Đàn piano trải hơn 7 quãng tám, nên người ta dùng **2 khuông ghép lại** (gọi là khuông lớn): khoá Sol cho tay phải, khoá Fa cho tay trái. Chúng nối với nhau bằng dấu ngoặc nhọn ở đầu dòng.",
        example: {
          notes: ["C4", "E4", "G4", "C3"],
          sequential: false,
          play: "block",
          caption: "Hợp âm Đô trưởng trải trên cả 2 khuông — nốt Đô trầm nằm ở khuông Fa",
        },
      },
    ],
  },

  // ───────────────────────────── 2 ─────────────────────────────
  {
    id: "note-names",
    title: "Tên nốt & quãng tám",
    summary: "7 tên nốt, cách gọi Đô Rê Mi, và chu kỳ quãng tám",
    sections: [
      {
        heading: "Chỉ có 7 tên nốt",
        body: "Âm nhạc phương Tây dùng **7 tên nốt**: C D E F G A B — người Việt gọi là **Đô Rê Mi Fa Sol La Si**.\nHết Si thì **quay lại Đô**, nhưng ở độ cao mới (cao hơn). Cứ thế lặp mãi.",
      },
      {
        heading: "Quãng tám (octave)",
        body: "Khoảng cách từ một nốt lên **nốt cùng tên** kế tiếp gọi là **một quãng tám** (octave) — gồm 8 nốt đếm cả hai đầu (Đô → Đô).\nHai nốt cách nhau một quãng tám nghe **rất giống nhau**, chỉ khác một bổng một trầm, nên người ta đặt cho chúng cùng tên.",
        example: {
          notes: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
          sequential: true,
          play: "arpeggio",
          caption: "Âm giai Đô trưởng — từ Đô lên Đô (hết Si quay lại Đô ở quãng tám cao hơn)",
        },
      },
      {
        heading: "Số bên cạnh tên nốt",
        body: "Để phân biệt các quãng tám, người ta ghi thêm **số** sau tên nốt: **C4** là nốt Đô ở quãng tám thứ 4 — chính là **Đô giữa** trên đàn piano. C5 là Đô cao hơn một quãng tám.",
      },
    ],
  },

  // ───────────────────────────── 3 ─────────────────────────────
  {
    id: "accidentals",
    title: "Dấu thăng & dấu giáng",
    summary: "Nâng/hạ nốt nửa cung — và cách dùng đúng",
    sections: [
      {
        heading: "Dấu thăng (#) — nâng lên nửa cung",
        body: "Dấu thăng **#** nâng nốt lên **nửa cung** (nửa cung = 1 phím đàn, kể cả phím đen).\nVí dụ: **Đô (C)** thăng lên nửa cung thành **Đô thăng (C#)** — trên piano là phím đen ngay bên phải nốt Đô.",
        example: {
          notes: ["C4", "C#4"],
          sequential: true,
          play: "arpeggio",
          caption: "Đô → Đô thăng: cao hơn đúng nửa cung",
        },
      },
      {
        heading: "Dấu giáng (b) — hạ xuống nửa cung",
        body: "Dấu giáng **b** hạ nốt xuống **nửa cung**.\nVí dụ: **Si (B)** giáng xuống nửa cung thành **Si giáng (Bb)** — phím đen ngay bên trái nốt Si.",
        example: {
          notes: ["B4", "Bb4"],
          sequential: true,
          play: "arpeggio",
          caption: "Si → Si giáng: thấp hơn đúng nửa cung",
        },
      },
      {
        heading: "Dấu bình (♮) — huỷ dấu hoá",
        body: "Dấu bình **♮** trả nốt về **cao độ tự nhiên** ban đầu. Dùng khi một nốt đã bị thăng/giáng trước đó mà bạn muốn nó trở lại bình thường.",
      },
      {
        heading: "Cùng một phím, hai cái tên (enharmonic)",
        body: "**C# và Db là cùng một phím đàn** — nghe y hệt nhau, chỉ khác cách viết. Cặp như vậy gọi là **enharmonic** (đồng âm dị danh).\nVậy khi nào viết thăng, khi nào viết giáng? Tuỳ **ngữ cảnh giọng**: bài có dấu thăng thì viết thăng, bài có dấu giáng thì viết giáng — để mỗi tên nốt chỉ xuất hiện một lần trong thang âm.",
        bullets: [
          "C# = Db   •   D# = Eb   •   F# = Gb   •   G# = Ab   •   A# = Bb",
          "Trên bản nhạc, dấu hoá luôn đứng NGAY TRƯỚC nốt bị ảnh hưởng",
        ],
        example: {
          notes: ["Db4"],
          caption: "Db (Rê giáng) — cách viết khác của C#, cùng một phím đàn",
        },
      },
      {
        heading: "Dấu hoá có hiệu lực bao lâu?",
        body: "Đây là chỗ nhiều người mới học hay nhầm:",
        bullets: [
          "Dấu hoá ghi giữa bài có hiệu lực cho **cả ô nhịp đó** — các nốt cùng tên phía sau trong ô nhịp cũng bị ảnh hưởng, không cần ghi lại.",
          "Sang **ô nhịp tiếp theo** thì hết hiệu lực, trừ khi được ghi lại.",
          "Dấu hoá ghi ở **đầu khuông** (khoá nhạc) thì có hiệu lực cho **toàn bộ bài**.",
        ],
      },
    ],
  },

  // ───────────────────────────── 4 ─────────────────────────────
  {
    id: "key-signature",
    title: "Dấu hoá ở đầu khuông",
    summary: "Vì sao bài nhạc có dấu thăng/giáng ngay sau khoá nhạc",
    sections: [
      {
        heading: "Đó là gì?",
        body: "Ngay sau khoá nhạc, bạn thường thấy một cụm **dấu thăng** hoặc **dấu giáng**. Đó là **dấu hoá biểu** (key signature) — nó cho biết **bài nhạc thuộc giọng nào** và những nốt nào bị thăng/giáng **trong suốt bài**.\nNhờ vậy nhạc sĩ không phải ghi dấu hoá lặp lại ở từng nốt.",
      },
      {
        heading: "Thứ tự các dấu — không bao giờ đổi",
        body: "Các dấu hoá luôn xuất hiện theo **một thứ tự cố định**, và số lượng dấu quyết định giọng:",
        bullets: [
          "Dấu thăng theo thứ tự: **Fa – Đô – Sol – Rê – La – Mi – Si**",
          "Dấu giáng theo thứ tự ngược lại: **Si – Mi – La – Rê – Sol – Đô – Fa**",
          "0 dấu = Đô trưởng (C)   •   1 thăng = Sol trưởng (G)   •   2 thăng = Rê trưởng (D)",
          "1 giáng = Fa trưởng (F)   •   2 giáng = Si giáng trưởng (Bb)",
        ],
      },
      {
        heading: "Ví dụ: giọng Sol trưởng",
        body: "Giọng Sol trưởng có **1 dấu thăng** — nốt **Fa** bị thăng thành **Fa#**. Vì thế âm giai Sol trưởng dùng Fa# chứ không dùng Fa.",
        example: {
          notes: ["G4", "A4", "B4", "C5", "D5", "E5", "F#5", "G5"],
          sequential: true,
          play: "arpeggio",
          caption: "Âm giai Sol trưởng — nốt Fa được thăng (Fa#) đúng như dấu hoá ở đầu khuông",
        },
      },
    ],
  },

  // ───────────────────────────── 5 ─────────────────────────────
  {
    id: "intervals",
    title: "Quãng",
    summary: "Khoảng cách giữa hai nốt — nền tảng của hợp âm",
    sections: [
      {
        heading: "Quãng là gì?",
        body: "**Quãng** (interval) là khoảng cách cao độ giữa **hai nốt**. Người ta đếm số bậc bằng cách đếm tên nốt, **kể cả nốt đầu**:\nĐô → Mi đếm là Đô(1) Rê(2) Mi(3) → **quãng 3**. Đô → Sol là **quãng 5**.",
      },
      {
        heading: "Số quãng và tính chất",
        body: "Số quãng (2, 3, 5, 8…) chỉ nói **bao xa về tên nốt**. Còn **tính chất** (trưởng, thứ, đúng…) nói **chính xác bao nhiêu cung**. Hai quãng cùng số nhưng khác tính chất thì nghe khác nhau.\nMột **cung** = 2 nửa cung = 2 phím đàn liền nhau.",
        bullets: [
          "Quãng 3 **trưởng** = 2 cung (Đô → Mi)",
          "Quãng 3 **thứ** = 1,5 cung (Đô → Mi giáng)",
          "Quãng 5 **đúng** = 3,5 cung (Đô → Sol)",
        ],
      },
      {
        heading: "Nghe thử sự khác biệt",
        body: "Đây là điều quan trọng nhất: **quãng 3 trưởng nghe tươi sáng**, còn **quãng 3 thứ nghe buồn, tối hơn**. Chính nốt thứ 3 này quyết định một hợp âm là trưởng hay thứ.",
        example: {
          notes: ["C4", "E4"],
          sequential: true,
          play: "arpeggio",
          caption: "Quãng 3 trưởng: Đô → Mi (2 cung) — nghe tươi sáng",
        },
      },
      {
        heading: "Quãng 3 thứ — chỉ khác nửa cung",
        body: "Hạ nốt trên xuống nửa cung, ta được quãng 3 thứ. Chỉ nửa cung thôi mà màu sắc thay đổi hẳn.",
        example: {
          notes: ["C4", "Eb4"],
          sequential: true,
          play: "arpeggio",
          caption: "Quãng 3 thứ: Đô → Mi giáng (1,5 cung) — nghe buồn hơn",
        },
      },
    ],
  },

  // ───────────────────────────── 6 ─────────────────────────────
  {
    id: "chords",
    title: "Hợp âm",
    summary: "Ba nốt vang cùng lúc — trưởng, thứ, và hợp âm 7",
    sections: [
      {
        heading: "Hợp âm ba (triad)",
        body: "**Hợp âm** là khi **3 nốt trở lên** vang lên cùng lúc. Loại cơ bản nhất là **hợp âm ba**, xây từ 3 nốt: nốt **1** (nốt gốc) + nốt **3** + nốt **5**.\nVí dụ hợp âm Đô: **C – E – G**.",
      },
      {
        heading: "Trưởng và thứ — khác nhau đúng 1 nốt",
        body: "Đây là điều cốt lõi, nhớ kỹ sẽ hiểu được 90% hợp âm:",
        bullets: [
          "Hợp âm **trưởng** = quãng 3 trưởng + quãng 5 đúng → C E G (nghe tươi sáng)",
          "Hợp âm **thứ** = quãng 3 thứ + quãng 5 đúng → C Eb G (nghe buồn)",
          "Chỉ **nốt giữa (nốt 3)** khác nhau — hạ nó xuống nửa cung là trưởng thành thứ",
        ],
        example: {
          notes: ["C4", "E4", "G4"],
          play: "block",
          caption: "Đô trưởng (C) — nốt giữa là Mi",
        },
      },
      {
        heading: "Nghe hợp âm thứ",
        body: "Cùng hai nốt ngoài (C và G), chỉ hạ nốt giữa từ Mi xuống **Mi giáng** — hợp âm chuyển từ vui sang buồn.",
        example: {
          notes: ["C4", "Eb4", "G4"],
          play: "block",
          caption: "Đô thứ (Cm) — nốt giữa hạ xuống Mi giáng",
        },
      },
      {
        heading: "Hợp âm 7",
        body: "Thêm **nốt thứ 7** vào hợp âm ba, ta được **hợp âm 7** — nghe đầy đặn và \"có sức đẩy\" hơn. Có nhiều loại: **7** (át 7), **maj7** (trưởng 7), **m7** (thứ 7)…\nVí dụ Đô trưởng 7: **C – E – G – B**. Bạn xem đầy đủ trong mục **Hợp âm**.",
        example: {
          notes: ["C4", "E4", "G4", "B4"],
          play: "block",
          caption: "Đô trưởng 7 (Cmaj7) — thêm nốt Si vào hợp âm Đô trưởng",
        },
      },
      {
        heading: "Thể đảo (inversion)",
        body: "Cùng một hợp âm có thể đặt nốt nào lên **bass** (nốt trầm nhất). Đó gọi là **thể đảo**:\nĐảo 0 = C E G, đảo 1 = E G C, đảo 2 = G C E. Nghe vẫn là hợp âm Đô, nhưng **màu sắc hơi khác** và giúp tay đàn di chuyển mượt hơn.",
      },
    ],
  },

  // ───────────────────────────── 7 ─────────────────────────────
  {
    id: "scales",
    title: "Giọng & âm giai",
    summary: "Công thức tạo nên âm giai trưởng",
    sections: [
      {
        heading: "Âm giai trưởng có công thức cố định",
        body: "**Âm giai** (scale) là một chuỗi nốt đi lên theo một **mẫu khoảng cách cố định**. Âm giai trưởng luôn theo mẫu:\n**1 – 1 – ½ – 1 – 1 – 1 – ½** cung (1 = một cung, ½ = nửa cung).",
      },
      {
        heading: "Đô trưởng — dễ nhất vì toàn phím trắng",
        body: "Áp công thức từ nốt Đô, ta được **C D E F G A B C** — đúng bằng các phím trắng trên đàn, không cần dấu hoá nào.",
        example: {
          notes: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
          sequential: true,
          play: "arpeggio",
          caption: "Âm giai Đô trưởng — toàn phím trắng",
        },
      },
      {
        heading: "Vì sao các giọng khác cần dấu hoá?",
        body: "Bắt đầu từ nốt khác mà vẫn giữ đúng công thức 1-1-½-1-1-1-½, bạn buộc phải **thăng hoặc giáng vài nốt**. Ví dụ bắt đầu từ Sol thì phải thăng Fa (Fa#) — nên giọng Sol trưởng có 1 dấu thăng.\nĐó chính là lý do tồn tại của phần **dấu hoá ở đầu khuông**.",
      },
    ],
  },

  // ───────────────────────────── 8 ─────────────────────────────
  {
    id: "rhythm",
    title: "Trường độ & số chỉ nhịp",
    summary: "Nốt dài bao lâu, và ô nhịp chứa được gì",
    sections: [
      {
        heading: "Nốt không chỉ có cao độ",
        body: "Mỗi nốt còn có **trường độ** — tức là ngân dài bao lâu. Hình dáng nốt quyết định điều đó:",
        bullets: [
          "Nốt tròn (whole) = **4 phách**",
          "Nốt trắng (half) = **2 phách**",
          "Nốt đen (quarter) = **1 phách**",
          "Nốt móc đơn (eighth) = **½ phách**",
        ],
      },
      {
        heading: "Số chỉ nhịp đọc thế nào?",
        body: "Hai số ở đầu bài (ví dụ **4/4**) là **số chỉ nhịp**:",
        bullets: [
          "Số **trên** = mỗi ô nhịp có bao nhiêu **phách**",
          "Số **dưới** = loại nốt nào được tính là **1 phách** (4 = nốt đen)",
          "Nhịp 4/4 → 4 phách mỗi ô nhịp, mỗi phách là nốt đen",
          "Nhịp 3/4 (van-xơ) → 3 phách   •   Nhịp 2/4 → 2 phách",
        ],
      },
      {
        heading: "Ô nhịp phải \"đủ\"",
        body: "Các vạch dọc chia bản nhạc thành từng **ô nhịp**. Mỗi ô phải chứa **đúng tổng trường độ** mà số chỉ nhịp quy định.\nVí dụ nhịp 4/4: một ô có thể là 1 nốt tròn, hoặc 2 nốt trắng, hoặc 4 nốt đen — miễn tổng bằng 4 phách.",
      },
    ],
  },
];

export function getTheoryTopic(id: string): TheoryTopic | undefined {
  return THEORY_TOPICS.find((t) => t.id === id);
}
