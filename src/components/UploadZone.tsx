"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import LoadingSpinner from "./LoadingSpinner";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadZone() {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [industry, setIndustry] = useState("general");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setError("");

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Please upload a JPG, PNG, or WebP image.");
        return;
      }

      if (file.size > MAX_SIZE) {
        setError("File size must be under 10MB.");
        return;
      }

      setUploading(true);

      try {
        const supabase = getSupabaseBrowser();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setError("Please log in to upload.");
          return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("industry", industry);

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Upload failed");
          return;
        }

        // Trigger analysis
        await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ auditId: data.auditId }),
        });

        router.push(`/audits/${data.auditId}`);
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [industry, router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraError("");
  };

  const startCamera = async () => {
    setError("");
    setCameraError("");

    // Check if getUserMedia is available
    if (!navigator.mediaDevices?.getUserMedia) {
      // Fallback: use file input with capture attribute (mobile)
      cameraInputRef.current?.click();
      return;
    }

    try {
      // Stop any existing stream
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraActive(true);

      // Wait for video element to be in DOM
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch (err) {
      const message =
        err instanceof DOMException
          ? err.name === "NotAllowedError"
            ? "Camera access denied. Please allow camera permission in your browser settings."
            : err.name === "NotFoundError"
            ? "No camera found on this device."
            : `Camera error: ${err.message}`
          : "Could not access camera.";
      setCameraError(message);
    }
  };

  const switchCamera = async () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);

    if (cameraActive) {
      stopCamera();
      // Restart with new facing mode after state update
      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: newMode,
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          });
          streamRef.current = stream;
          setCameraActive(true);
          requestAnimationFrame(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          });
        } catch {
          setCameraError("Could not switch camera.");
        }
      }, 100);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Failed to capture photo.");
          return;
        }

        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        stopCamera();
        processFile(file);
      },
      "image/jpeg",
      0.9
    );
  };

  // Handle camera capture input (mobile fallback)
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="industry" className="mb-1.5 block text-sm font-medium">
          Industry Type
        </label>
        <select
          id="industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="input-field max-w-xs"
        >
          <option value="general">General</option>
          <option value="restaurant">Restaurant</option>
          <option value="construction">Construction</option>
          <option value="warehouse">Warehouse</option>
          <option value="retail">Retail</option>
          <option value="office">Office</option>
        </select>
      </div>

      {/* Hidden camera input for mobile fallback */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera View */}
      {cameraActive && (
        <div className="overflow-hidden rounded-2xl border-2 border-accent bg-black">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full"
            />

            {/* Camera controls overlay */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
              {/* Switch camera */}
              <button
                onClick={switchCamera}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30"
                title="Switch camera"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Capture button */}
              <button
                onClick={capturePhoto}
                className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 transition hover:bg-white/40"
                title="Take photo"
              >
                <div className="h-12 w-12 rounded-full bg-white" />
              </button>

              {/* Cancel */}
              <button
                onClick={stopCamera}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30"
                title="Cancel"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera error */}
      {cameraError && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger">
          {cameraError}
        </div>
      )}

      {/* Upload / Drag Drop Zone */}
      {!cameraActive && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-14 text-center transition-all duration-300 ${
            dragOver
              ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
              : "border-border/60 hover:border-accent/30 hover:bg-accent/[0.02]"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner size="lg" />
              <div>
                <p className="font-medium">Analyzing your workspace...</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This usually takes 30-60 seconds
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent2/10">
                <svg
                  className="h-8 w-8 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-base font-semibold">
                Drag & drop a workplace photo
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                JPG, PNG, or WebP up to 10MB
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {/* Choose File button */}
                <label className="btn-primary cursor-pointer text-sm">
                  Choose File
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>

                {/* Take Photo button */}
                <button
                  type="button"
                  onClick={startCamera}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Take Photo
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-danger/10 border border-danger/20 p-3 text-sm text-danger">{error}</div>
      )}
    </div>
  );
}
