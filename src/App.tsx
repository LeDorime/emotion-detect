import { useCallback, useEffect, useRef, useState } from "react";
import Webcam, { type WebcamHandle, type WebcamStatus } from "./components/Webcam";
import EmotionOverlay from "./components/EmotionOverlay";
import DeepAnalysisButton from "./components/DeepAnalysisButton";
import PrivacyNote from "./components/PrivacyNote";
import { useEmotionDetection } from "./lib/useEmotionDetection";
import { EMOTION_META } from "./lib/emotions";

export default function App() {
  const webcamRef = useRef<WebcamHandle>(null);
  const [camStatus, setCamStatus] = useState<WebcamStatus>("requesting");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [multipleCameras, setMultipleCameras] = useState(false);

  const getVideo = useCallback(() => webcamRef.current?.video ?? null, []);
  const { modelStatus, scores, emotion, confidence, facePresent } =
    useEmotionDetection(getVideo, camStatus === "active");

  // Offer a front/back toggle only when the device actually has more than one
  // camera. Labels need permission, but the count is enough here.
  useEffect(() => {
    if (camStatus !== "active" || !navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const cams = devices.filter((d) => d.kind === "videoinput");
        setMultipleCameras(cams.length > 1);
      })
      .catch(() => setMultipleCameras(false));
  }, [camStatus]);

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
          <Webcam
            ref={webcamRef}
            facingMode={facingMode}
            onStatusChange={setCamStatus}
          />

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

          {camStatus === "active" && modelStatus !== "ready" && (
            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-xs text-slate-200 backdrop-blur-sm">
              {modelStatus === "error" ? (
                "⚠️ model failed to load"
              ) : (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-500 border-t-slate-200" />
                  loading model…
                </>
              )}
            </div>
          )}

          {multipleCameras && camStatus === "active" && (
            <button
              type="button"
              onClick={() =>
                setFacingMode((m) => (m === "user" ? "environment" : "user"))
              }
              className="absolute bottom-3 right-3 rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-slate-100 backdrop-blur-sm transition hover:bg-black/60"
            >
              ↻ flip camera
            </button>
          )}
        </div>

        <EmotionOverlay
          emotion={emotion}
          confidence={confidence}
          scores={scores}
          facePresent={facePresent}
          modelStatus={modelStatus}
        />

        <DeepAnalysisButton getVideo={getVideo} disabled={camStatus !== "active"} />

        <PrivacyNote />

        <footer className="mt-4 text-center text-[11px] text-slate-600">
          On-device emotion detection with{" "}
          <a
            href="https://github.com/vladmandic/face-api"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-slate-700 underline-offset-2 hover:text-slate-400"
          >
            face-api
          </a>{" "}
          · Deep Analysis by Claude vision
        </footer>
      </main>
    </div>
  );
}
