import { useEffect, useRef, useState } from "react";
import {
  emptyScores,
  smoothScores,
  topEmotion,
  type Emotion,
  type Scores,
} from "./emotions";

export type ModelStatus = "idle" | "loading" | "ready" | "error";

export interface EmotionState {
  modelStatus: ModelStatus;
  /** Smoothed probability per emotion. */
  scores: Scores;
  /** Top emotion of the smoothed scores. */
  emotion: Emotion;
  confidence: number;
  /** Whether a face was seen in the most recent successful pass. */
  facePresent: boolean;
}

const DETECT_INTERVAL_MS = 120;
// Drop to "no face" only after a short run of empty passes, to avoid flicker
// when the detector briefly loses the face between frames.
const MISS_GRACE = 5;

/**
 * Loads the model (lazily importing the heavy face-api bundle) once `enabled`
 * is true, then polls `getVideo()` for expression readings on an interval and
 * exposes smoothed results.
 */
export function useEmotionDetection(
  getVideo: () => HTMLVideoElement | null,
  enabled: boolean,
): EmotionState {
  const [modelStatus, setModelStatus] = useState<ModelStatus>("idle");
  const [scores, setScores] = useState<Scores>(emptyScores);
  const [facePresent, setFacePresent] = useState(false);

  const scoresRef = useRef<Scores>(emptyScores());
  const missStreakRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let detect: ((v: HTMLVideoElement) => Promise<
      { scores: Scores; faceScore: number } | null
    >) | null = null;

    async function boot() {
      setModelStatus((s) => (s === "ready" ? s : "loading"));
      try {
        const mod = await import("./emotionModel");
        await mod.loadModels();
        if (cancelled) return;
        detect = mod.detectExpression;
        setModelStatus("ready");
        loop();
      } catch (err) {
        if (cancelled) return;
        console.error("[emotion-detect] model load failed", err);
        setModelStatus("error");
      }
    }

    async function loop() {
      if (cancelled || !detect) return;
      const started = performance.now();
      const video = getVideo();

      if (video) {
        try {
          const result = await detect(video);
          if (!cancelled) {
            if (result) {
              missStreakRef.current = 0;
              scoresRef.current = smoothScores(scoresRef.current, result.scores);
              setScores({ ...scoresRef.current });
              setFacePresent(true);
            } else if (++missStreakRef.current >= MISS_GRACE) {
              setFacePresent(false);
            }
          }
        } catch (err) {
          if (!cancelled) console.error("[emotion-detect] detection error", err);
        }
      }

      if (cancelled) return;
      const elapsed = performance.now() - started;
      timer = setTimeout(loop, Math.max(0, DETECT_INTERVAL_MS - elapsed));
    }

    boot();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, getVideo]);

  const { emotion, confidence } = topEmotion(scores);
  return { modelStatus, scores, emotion, confidence, facePresent };
}
