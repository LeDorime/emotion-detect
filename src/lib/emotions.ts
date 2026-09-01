// Metadata + small helpers for the 7 expressions face-api's faceExpressionNet
// returns. Keeping this framework-agnostic so both the live overlay and any
// future UI can share it.

export const EMOTIONS = [
  "neutral",
  "happy",
  "sad",
  "angry",
  "fearful",
  "disgusted",
  "surprised",
] as const;

export type Emotion = (typeof EMOTIONS)[number];

export type Scores = Record<Emotion, number>;

interface EmotionMeta {
  label: string;
  emoji: string;
  /** Accent colour used for the overlay text + confidence bar. */
  accent: string;
  /** Base colour for the full-bleed background wash (blended with the page). */
  wash: string;
}

export const EMOTION_META: Record<Emotion, EmotionMeta> = {
  neutral: { label: "Neutral", emoji: "😐", accent: "#94a3b8", wash: "#334155" },
  happy: { label: "Happy", emoji: "😄", accent: "#fbbf24", wash: "#b45309" },
  sad: { label: "Sad", emoji: "😢", accent: "#60a5fa", wash: "#1d4ed8" },
  angry: { label: "Angry", emoji: "😠", accent: "#f87171", wash: "#b91c1c" },
  fearful: { label: "Fearful", emoji: "😨", accent: "#c084fc", wash: "#6d28d9" },
  disgusted: {
    label: "Disgusted",
    emoji: "🤢",
    accent: "#4ade80",
    wash: "#15803d",
  },
  surprised: {
    label: "Surprised",
    emoji: "😲",
    accent: "#22d3ee",
    wash: "#0e7490",
  },
};

/** Zeroed score map. */
export function emptyScores(): Scores {
  return {
    neutral: 0,
    happy: 0,
    sad: 0,
    angry: 0,
    fearful: 0,
    disgusted: 0,
    surprised: 0,
  };
}

/** Highest-scoring emotion and its probability. */
export function topEmotion(scores: Scores): { emotion: Emotion; confidence: number } {
  let emotion: Emotion = "neutral";
  let confidence = -Infinity;
  for (const e of EMOTIONS) {
    if (scores[e] > confidence) {
      confidence = scores[e];
      emotion = e;
    }
  }
  return { emotion, confidence: Math.max(0, confidence) };
}

/**
 * Exponential moving average between the last smoothed scores and a fresh
 * reading. `alpha` is the weight of the new reading (0..1) — lower is smoother
 * but laggier. Reduces the frame-to-frame jitter in raw predictions.
 */
export function smoothScores(prev: Scores, next: Scores, alpha = 0.35): Scores {
  const out = emptyScores();
  for (const e of EMOTIONS) {
    out[e] = prev[e] + alpha * (next[e] - prev[e]);
  }
  return out;
}
