"use client";

import { useStore } from "@/lib/store";
import type { MediaFile } from "@/lib/types";
import { useRef, useState, useEffect } from "react";

function SidebarCard({ file }: { file: MediaFile }) {
  const setDragging = useStore((s) => s.setDraggingFromSidebar);
  const removeMediaFile = useStore((s) => s.removeMediaFile);
  const ref = useRef<HTMLDivElement>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setDragging(file.filename);
    e.dataTransfer.setData("text/plain", file.filename);
    e.dataTransfer.effectAllowed = "copy";
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      e.dataTransfer.setDragImage(ref.current, rect.width / 2, rect.height / 2);
    }
  };

  const handleDragEnd = () => {
    setDragging(null);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/media/${file.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        removeMediaFile(file.filename);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      ref={ref}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="group relative rounded-lg overflow-hidden cursor-grab active:cursor-grabbing border border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)] transition-all duration-200"
    >
      {file.type === "video" ? (
        <video
          src={file.url}
          muted
          loop
          className="w-full h-auto object-cover"
          onMouseEnter={(e) => e.currentTarget.play()}
          onMouseLeave={(e) => {
            e.currentTarget.pause();
            e.currentTarget.currentTime = 0;
          }}
        />
      ) : (
        <img
          src={file.url}
          alt={file.filename}
          className="w-full h-auto object-cover"
          loading="lazy"
        />
      )}

      {/* Overlay info */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[11px] font-mono text-[var(--color-text-secondary)] truncate">
          {file.filename}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
            {file.type}
          </span>
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            {(file.size / 1024).toFixed(0)}kb
          </span>
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-black/60 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 3L9 9M9 3L3 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {file.type === "video" && (
        <div className="absolute top-2 right-9 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
          <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
            <path d="M0 0L8 5L0 10V0Z" fill="white" fillOpacity="0.8" />
          </svg>
        </div>
      )}
    </div>
  );
}

const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);

export default function Sidebar() {
  const mediaFiles = useStore((s) => s.mediaFiles);
  const boardItems = useStore((s) => s.boardItems);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  const unsortedFiles = mediaFiles.filter(
    (f) => !boardItems.some((b) => b.kind === "media" && b.filename === f.filename)
  );

  // Keyboard shortcut: Cmd/Ctrl + B
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleSidebar]);

  return (
    <>
      {/* Toggle button + hint */}
      <div
        className={`
          fixed top-4 z-50 flex flex-col items-center gap-1.5
          transition-all duration-300
          ${sidebarOpen ? "left-[276px]" : "left-4"}
        `}
      >
        <button
          onClick={toggleSidebar}
          className="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center hover:bg-[var(--color-surface-3)] transition-all duration-300"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={`transition-transform ${sidebarOpen ? "" : "rotate-180"}`}
          >
            <path
              d="M9 3L5 7L9 11"
              stroke="var(--color-text-secondary)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="text-[9px] font-mono text-[var(--color-text-tertiary)] opacity-60 whitespace-nowrap">
          {isMac ? "\u2318B" : "Ctrl+B"}
        </span>
      </div>

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 w-[280px]
          bg-[var(--color-surface-1)]/95 backdrop-blur-xl
          border-r border-[var(--color-border-default)]
          flex flex-col transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[var(--color-pin-rose)] animate-pulse" />
              <h2 className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
                Unsorted
              </h2>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-surface-3)] text-[var(--color-text-secondary)]">
              {unsortedFiles.length}
            </span>
          </div>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-2">
            Drag items onto the canvas
          </p>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {unsortedFiles.map((file) => (
            <SidebarCard key={file.filename} file={file} />
          ))}

          {unsortedFiles.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-3)] flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect
                    x="2"
                    y="2"
                    width="16"
                    height="16"
                    rx="3"
                    stroke="var(--color-text-tertiary)"
                    strokeWidth="1.5"
                  />
                  <circle cx="7" cy="7" r="1.5" fill="var(--color-text-tertiary)" />
                  <path
                    d="M2 13L6 9L10 13L14 8L18 13"
                    stroke="var(--color-text-tertiary)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                No media files yet
              </p>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1 opacity-60">
                Grab pins from Pinterest
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-tertiary)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-pin-emerald)]" />
            <span>{mediaFiles.length} files total</span>
          </div>
        </div>
      </aside>
    </>
  );
}
