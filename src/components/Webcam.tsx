import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export type WebcamStatus =
  | "requesting"
  | "active"
  | "denied"
  | "no-device"
  | "error";

export interface WebcamHandle {
  /** The underlying <video> element, or null before it mounts. */
  video: HTMLVideoElement | null;
  /** Re-request camera access (e.g. after the user fixes a permission). */
  retry: () => void;
}

interface WebcamProps {
  /** Which camera to use. "user" = front / selfie, "environment" = rear. */
  facingMode?: "user" | "environment";
  /** Notified whenever the camera status changes. */
  onStatusChange?: (status: WebcamStatus) => void;
  className?: string;
}

const statusCopy: Record<
  Exclude<WebcamStatus, "active">,
  { title: string; body: string; canRetry: boolean }
> = {
  requesting: {
    title: "Waiting for camera…",
    body: "Allow camera access in your browser to start live detection.",
    canRetry: false,
  },
  denied: {
    title: "Camera blocked",
    body: "Camera permission was denied. Enable it for this site in your browser settings, then try again.",
    canRetry: true,
  },
  "no-device": {
    title: "No camera found",
    body: "We couldn't find a camera on this device. Connect one and try again.",
    canRetry: true,
  },
  error: {
    title: "Camera unavailable",
    body: "Something went wrong starting the camera. It may be in use by another app.",
    canRetry: true,
  },
};

const Webcam = forwardRef<WebcamHandle, WebcamProps>(function Webcam(
  { facingMode = "user", onStatusChange, className },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<WebcamStatus>("requesting");
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setStatus("requesting");
    setAttempt((n) => n + 1);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      get video() {
        return videoRef.current;
      },
      retry,
    }),
    [retry],
  );

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) setStatus("error");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {
            /* autoplay can reject silently; the muted+playsinline video still shows */
          });
        }
        if (!cancelled) setStatus("active");
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setStatus("denied");
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setStatus("no-device");
        } else {
          setStatus("error");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facingMode, attempt]);

  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-white/10 ${className ?? ""}`}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        // Mirror the selfie view so it feels like a mirror.
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          status === "active" ? "opacity-100" : "opacity-0"
        } ${facingMode === "user" ? "-scale-x-100" : ""}`}
      />

      {status !== "active" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          {status === "requesting" ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-slate-300" />
          ) : (
            <div className="text-3xl">📷</div>
          )}
          <div className="text-sm font-semibold text-slate-200">
            {statusCopy[status].title}
          </div>
          <div className="max-w-xs text-xs leading-relaxed text-slate-400">
            {statusCopy[status].body}
          </div>
          {statusCopy[status].canRetry && (
            <button
              type="button"
              onClick={retry}
              className="mt-1 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-white/20"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default Webcam;
