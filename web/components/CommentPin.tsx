"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import type { Comment } from "@/lib/types";

interface CommentPinProps {
  comment: Comment;
  zoom: number;
}

export default function CommentPin({ comment, zoom }: CommentPinProps) {
  const editingCommentId = useStore((s) => s.editingCommentId);
  const setEditingCommentId = useStore((s) => s.setEditingCommentId);
  const updateComment = useStore((s) => s.updateComment);
  const removeComment = useStore((s) => s.removeComment);
  const setActiveTool = useStore((s) => s.setActiveTool);

  const [hovered, setHovered] = useState(false);
  const [text, setText] = useState(comment.text);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isEditing = editingCommentId === comment.id;
  const hasText = comment.text.trim().length > 0;
  const isExpanded = isEditing || (hovered && hasText);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Sync text from store
  useEffect(() => {
    setText(comment.text);
  }, [comment.text]);

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      // Remove empty comments
      removeComment(comment.id);
    } else {
      updateComment(comment.id, trimmed);
    }
    setEditingCommentId(null);
    setActiveTool("select");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      if (!comment.text && !text.trim()) {
        removeComment(comment.id);
      }
      setEditingCommentId(null);
      setActiveTool("select");
    }
  };

  // Counter-scale so pin stays the same screen size regardless of zoom
  const scale = 1 / zoom;

  return (
    <div
      className="absolute"
      style={{
        left: comment.x,
        top: comment.y,
        transform: `scale(${scale})`,
        transformOrigin: "0 0",
        zIndex: isExpanded ? 9999 : 100,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Pin marker */}
      <div
        className={`
          flex items-center justify-center
          w-7 h-7 rounded-full
          shadow-lg cursor-pointer
          transition-all duration-150
          ${isExpanded
            ? "bg-[var(--color-accent)] scale-110"
            : "bg-[var(--color-accent)] hover:scale-110"
          }
        `}
        onClick={() => {
          if (!isEditing) {
            setEditingCommentId(comment.id);
            setText(comment.text);
          }
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 3h10a1 1 0 011 1v6a1 1 0 01-1 1H6l-3 3V4a1 1 0 011-1z"
            fill="white"
            stroke="white"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Expanded bubble */}
      {isExpanded && (
        <div
          className="absolute top-8 left-0 min-w-[200px] max-w-[280px] rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] shadow-xl shadow-black/25 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <div className="p-2">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                placeholder="Add a comment..."
                rows={2}
                className="w-full bg-transparent text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none outline-none"
              />
              <div className="flex justify-end gap-1 mt-1">
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSave();
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-[var(--color-accent)] text-white hover:brightness-110 transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3">
              <p className="text-[13px] text-[var(--color-text-primary)] whitespace-pre-wrap break-words leading-relaxed">
                {comment.text}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border-subtle)]">
                <span className="text-[10px] text-[var(--color-text-tertiary)]">
                  {new Date(comment.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <button
                  onClick={() => removeComment(comment.id)}
                  className="text-[10px] text-[var(--color-text-tertiary)] hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
