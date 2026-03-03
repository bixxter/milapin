"use client";

import { useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { compressFile } from "@/lib/compress";
import type { MediaFile } from "@/lib/types";

export interface UploadProgress {
  filename: string;
  status: "compressing" | "uploading" | "server_compressing" | "done" | "error";
  error?: string;
}

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const setProgress = useStore((s) => s.setUploadProgress);

  const upload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);

    // Append new items after any existing errors
    const newItems: UploadProgress[] = fileArray.map((f) => ({
      filename: f.name,
      status: "compressing" as const,
    }));
    setProgress((prev) => {
      const errors = prev.filter((p) => p.status === "error");
      return [...errors, ...newItems];
    });

    const results: MediaFile[] = [];

    // We need the current error count to offset our indices
    const errorCount = useStore.getState().uploadProgress.filter((p) => p.status === "error").length;

    for (let i = 0; i < fileArray.length; i++) {
      const idx = errorCount + i;
      const file = fileArray[i];
      const isVideo = file.type.startsWith("video/");
      try {
        // Compress (client-side, images only)
        setProgress((prev) =>
          prev.map((p, j) => (j === idx ? { ...p, status: "compressing" } : p))
        );
        const compressed = await compressFile(file);

        // Upload — for videos, show server compression status
        setProgress((prev) =>
          prev.map((p, j) =>
            j === idx
              ? { ...p, status: isVideo ? "server_compressing" : "uploading", filename: compressed.name }
              : p
          )
        );

        const formData = new FormData();
        formData.append("file", compressed);

        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        results.push(data.file);

        setProgress((prev) =>
          prev.map((p, j) => (j === idx ? { ...p, status: "done" } : p))
        );
      } catch (err) {
        setProgress((prev) =>
          prev.map((p, j) =>
            j === idx
              ? { ...p, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
              : p
          )
        );
      }
    }

    // Add all successful uploads to store
    if (results.length > 0) {
      const current = useStore.getState().mediaFiles;
      useStore.getState().setMediaFiles([...results, ...current]);
    }

    setUploading(false);

    // Clear only successful items after a delay, keep errors
    setTimeout(() => {
      setProgress((prev) => prev.filter((p) => p.status === "error"));
    }, 3000);

    return results;
  }, [setProgress]);

  return { upload, uploading };
}
