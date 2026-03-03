"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import type { Tool } from "@/lib/types";

const tools: { id: Tool; label: string; shortcut: string; icon: React.ReactNode }[] = [
  {
    id: "select",
    label: "Select",
    shortcut: "V",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 2L3 13L6.5 9.5L10 14L12 13L8.5 8.5L13 7.5L3 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "rect",
    label: "Rectangle",
    shortcut: "R",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    id: "ellipse",
    label: "Ellipse",
    shortcut: "O",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <ellipse cx="8" cy="8" rx="6" ry="5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    id: "arrow",
    label: "Arrow",
    shortcut: "A",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 13L13 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M7 3H13V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "text",
    label: "Text",
    shortcut: "T",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 4V3H13V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 3V13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M6 13H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "comment",
    label: "Comment",
    shortcut: "M",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 3h10a1 1 0 011 1v6a1 1 0 01-1 1H6l-3 3V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const shortcutMap: Record<string, Tool> = {
  v: "select",
  r: "rect",
  o: "ellipse",
  a: "arrow",
  t: "text",
  m: "comment",
};

export default function Toolbar() {
  const activeTool = useStore((s) => s.activeTool);
  const setActiveTool = useStore((s) => s.setActiveTool);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture shortcuts while editing text or comments
      const { editingTextId, editingCommentId } = useStore.getState();
      if (editingTextId || editingCommentId) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) useStore.getState().redo();
        else useStore.getState().undo();
        return;
      }

      const tool = shortcutMap[e.key.toLowerCase()];
      if (tool) {
        e.preventDefault();
        setActiveTool(tool);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setActiveTool]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0.5 px-1.5 py-1.5 rounded-xl bg-[var(--color-surface-2)]/90 backdrop-blur-xl border border-[var(--color-border-default)] shadow-xl shadow-black/20">
      {tools.map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
            className={`
              relative flex items-center justify-center w-9 h-8 rounded-lg
              transition-all duration-150
              ${isActive
                ? "bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/30"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-3)]"
              }
            `}
          >
            {tool.icon}
            <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-mono leading-none text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100">
              {tool.shortcut}
            </span>
          </button>
        );
      })}
    </div>
  );
}
