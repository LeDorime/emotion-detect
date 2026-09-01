# emotion-detect — Project Brief for Claude Code

## What this app does
A web app that uses the user's webcam to look at their face and determine
their current emotion, displaying it live in an engaging way (label, emoji,
confidence, and/or a color-coded visual).

## First step: inspect the existing repo before assuming anything
This project already has a repo: https://github.com/LeDorime/emotion-detect
Before scaffolding anything new:
1. Clone/pull the repo and read its current contents in full.
2. Check for an existing framework, package.json, or partial implementation.
3. If the repo is empty or just a placeholder, follow the recommendations
   below. If it already has a stack in place, follow that stack instead
   of introducing a competing one — reconcile with the user first if the
   existing setup conflicts with what's below.

## Recommended architecture: hybrid approach
There are two ways to do "AI vision" here, with a real trade-off:

- **Live/real-time (client-side model):** run a small pretrained
  facial-expression model directly in the browser (e.g. face-api.js or a
  TensorFlow.js face-expression model) against the webcam feed. Fast,
  free per-use, works without sending video anywhere, good for continuous
  live feedback.
- **Deep analysis (server-side vision AI):** capture a single snapshot
  and send it to a vision-capable AI (Claude's vision API) for a richer,
  more nuanced read (e.g. "genuine smile, slightly tired eyes" instead of
  just "happy: 82%"). Slower and costs an API call per use, not suitable
  for continuous real-time use.

Recommendation: build the live client-side detector as the core
experience, then add an optional "Deep Analysis" button that captures the
current frame and sends it for the richer AI read. This gives instant
feedback by default plus a premium/richer mode on demand.

## Recommended tech stack
- Framework: React + Vite, TypeScript
- Client-side emotion model: face-api.js (or TensorFlow.js equivalent)
  running against `<video>` from `navigator.mediaDevices.getUserMedia`
- Styling: Tailwind CSS
- Deep-analysis backend: a minimal serverless function (e.g. Vercel
  function) that accepts a base64 image and calls the Anthropic API with
  vision input. Keep the API key server-side only.
- No database needed for v1 — this is a live, in-session experience with
  no need to persist data.
- Deployment target: Vercel.

## Suggested project structure
```
emotion-detect/
  src/
    App.tsx
    components/
      Webcam.tsx            # camera access + video element
      EmotionOverlay.tsx    # live label/emoji/confidence display
      DeepAnalysisButton.tsx
    lib/
      emotionModel.ts       # face-api.js / TF.js loading + inference
  api/
    deep-analyze.ts         # serverless function calling Claude vision
  public/
    models/                 # pretrained model weights, if self-hosted
  .env.example
  .gitignore
  CLAUDE.md
```

## Core build tasks (rough order)
1. Read the existing repo, confirm/adjust the stack as noted above.
2. Get webcam access working and rendering the live video feed.
3. Load the client-side emotion model and get live predictions running
   against the video stream.
4. Build the live overlay UI: emotion label + emoji + confidence,
   updating in real time.
5. Add the "Deep Analysis" button and its serverless endpoint calling
   Claude's vision API on a captured frame.
6. Polish: handle no-webcam-permission gracefully, loading states while
   the model loads, mobile camera support, privacy note in the UI (video
   never leaves the browser except when the user explicitly triggers
   Deep Analysis).

## Environment variables
```
ANTHROPIC_API_KEY=
```
(Only needed for the Deep Analysis serverless function — the live
detector runs entirely client-side and needs no API key.)

## Git & GitHub workflow (required)
The repo already exists — do not re-initialize it.

1. Clone the existing repo (or `git pull` if already local) before
   starting any work, so you're building on the latest state.
2. Work on `main` for normal incremental work; only branch off if
   attempting something experimental/risky that might need to be
   discarded.
3. **Commit after every completed task or feature** — not multiple
   unrelated changes bundled together, and not half-finished work.
   Use conventional commit prefixes:
   - `feat:` new functionality
   - `fix:` bug fixes
   - `refactor:` code change with no behavior change
   - `style:` formatting/UI-only tweaks
   - `docs:` documentation
   - `chore:` tooling/config
4. Push to GitHub after each commit so the remote stays current.
5. Never commit `.env` files or API keys; verify `.gitignore` covers them
   before the first commit you make in this session.

## Style/UX notes
- The live detection should feel responsive and a bit fun — this is the
  kind of app people show off to friends, so smooth transitions between
  emotion states and a visually pleasing overlay matter.
- Be upfront in the UI about privacy: clarify that live detection is
  local/on-device, and that Deep Analysis is the only feature that sends
  an image off the device.

---

## Implementation notes (added during build)

- **Stack as built:** React 18 + Vite 5 + TypeScript + Tailwind CSS v3.
  Vite is pinned to 5.x because Vite 7/8 require Node >= 20.19 and the dev
  machine runs Node 20.10. Safe to bump once Node is upgraded.
- **Client emotion model:** `@vladmandic/face-api` (maintained fork of
  face-api.js — same API, works with modern TensorFlow.js and Vite with no
  patching). Models used: `tinyFaceDetector` + `faceExpressionNet`
  (7 expressions: neutral, happy, sad, angry, fearful, disgusted,
  surprised). Weights live in `public/models/` and are committed to the
  repo (~0.5 MB) so no runtime download step is needed. Re-fetch them with
  `npm run fetch-models`.
- **Deep Analysis:** `api/deep-analyze.ts` is a Vercel Node serverless
  function. It takes a base64 JPEG, calls the Anthropic Messages API with
  vision input (`claude-sonnet-5`, `effort: "low"`), and returns
  `{ summary, details }`. Requires `ANTHROPIC_API_KEY` set in the Vercel
  project. Costs roughly 1 cent per click; the live detector is free.
