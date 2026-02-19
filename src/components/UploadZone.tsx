"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import LoadingSpinner from "./LoadingSpinner";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_BULK_FILES = 10;

interface UploadZoneProps {
  plan?: string;
  remainingAudits?: number;
}

interface StagedFile {
  file: File;
  preview: string;
}

export default function UploadZone({ plan = "none", remainingAudits }: UploadZoneProps) {
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

  // Pro bulk upload state
  const isPro = plan === "pro";
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [auditName, setAuditName] = useState("");

  // Clean up camera stream and object URLs on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stagedFiles.forEach((sf) => URL.revokeObjectURL(sf.preview));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.name.length > 50) return "File name must be 50 characters or less.";
    if (!ACCEPTED_TYPES.includes(file.type)) return "Please upload a JPG, PNG, or WebP image.";
    if (file.size > MAX_SIZE) return "File size must be under 10MB.";
    return null;
  };

  const uploadAndAnalyze = async (files: File[], name?: string) => {
    setUploading(true);
    setError("");

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
      if (files.length === 1) {
        formData.append("file", files[0]);
      } else {
        files.forEach((f) => formData.append("files", f));
      }
      formData.append("industry", industry);
      if (name) {
        formData.append("audit_name", name);
      }

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
  };

  // Single file flow (non-Pro or single file from Pro)
  const processFile = useCallback(
    async (file: File) => {
      setError("");
      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }

      if (isPro) {
        // Stage the file instead of uploading immediately
        addFilesToStaging([file]);
        return;
      }

      await uploadAndAnalyze([file]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [industry, router, isPro]
  );

  const addFilesToStaging = (newFiles: File[]) => {
    setError("");
    const currentCount = stagedFiles.length;
    const available = MAX_BULK_FILES - currentCount;

    if (available <= 0) {
      setError(`Maximum ${MAX_BULK_FILES} images per bulk upload.`);
      return;
    }

    const filesToAdd = newFiles.slice(0, available);
    if (newFiles.length > available) {
      setError(`Only ${available} more image${available === 1 ? "" : "s"} can be added (max ${MAX_BULK_FILES}).`);
    }

    for (const file of filesToAdd) {
      const err = validateFile(file);
      if (err) {
        setError(`${file.name}: ${err}`);
        return;
      }
    }

    const staged = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setStagedFiles((prev) => [...prev, ...staged]);
  };

  const removeStagedFile = (index: number) => {
    setStagedFiles((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleBulkUpload = async () => {
    if (stagedFiles.length === 0) return;

    if (stagedFiles.length > 1 && !auditName.trim()) {
      setError("Please enter a project/audit name for bulk uploads.");
      return;
    }

    const files = stagedFiles.map((sf) => sf.file);
    const name = auditName.trim() || undefined;
    await uploadAndAnalyze(files, name);

    // Clean up previews
    stagedFiles.forEach((sf) => URL.revokeObjectURL(sf.preview));
    setStagedFiles([]);
    setAuditName("");
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files);

      if (isPro) {
        addFilesToStaging(droppedFiles);
      } else {
        const file = droppedFiles[0];
        if (file) processFile(file);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [processFile, isPro, stagedFiles]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (isPro) {
      addFilesToStaging(files);
    } else {
      const file = files[0];
      if (file) processFile(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = "";
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

        if (isPro) {
          // Stage the photo and keep camera open for more captures
          addFilesToStaging([file]);
        } else {
          stopCamera();
          processFile(file);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  // Handle camera capture input (mobile fallback)
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isPro) {
      addFilesToStaging([file]);
    } else {
      processFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

      {/* Pro: Audit Name input */}
      {isPro && (
        <div>
          <label htmlFor="audit-name" className="mb-1.5 block text-sm font-medium">
            Project / Audit Name
            {stagedFiles.length > 1 && <span className="ml-1 text-xs text-danger">*</span>}
          </label>
          <input
            id="audit-name"
            type="text"
            value={auditName}
            onChange={(e) => setAuditName(e.target.value)}
            placeholder="e.g. Kitchen Safety Inspection — Feb 2026"
            maxLength={100}
            className="input-field max-w-md"
          />
          {stagedFiles.length <= 1 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Optional for single uploads, required for bulk uploads
            </p>
          )}
        </div>
      )}

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

            {/* Pro: photo counter at top */}
            {isPro && (
              <div className="absolute inset-x-0 top-0 flex items-center justify-center bg-gradient-to-b from-black/60 to-transparent p-3">
                <span className="rounded-full bg-black/50 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
                  {stagedFiles.length} / {MAX_BULK_FILES} photos
                </span>
              </div>
            )}

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

              {/* Capture button — disabled at max */}
              <button
                onClick={capturePhoto}
                disabled={isPro && stagedFiles.length >= MAX_BULK_FILES}
                className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 transition hover:bg-white/40 disabled:opacity-40 disabled:cursor-not-allowed"
                title={isPro && stagedFiles.length >= MAX_BULK_FILES ? "Maximum photos reached" : "Take photo"}
              >
                <div className="h-12 w-12 rounded-full bg-white" />
              </button>

              {/* Pro with staged photos: Done button. Otherwise: Cancel (X) */}
              {isPro && stagedFiles.length > 0 ? (
                <button
                  onClick={stopCamera}
                  className="flex h-10 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-accent/80"
                  title="Done capturing"
                >
                  Done
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30"
                  title="Cancel"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
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

      {/* Pro: Staged files preview */}
      {isPro && stagedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {stagedFiles.length} image{stagedFiles.length !== 1 ? "s" : ""} staged
              <span className="ml-1 text-muted-foreground">({MAX_BULK_FILES} max)</span>
            </p>
            <button
              onClick={() => {
                stagedFiles.forEach((sf) => URL.revokeObjectURL(sf.preview));
                setStagedFiles([]);
              }}
              className="text-xs text-muted-foreground hover:text-danger transition"
            >
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {stagedFiles.map((sf, i) => (
              <div key={i} className="group/thumb relative rounded-xl border border-border/60 bg-card/50 overflow-hidden">
                <img
                  src={sf.preview}
                  alt={sf.file.name}
                  className="aspect-square w-full object-cover"
                />
                <div className="p-2">
                  <p className="truncate text-xs font-medium">{sf.file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(sf.file.size)}</p>
                </div>
                <button
                  onClick={() => removeStagedFile(i)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover/thumb:opacity-100 hover:bg-danger"
                  title="Remove"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Start Audit button */}
          <button
            onClick={handleBulkUpload}
            disabled={uploading}
            className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm"
          >
            {uploading ? (
              <>
                <LoadingSpinner size="sm" />
                Analyzing {stagedFiles.length} image{stagedFiles.length !== 1 ? "s" : ""}...
              </>
            ) : (
              <>
                Start Audit
                {stagedFiles.length > 1 && (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {stagedFiles.length} images
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      )}

      {/* Upload / Drag Drop Zone */}
      {!cameraActive && !uploading && (
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
                {isPro ? "Drag & drop workplace photos" : "Drag & drop a workplace photo"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                JPG, PNG, or WebP up to 10MB
                {isPro && " each — up to 10 images"}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {/* Choose File button */}
                <label className="btn-primary cursor-pointer text-sm">
                  {isPro ? "Choose Files" : "Choose File"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple={isPro}
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

      {/* Uploading overlay (when not in drop zone) */}
      {uploading && !cameraActive && stagedFiles.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-accent/30 p-14 text-center">
          <LoadingSpinner size="lg" />
          <div>
            <p className="font-medium">Analyzing your workspace...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This usually takes 30-60 seconds
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-danger/10 border border-danger/20 p-3 text-sm text-danger">{error}</div>
      )}
    </div>
  );
}
