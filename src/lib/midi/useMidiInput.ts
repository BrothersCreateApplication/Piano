/**
 * Hook kết nối đàn MIDI vật lý qua WebMidi.js v3.
 * Lắng nghe noteon/noteoff từ mọi input và đẩy vào store.
 *
 * Nạp ĐỘNG `webmidi` bên trong effect để không bị đánh giá lúc SSR.
 * Lưu ý API v3: `addListener('noteon', cb)` (KHÔNG có tham số 'all');
 * tên nốt đầy đủ ở `e.note.identifier`, vận tốc ở `e.note.rawAttack`.
 */
"use client";

import { useEffect, useState } from "react";
import { usePracticeStore } from "@/store/usePracticeStore";
import type { MidiStatus } from "@/lib/types";

type WebMidiType = (typeof import("webmidi"))["WebMidi"];
type InputType = import("webmidi").Input;

export function useMidiInput(): MidiStatus {
  const [status, setStatus] = useState<MidiStatus>({
    supported: true,
    enabled: false,
    inputName: null,
    error: null,
  });

  const pressNote = usePracticeStore((s) => s.pressNote);
  const releaseNote = usePracticeStore((s) => s.releaseNote);

  useEffect(() => {
    let cancelled = false;
    const cleanups: (() => void)[] = [];

    async function setup() {
      if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
        setStatus({
          supported: false,
          enabled: false,
          inputName: null,
          error: "Trình duyệt không hỗ trợ Web MIDI. Hãy dùng Chrome hoặc Edge.",
        });
        return;
      }

      let WebMidi: WebMidiType;
      try {
        ({ WebMidi } = await import("webmidi"));
      } catch {
        setStatus((s) => ({ ...s, error: "Không tải được thư viện MIDI." }));
        return;
      }

      try {
        await WebMidi.enable({ sysex: false });
      } catch (err) {
        if (cancelled) return;
        setStatus({
          supported: true,
          enabled: false,
          inputName: null,
          error: err instanceof Error ? err.message : "Không bật được MIDI",
        });
        return;
      }
      if (cancelled) return;

      const attached = new Set<InputType>();

      function attach(input: InputType) {
        if (attached.has(input)) return;
        attached.add(input);
        input.addListener("noteon", (e) => {
          if (e.note.rawAttack === 0) releaseNote(e.note.identifier);
          else pressNote(e.note.identifier);
        });
        input.addListener("noteoff", (e) => releaseNote(e.note.identifier));
        cleanups.push(() => {
          input.removeListener("noteon");
          input.removeListener("noteoff");
        });
      }

      const syncName = () =>
        setStatus((s) => ({ ...s, inputName: WebMidi.inputs[0]?.name ?? null }));

      WebMidi.inputs.forEach(attach);
      setStatus({
        supported: true,
        enabled: true,
        inputName: WebMidi.inputs[0]?.name ?? null,
        error: null,
      });

      const onConnected = () => {
        WebMidi.inputs.forEach(attach);
        syncName();
      };
      const onDisconnected = () => syncName();
      WebMidi.addListener("connected", onConnected);
      WebMidi.addListener("disconnected", onDisconnected);
      cleanups.push(() => {
        WebMidi.removeListener("connected", onConnected);
        WebMidi.removeListener("disconnected", onDisconnected);
      });
    }

    void setup();

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, [pressNote, releaseNote]);

  return status;
}
