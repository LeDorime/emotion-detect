import { useCallback, useRef, useState } from "react";
import Webcam, { type WebcamHandle, type WebcamStatus } from "./components/Webcam";
import EmotionOverlay from "./components/EmotionOverlay";
import PrivacyNote from "./components/PrivacyNote";
import { useEmotionDetection } from "./lib/useEmotionDetection";
import { EMOTION_META } from "./lib/emotions";

export default function App() {
  const webcamRef = useRef<WebcamHandle>(null);
  const [camStatus, setCamStatus] = useState<WebcamStatus>("requesting");

  const getVideo = useCallback(() => webcamRef.current?.video ?? null, []);
  const { modelStatus, scores, emotion, confidence, facePresent } =
    useEmotionDetection(getVideo, camStatus === "active");

  const live = camStatus === "active" && modelStatus === "ready" && facePresent;
  const meta = EMOTION_META[emotion];

  return (
    <div className="relative min-h-full">
      {/* Full-bleed colour wash that eases toward the current emotion. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 transition-colors duration-700 ease-out"
        style={{ backgroundColor: live ? meta.wash : "#0b0f19" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[#0b0f19]/80"
      />

      <main className="mx-auto flex min-h-full max-w-xl flex-col items-center gap-6 px-4 py-10">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            emotion-detect
          </h1>
          <p className="max-w-sm text-sm text-slate-400">
            Point your webcam at your face and see your emotion, live.
          </p>
        </header>

        <div className="relative w-full">
          <Webcam ref={webcamRef} onStatusChange={setCamStatus} />
          {live && (
            <div
              key={emotion}
              className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-sm font-semibold backdrop-blur-sm animate-pop"
              style={{ color: meta.accent }}
            >
              <span className="text-lg leading-none" aria-hidden>
                {meta.emoji}
              </span>
              {meta.label}
            </div>
          )}
        </div>

        <EmotionOverlay
          emotion={emotion}
          confidence={confidence}
          scores={scores}
          facePresent={facePresent}
          modelStatus={modelStatus}
        />

        <PrivacyNote />
      </main>
    </div>
  );
}
