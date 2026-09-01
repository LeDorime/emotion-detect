export default function PrivacyNote() {
  return (
    <p className="max-w-md text-balance text-center text-xs leading-relaxed text-slate-500">
      <span className="font-semibold text-slate-400">Private by default.</span>{" "}
      Live emotion detection runs entirely in your browser — your camera feed
      never leaves this device. Only the optional{" "}
      <span className="font-medium text-slate-400">Deep Analysis</span> button
      sends a single still frame off-device, and only when you click it.
    </p>
  );
}
