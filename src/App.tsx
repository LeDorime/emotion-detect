export default function App() {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <h1 className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
        emotion-detect
      </h1>
      <p className="max-w-md text-sm text-slate-400">
        Point your webcam at your face and see your emotion, live. Detection runs
        entirely in your browser.
      </p>
      <p className="mt-8 text-xs text-slate-600">Scaffold ready — build in progress.</p>
    </main>
  );
}
