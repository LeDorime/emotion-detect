import { useCallback, useRef, useState } from "react";

interface DeepAnalysisButtonProps {
  getVideo: () => HTMLVideoElement | null;
  disabled?: boolean;
}

interface DeepResult {
  summary: string;
  details: string;
}

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; result: DeepResult }
  | { kind: "error"; message: string };

// Longest edge of the frame we upload. Small keeps the request cheap and fast;
// the vision model doesn't need more for a face read.
const MAX_EDGE = 640;
const JPEG_QUALITY = 0.85;

function captureFrame(video: HTMLVideoElement): string | null {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return null;

  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export default function DeepAnalysisButton({
  getVideo,
  disabled,
}: DeepAnalysisButtonProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    const video = getVideo();
    if (!video) {
      setPhase({ kind: "error", message: "Camera isn't ready yet." });
      return;
    }
    const image = captureFrame(video);
    if (!image) {
      setPhase({ kind: "error", message: "Couldn't grab a frame from the camera." });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase({ kind: "loading" });

    try {
      const res = await fetch("/api/deep-analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image }),
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => ({}))) as Partial<DeepResult> & {
        error?: string;
      };
      if (!res.ok) {
        setPhase({
          kind: "error",
          message: data.error ?? `Request failed (${res.status}).`,
        });
        return;
      }
      setPhase({
        kind: "done",
        result: {
          summary: data.summary ?? "Deep read",
          details: data.details ?? "",
        },
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      setPhase({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Network error running Deep Analysis.",
      });
    }
  }, [getVideo]);

  const busy = phase.kind === "loading";

  return (
    <section className="w-full">
      <button
        type="button"
        onClick={run}
        disabled={disabled || busy}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500/90 to-sky-500/90 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-900/20 transition hover:from-fuchsia-400 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Analyzing…
          </>
        ) : (
          <>✨ Deep Analysis</>
        )}
      </button>

      <p className="mt-2 text-center text-[11px] text-slate-500">
        Sends one still frame to Claude for a richer read. This is the only time an
        image leaves your device.
      </p>

      {phase.kind === "done" && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.06] p-4 animate-fade-in">
          <div className="text-sm font-semibold text-slate-100">
            {phase.result.summary}
          </div>
          {phase.result.details && (
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              {phase.result.details}
            </p>
          )}
          <button
            type="button"
            onClick={run}
            className="mt-3 text-xs font-medium text-sky-400 hover:text-sky-300"
          >
            Analyze again
          </button>
        </div>
      )}

      {phase.kind === "error" && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200 animate-fade-in">
          {phase.message}
        </div>
      )}
    </section>
  );
}
