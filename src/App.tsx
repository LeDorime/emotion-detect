import { useRef, useState } from "react";
import Webcam, { type WebcamHandle, type WebcamStatus } from "./components/Webcam";
import PrivacyNote from "./components/PrivacyNote";

export default function App() {
  const webcamRef = useRef<WebcamHandle>(null);
  const [camStatus, setCamStatus] = useState<WebcamStatus>("requesting");

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

      <div className="text-xs text-slate-600">
        camera: <span className="font-mono text-slate-400">{camStatus}</span>
      </div>

      <PrivacyNote />
    </main>
  );
}
