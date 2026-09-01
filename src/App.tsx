import { useCallback, useRef, useState } from "react";
import Webcam, { type WebcamHandle, type WebcamStatus } from "./components/Webcam";
import PrivacyNote from "./components/PrivacyNote";
import { useEmotionDetection } from "./lib/useEmotionDetection";
import { EMOTIONS, EMOTION_META } from "./lib/emotions";

export default function App() {
  const webcamRef = useRef<WebcamHandle>(null);
  const [camStatus, setCamStatus] = useState<WebcamStatus>("requesting");

  const getVideo = useCallback(() => webcamRef.current?.video ?? null, []);
  const { modelStatus, scores, emotion, confidence, facePresent } =
    useEmotionDetection(getVideo, camStatus === "active");

  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col items-center gap-6 px-4 py-10">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
          emotion-detect
        </h1>
        <p className="max-w-sm text-sm text-slate-400">
          Point your webcam at your face and see your emotion, live.
        </p>
      </header>

      <Webcam ref={webcamRef} onStatusChange={setCamStatus} />

      {/* Placeholder readout — replaced by the animated overlay in the next step. */}
      <section className="w-full rounded-xl bg-white/5 p-4 text-sm">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-slate-400">
            model: <span className="font-mono text-slate-300">{modelStatus}</span>
            {" · "}camera:{" "}
            <span className="font-mono text-slate-300">{camStatus}</span>
          </span>
          <span className="text-slate-500">
            {facePresent ? "face detected" : "no face"}
          </span>
        </div>

        <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <span className="text-2xl">{EMOTION_META[emotion].emoji}</span>
          <span>{EMOTION_META[emotion].label}</span>
          <span className="text-slate-500">
            {(confidence * 100).toFixed(0)}%
          </span>
        </div>

        <ul className="space-y-1">
          {EMOTIONS.map((e) => (
            <li key={e} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-xs text-slate-400">
                {EMOTION_META[e].label}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full transition-[width] duration-150"
                  style={{
                    width: `${(scores[e] * 100).toFixed(1)}%`,
                    backgroundColor: EMOTION_META[e].accent,
                  }}
                />
              </span>
            </li>
          ))}
        </ul>
      </section>

      <PrivacyNote />
    </main>
  );
}
