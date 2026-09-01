import { EMOTIONS, EMOTION_META, type Emotion, type Scores } from "../lib/emotions";
import type { ModelStatus } from "../lib/useEmotionDetection";

interface EmotionOverlayProps {
  emotion: Emotion;
  confidence: number;
  scores: Scores;
  facePresent: boolean;
  modelStatus: ModelStatus;
}

export default function EmotionOverlay({
  emotion,
  confidence,
  scores,
  facePresent,
  modelStatus,
}: EmotionOverlayProps) {
  const meta = EMOTION_META[emotion];
  const live = modelStatus === "ready" && facePresent;

  const headline =
    modelStatus === "loading" || modelStatus === "idle"
      ? "Warming up the model…"
      : modelStatus === "error"
        ? "Couldn't load the model"
        : facePresent
          ? meta.label
          : "Looking for a face…";

  return (
    <section className="w-full rounded-2xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <span
          key={live ? emotion : headline}
          className="text-6xl leading-none animate-pop"
          aria-hidden
        >
          {modelStatus === "error" ? "⚠️" : live ? meta.emoji : "🙂"}
        </span>

        <div className="min-w-0 flex-1">
          <div
            className="truncate text-2xl font-bold transition-colors duration-500"
            style={{ color: live ? meta.accent : "#cbd5e1" }}
          >
            {headline}
          </div>
          <div className="mt-0.5 text-sm text-slate-400">
            {live
              ? `${(confidence * 100).toFixed(0)}% confidence`
              : modelStatus === "ready"
                ? "Center your face in the frame"
                : "Live detection runs on your device"}
          </div>
        </div>
      </div>

      {/* Primary confidence bar for the current emotion. */}
      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width,background-color] duration-300 ease-out"
          style={{
            width: `${live ? Math.round(confidence * 100) : 0}%`,
            backgroundColor: meta.accent,
          }}
        />
      </div>

      {/* Per-emotion mini bars. */}
      <ul className="mt-5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {EMOTIONS.map((e) => {
          const value = live ? scores[e] : 0;
          const isTop = live && e === emotion;
          return (
            <li key={e} className="flex items-center gap-2">
              <span className="w-4 text-center text-xs" aria-hidden>
                {EMOTION_META[e].emoji}
              </span>
              <span
                className={`w-16 shrink-0 text-xs ${
                  isTop ? "font-semibold text-slate-200" : "text-slate-400"
                }`}
              >
                {EMOTION_META[e].label}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{
                    width: `${(value * 100).toFixed(1)}%`,
                    backgroundColor: EMOTION_META[e].accent,
                    opacity: isTop ? 1 : 0.55,
                  }}
                />
              </span>
              <span className="w-8 text-right text-[10px] tabular-nums text-slate-500">
                {(value * 100).toFixed(0)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
