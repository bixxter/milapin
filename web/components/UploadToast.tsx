"use client";

import { useStore } from "@/lib/store";

function Spinner() {
  return (
    <svg className="animate-spin shrink-0 text-[var(--color-accent)]" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <path d="M7 1a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function UploadToast() {
  const items = useStore((s) => s.uploadProgress);
  const dismiss = useStore((s) => s.dismissUploadError);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-12 right-4 z-50 w-72 flex flex-col gap-2">
      {items.map((item, i) => (
        <div
          key={`${item.filename}-${i}`}
          className={`
            rounded-xl border px-3.5 py-3 shadow-lg backdrop-blur-md
            bg-[var(--color-surface-2)]/95
            ${item.status === "error"
              ? "border-red-500/30"
              : item.status === "done"
                ? "border-[var(--color-pin-emerald)]/30"
                : "border-[var(--color-border-default)]"
            }
          `}
        >
          <div className="flex items-center gap-2.5">
            {/* Icon */}
            {(item.status === "compressing" || item.status === "uploading" || item.status === "server_compressing") && (
              <Spinner />
            )}
            {item.status === "done" && (
              <svg className="shrink-0 text-[var(--color-pin-emerald)]" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7.5L6 10.5L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {item.status === "error" && (
              <svg className="shrink-0 text-red-400" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
                <path d="M7 4V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="7" cy="9.75" r="0.7" fill="currentColor" />
              </svg>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-mono text-[var(--color-text-secondary)] truncate">
                {item.filename}
              </p>
              <p className={`text-[10px] mt-0.5 ${
                item.status === "compressing" ? "text-[var(--color-text-tertiary)]"
                : item.status === "uploading" ? "text-[var(--color-accent)]"
                : item.status === "server_compressing" ? "text-[var(--color-accent)]"
                : item.status === "done" ? "text-[var(--color-pin-emerald)]"
                : "text-red-400"
              }`}>
                {item.status === "compressing" && "Compressing..."}
                {item.status === "uploading" && "Uploading..."}
                {item.status === "server_compressing" && "Processing video..."}
                {item.status === "done" && "Uploaded"}
                {item.status === "error" && (item.error || "Upload failed")}
              </p>
            </div>

            {/* Dismiss for errors */}
            {item.status === "error" && (
              <button
                onClick={() => dismiss(i)}
                className="shrink-0 p-1 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)] transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Progress bar for active states */}
          {(item.status === "uploading" || item.status === "server_compressing" || item.status === "compressing") && (
            <div className="mt-2.5 h-1 rounded-full bg-[var(--color-surface-4)] overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-[var(--color-accent)] animate-[indeterminate_1.5s_ease-in-out_infinite]" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
