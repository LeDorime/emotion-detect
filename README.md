# emotion-detect

A web app that reads your emotion from your webcam, live, and shows it with a
label, emoji, confidence, and a color-coded overlay. Live detection runs
**entirely in your browser** — no video or image is sent anywhere.

An optional **Deep Analysis** button captures one frame and sends it to Claude's
vision API for a richer, more nuanced read (e.g. "genuine smile, slightly tired
eyes"). That is the only feature that sends an image off your device, and only
when you click it.

## Stack

- React 18 + Vite 5 + TypeScript
- Tailwind CSS v3
- [`@vladmandic/face-api`](https://github.com/vladmandic/face-api) — `tinyFaceDetector` + `faceExpressionNet`, running on TensorFlow.js
- Vercel serverless function (`api/deep-analyze.ts`) for Deep Analysis, calling the Anthropic API

## Getting started

```bash
npm install
npm run fetch-models   # downloads face-api weights into public/models/ (already committed)
npm run dev            # http://localhost:5173
```

Grant camera permission when prompted. Everything else is automatic.

## Deep Analysis (optional)

The live detector needs no API key. Deep Analysis calls the Anthropic API, so it
needs `ANTHROPIC_API_KEY` set as an environment variable where the serverless
function runs.

- **Local:** `npx vercel dev` with `ANTHROPIC_API_KEY` in a `.env` file (git-ignored).
- **Production (Vercel):** `vercel env add ANTHROPIC_API_KEY` or set it in the
  Vercel dashboard under Settings → Environment Variables.

Model is `claude-sonnet-5` (~1¢ per click). Swap to `claude-opus-5` in
`api/deep-analyze.ts` for a richer read at higher cost.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run fetch-models` | Re-download face-api model weights into `public/models/` |

## Privacy

Live emotion detection happens on-device via a small model running in your
browser. The webcam stream never leaves your machine. The single exception is
Deep Analysis: clicking it uploads one still frame to the serverless function,
which forwards it to the Anthropic API for that one request.
