"use client";

import { useStore } from "@/lib/store";
import { useEffect } from "react";

const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);

export default function NotesSidebar() {
  const notesSidebarOpen = useStore((s) => s.notesSidebarOpen);
  const toggleNotesSidebar = useStore((s) => s.toggleNotesSidebar);
  const notes = useStore((s) => s.notes);
  const setNotes = useStore((s) => s.setNotes);

  // Keyboard shortcut: Opt/Alt + Cmd/Ctrl + B
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleNotesSidebar();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleNotesSidebar]);

  return (
    <>
      {/* Toggle button + hint */}
      <div
        className={`
          fixed top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1.5
          transition-all duration-300
          ${notesSidebarOpen ? "right-[316px]" : "right-4"}
        `}
      >
        <button
          onClick={toggleNotesSidebar}
          className="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center hover:bg-[var(--color-surface-3)] transition-all duration-300"
        >
          {/* Notes/document icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <rect
              x="2.5"
              y="1.5"
              width="9"
              height="11"
              rx="1.5"
              stroke="var(--color-text-secondary)"
              strokeWidth="1.3"
            />
            <line x1="5" y1="5" x2="9" y2="5" stroke="var(--color-text-secondary)" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="5" y1="7.5" x2="9" y2="7.5" stroke="var(--color-text-secondary)" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="5" y1="10" x2="7.5" y2="10" stroke="var(--color-text-secondary)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-[9px] font-mono text-[var(--color-text-tertiary)] opacity-60 whitespace-nowrap">
          {isMac ? "\u21E7\u2318B" : "Ctrl+Shift+B"}
        </span>
      </div>

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 right-0 h-full z-40 w-[320px]
          bg-[var(--color-surface-1)]/95 backdrop-blur-xl
          border-l border-[var(--color-border-default)]
          flex flex-col transition-transform duration-300 ease-out
          ${notesSidebarOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-[var(--color-pin-amber)]" />
            <h2 className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
              Notes
            </h2>
          </div>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-2">
            Scenario, description, ideas...
          </p>
        </div>

        {/* Text area */}
        <div className="flex-1 p-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your notes here..."
            spellCheck={false}
            className="
              w-full h-full resize-none rounded-lg p-3
              bg-[var(--color-surface-0)]/60
              border border-[var(--color-border-subtle)]
              focus:border-[var(--color-border-strong)] focus:outline-none
              text-sm leading-relaxed
              text-[var(--color-text-primary)]
              placeholder:text-[var(--color-text-tertiary)]
              transition-colors
            "
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-tertiary)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-pin-amber)]" />
            <span>{notes.length > 0 ? `${notes.length} chars` : "empty"}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
