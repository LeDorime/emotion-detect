// Thin wrapper around @vladmandic/face-api: load the two small nets we need and
// run a single-face expression read against a <video> frame. The heavy
// tensorflow/face-api bundle is imported here (and this module is imported
// lazily by the app) so it never blocks first paint.

import * as faceapi from "@vladmandic/face-api";
import { EMOTIONS, emptyScores, type Scores } from "./emotions";

const MODEL_URL = "/models";

let loadPromise: Promise<void> | null = null;

/** Idempotent: loads the tinyFaceDetector + faceExpressionNet weights once. */
export function loadModels(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      // face-api initialises its TF backend on first use; just load the nets.
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
    })().catch((err) => {
      // Let a later call retry instead of caching the failure forever.
      loadPromise = null;
      throw err;
    });
  }
  return loadPromise;
}

const detectorOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 224,
  scoreThreshold: 0.4,
});

export interface Detection {
  scores: Scores;
  /** Detector confidence that a face is present (0..1). */
  faceScore: number;
}

/**
 * Runs one detection pass. Returns null when no face is found or the video
 * isn't ready yet. Assumes loadModels() has resolved.
 */
export async function detectExpression(
  video: HTMLVideoElement,
): Promise<Detection | null> {
  if (video.readyState < 2 || video.videoWidth === 0) return null;

  const result = await faceapi
    .detectSingleFace(video, detectorOptions)
    .withFaceExpressions();

  if (!result) return null;

  const scores = emptyScores();
  for (const e of EMOTIONS) {
    scores[e] = result.expressions[e] ?? 0;
  }
  return { scores, faceScore: result.detection.score };
}
