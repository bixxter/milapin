"use client";

import { useStore } from "@/lib/store";
import type { BoardItem } from "@/lib/types";
import { useRef, useState, useCallback, useEffect } from "react";

type ResizeHandle = "nw" | "ne" | "sw" | "se";

function useIsTouchScreen() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px) and (pointer: coarse)");
    setIsTouch(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isTouch;
}

function MediaContent({ item, hovered }: { item: BoardItem & { kind: "media" }; hovered: boolean }) {
  const mediaFiles = useStore((s) => s.mediaFiles);
  const file = mediaFiles.find((f) => f.filename === item.filename);
  const isVideo = file?.type === "video";
  const src = file?.url ?? `/api/media/${encodeURIComponent(item.filename)}`;
  const videoRef = useRef<HTMLVideoElement>(null);
  const isTouchScreen = useIsTouchScreen();

  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    const video = videoRef.current;
    if (isTouchScreen || hovered) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [hovered, isVideo, isTouchScreen]);

  return (
    <>
      {isVideo ? (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          className="w-full h-full object-cover pointer-events-none"
        />
      ) : (
        <img src={src} alt={item.filename} className="w-full h-full object-cover pointer-events-none select-none" draggable={false} />
      )}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <p className="text-[10px] font-mono text-white/70 truncate">{item.filename}</p>
      </div>
      {isVideo && !isTouchScreen && !hovered && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center pointer-events-none">
          <svg width="7" height="8" viewBox="0 0 7 8" fill="none"><path d="M0 0L7 4L0 8V0Z" fill="white" fillOpacity="0.7" /></svg>
        </div>
      )}
    </>
  );
}

function RectContent({ item }: { item: BoardItem & { kind: "rect" } }) {
  return (
    <div
      className="w-full h-full"
      style={{
        backgroundColor: item.fill,
        border: `${item.strokeWidth}px solid ${item.stroke}`,
        borderRadius: item.borderRadius,
      }}
    />
  );
}

function EllipseContent({ item }: { item: BoardItem & { kind: "ellipse" } }) {
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${item.width} ${item.height}`} className="pointer-events-none">
      <ellipse
        cx={item.width / 2}
        cy={item.height / 2}
        rx={item.width / 2 - item.strokeWidth}
        ry={item.height / 2 - item.strokeWidth}
        fill={item.fill}
        stroke={item.stroke}
        strokeWidth={item.strokeWidth}
      />
    </svg>
  );
}

function ArrowContent({ item }: { item: BoardItem & { kind: "arrow" } }) {
  const [x1, y1, x2, y2] = item.points;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 12;
  const ha1 = angle - Math.PI / 6;
  const ha2 = angle + Math.PI / 6;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${item.width} ${item.height}`} className="pointer-events-none overflow-visible">
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={item.stroke} strokeWidth={item.strokeWidth} strokeLinecap="round" />
      <line
        x1={x2} y1={y2}
        x2={x2 - headLen * Math.cos(ha1)} y2={y2 - headLen * Math.sin(ha1)}
        stroke={item.stroke} strokeWidth={item.strokeWidth} strokeLinecap="round"
      />
      <line
        x1={x2} y1={y2}
        x2={x2 - headLen * Math.cos(ha2)} y2={y2 - headLen * Math.sin(ha2)}
        stroke={item.stroke} strokeWidth={item.strokeWidth} strokeLinecap="round"
      />
    </svg>
  );
}

const FONT_FAMILY_MAP = {
  sans: "var(--font-sans)",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "var(--font-mono)",
};

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64, 80, 96];

function TextToolbar({ item }: { item: BoardItem & { kind: "text" } }) {
  const updateBoardItem = useStore((s) => s.updateBoardItem);
  const camera = useStore((s) => s.camera);

  const update = (updates: Partial<BoardItem>) => {
    updateBoardItem(item.id, updates);
  };

  const toggle = <K extends keyof BoardItem>(key: K, a: BoardItem[K], b: BoardItem[K]) => {
    update({ [key]: item[key] === a ? b : a } as Partial<BoardItem>);
  };

  const btnClass = (active: boolean) =>
    `w-7 h-7 flex items-center justify-center rounded transition-colors ${
      active
        ? "bg-[var(--color-accent)] text-white"
        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
    }`;

  // Scale-compensated so the toolbar stays a constant screen size
  const scale = 1 / camera.zoom;

  return (
    <div
      className="absolute z-[100] flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] shadow-xl shadow-black/30"
      style={{
        left: 0,
        bottom: `calc(100% + ${8 * scale}px)`,
        transformOrigin: "bottom left",
        transform: `scale(${scale})`,
        whiteSpace: "nowrap",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Font family */}
      <select
        value={item.fontFamily || "sans"}
        onChange={(e) => update({ fontFamily: e.target.value as "sans" | "serif" | "mono" } as Partial<BoardItem>)}
        className="h-7 px-1.5 rounded text-[11px] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] outline-none cursor-pointer border-none"
      >
        <option value="sans">Sans</option>
        <option value="serif">Serif</option>
        <option value="mono">Mono</option>
      </select>

      <div className="w-px h-4 bg-[var(--color-border-subtle)] mx-0.5" />

      {/* Font size */}
      <select
        value={item.fontSize}
        onChange={(e) => update({ fontSize: Number(e.target.value) } as Partial<BoardItem>)}
        className="h-7 w-12 px-1 rounded text-[11px] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] outline-none cursor-pointer border-none text-center"
      >
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <div className="w-px h-4 bg-[var(--color-border-subtle)] mx-0.5" />

      {/* Bold */}
      <button
        className={btnClass(item.fontWeight === "bold")}
        onClick={() => toggle("fontWeight" as keyof BoardItem, "bold" as never, "normal" as never)}
        title="Bold"
      >
        <svg width="10" height="12" viewBox="0 0 10 12" fill="none"><path d="M0 0h5.5a3 3 0 0 1 2.1 5.1A3.2 3.2 0 0 1 6 12H0V0zm2 5h3a1.2 1.2 0 0 0 0-2.4H2V5zm0 2.4V9.6h3.5a1.2 1.2 0 0 0 0-2.4H2z" fill="currentColor"/></svg>
      </button>

      {/* Italic */}
      <button
        className={btnClass(item.fontStyle === "italic")}
        onClick={() => toggle("fontStyle" as keyof BoardItem, "italic" as never, "normal" as never)}
        title="Italic"
      >
        <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M3 0h5v1.5H5.8L3.4 10.5H5.5V12H0v-1.5h1.8L4.2 1.5H2.5V0z" fill="currentColor"/></svg>
      </button>

      {/* Underline */}
      <button
        className={btnClass(item.textDecoration === "underline")}
        onClick={() => toggle("textDecoration" as keyof BoardItem, "underline" as never, "none" as never)}
        title="Underline"
      >
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none"><path d="M1 0v6a4 4 0 0 0 8 0V0h-2v6a2 2 0 0 1-4 0V0H1zM0 12.5h10V14H0v-1.5z" fill="currentColor"/></svg>
      </button>

      {/* Strikethrough */}
      <button
        className={btnClass(item.textDecoration === "line-through")}
        onClick={() => toggle("textDecoration" as keyof BoardItem, "line-through" as never, "none" as never)}
        title="Strikethrough"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M0 5.5h12v1H0v-1zM3 3.5C3 2 4.3 1 6 1c1.6 0 3 .9 3 2.3h-2C7 2.7 6.5 2.5 6 2.5c-.6 0-1 .3-1 .8 0 .3.2.5.5.7H3.3A2.3 2.3 0 0 1 3 3.5zM9 8.5C9 10 7.7 11 6 11c-1.6 0-3-.9-3-2.3h2c0 .6.5.8 1 .8.6 0 1-.3 1-.8 0-.3-.2-.5-.5-.7h2.2c.2.3.3.6.3 1z" fill="currentColor"/></svg>
      </button>

      <div className="w-px h-4 bg-[var(--color-border-subtle)] mx-0.5" />

      {/* Uppercase */}
      <button
        className={btnClass(item.textTransform === "uppercase")}
        onClick={() => toggle("textTransform" as keyof BoardItem, "uppercase" as never, "none" as never)}
        title="Uppercase"
      >
        <span className="text-[10px] font-bold leading-none">AA</span>
      </button>

      <div className="w-px h-4 bg-[var(--color-border-subtle)] mx-0.5" />

      {/* Text align */}
      {(["left", "center", "right"] as const).map((a) => (
        <button
          key={a}
          className={btnClass(item.align === a)}
          onClick={() => update({ align: a } as Partial<BoardItem>)}
          title={`Align ${a}`}
        >
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            {a === "left" && <><rect y="0" width="12" height="1.5" fill="currentColor" rx="0.5"/><rect y="3" width="8" height="1.5" fill="currentColor" rx="0.5"/><rect y="6" width="10" height="1.5" fill="currentColor" rx="0.5"/><rect y="9" width="6" height="1.5" fill="currentColor" rx="0.5"/></>}
            {a === "center" && <><rect y="0" width="12" height="1.5" fill="currentColor" rx="0.5"/><rect x="2" y="3" width="8" height="1.5" fill="currentColor" rx="0.5"/><rect x="1" y="6" width="10" height="1.5" fill="currentColor" rx="0.5"/><rect x="3" y="9" width="6" height="1.5" fill="currentColor" rx="0.5"/></>}
            {a === "right" && <><rect y="0" width="12" height="1.5" fill="currentColor" rx="0.5"/><rect x="4" y="3" width="8" height="1.5" fill="currentColor" rx="0.5"/><rect x="2" y="6" width="10" height="1.5" fill="currentColor" rx="0.5"/><rect x="6" y="9" width="6" height="1.5" fill="currentColor" rx="0.5"/></>}
          </svg>
        </button>
      ))}

      <div className="w-px h-4 bg-[var(--color-border-subtle)] mx-0.5" />

      {/* Color */}
      <label className="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:bg-[var(--color-surface-2)]" title="Text color">
        <input
          type="color"
          value={item.color.startsWith("var(") ? "#e8e8ed" : item.color}
          onChange={(e) => update({ color: e.target.value } as Partial<BoardItem>)}
          className="sr-only"
        />
        <div className="w-4 h-4 rounded-sm border border-[var(--color-border-subtle)]" style={{ backgroundColor: item.color.startsWith("var(") ? "#e8e8ed" : item.color }} />
      </label>
    </div>
  );
}

function TextContent({ item }: { item: BoardItem & { kind: "text" } }) {
  const updateBoardItem = useStore((s) => s.updateBoardItem);
  const editingTextId = useStore((s) => s.editingTextId);
  const setEditingTextId = useStore((s) => s.setEditingTextId);
  const selectedIds = useStore((s) => s.selectedIds);
  const isEditing = editingTextId === item.id;
  const isSelected = selectedIds.has(item.id);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const handleBlur = () => {
    const text = ref.current?.innerText || "";
    updateBoardItem(item.id, { text } as Partial<BoardItem>);
    setEditingTextId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
    e.stopPropagation();
  };

  const fontFamily = FONT_FAMILY_MAP[item.fontFamily || "sans"];

  return (
    <>
      {(isEditing || isSelected) && <TextToolbar item={item} />}
      <div
        ref={ref}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditingTextId(item.id);
        }}
        className="w-full h-full outline-none whitespace-pre-wrap break-words"
        style={{
          fontSize: item.fontSize,
          color: item.color,
          textAlign: item.align,
          fontWeight: item.fontWeight || "normal",
          fontStyle: item.fontStyle || "normal",
          textTransform: item.textTransform || "none",
          textDecoration: item.textDecoration || "none",
          fontFamily,
          cursor: isEditing ? "text" : "grab",
          padding: 4,
          lineHeight: 1.4,
        }}
      >
        {item.text || (isEditing ? "" : "Text")}
      </div>
    </>
  );
}

export default function CanvasItem({ item }: { item: BoardItem }) {
  const updateBoardItem = useStore((s) => s.updateBoardItem);
  const selectedIds = useStore((s) => s.selectedIds);
  const toggleSelected = useStore((s) => s.toggleSelected);
  const camera = useStore((s) => s.camera);
  const activeTool = useStore((s) => s.activeTool);
  const setEditingTextId = useStore((s) => s.setEditingTextId);
  const marqueePreviewIds = useStore((s) => s.marqueePreviewIds);

  const isSelected = selectedIds.has(item.id);
  const isMarqueePreview = marqueePreviewIds.has(item.id);

  const boardItems = useStore((s) => s.boardItems);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef<{
    mx: number; my: number; ix: number; iy: number;
    others: { id: string; ix: number; iy: number }[];
  } | null>(null);
  const resizeStart = useRef<{
    mx: number; my: number; x: number; y: number; w: number; h: number; handle: ResizeHandle;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || activeTool !== "select") return;
      e.stopPropagation();

      // If item is already selected (part of multi-selection), don't reset selection
      if (!isSelected || e.shiftKey) {
        toggleSelected(item.id, e.shiftKey);
      }

      const state = useStore.getState();
      const currentSelectedIds = isSelected && !e.shiftKey
        ? state.selectedIds
        : new Set([item.id]); // after toggleSelected, at minimum this item is selected

      // Capture initial positions of all other selected items
      const others = state.boardItems
        .filter((bi) => currentSelectedIds.has(bi.id) && bi.id !== item.id)
        .map((bi) => ({ id: bi.id, ix: bi.x, iy: bi.y }));

      state._pushHistory();
      setIsDragging(true);
      dragStart.current = { mx: e.clientX, my: e.clientY, ix: item.x, iy: item.y, others };
    },
    [item.id, item.x, item.y, isSelected, toggleSelected, activeTool]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (item.kind === "text") {
        e.stopPropagation();
        setEditingTextId(item.id);
      }
    },
    [item, setEditingTextId]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      e.stopPropagation();
      e.preventDefault();
      useStore.getState()._pushHistory();
      setIsResizing(true);
      resizeStart.current = {
        mx: e.clientX, my: e.clientY,
        x: item.x, y: item.y, w: item.width, h: item.height, handle,
      };
    },
    [item.x, item.y, item.width, item.height]
  );

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMove = (e: MouseEvent) => {
      if (isDragging && dragStart.current) {
        const dx = (e.clientX - dragStart.current.mx) / camera.zoom;
        const dy = (e.clientY - dragStart.current.my) / camera.zoom;
        updateBoardItem(item.id, { x: dragStart.current.ix + dx, y: dragStart.current.iy + dy });
        // Move all other selected items by the same delta
        for (const other of dragStart.current.others) {
          updateBoardItem(other.id, { x: other.ix + dx, y: other.iy + dy });
        }
      }

      if (isResizing && resizeStart.current) {
        const r = resizeStart.current;
        const dx = (e.clientX - r.mx) / camera.zoom;
        const dy = (e.clientY - r.my) / camera.zoom;
        const minSize = 30;

        let newX = r.x, newY = r.y, newW = r.w, newH = r.h;

        if (item.kind === "media") {
          // Lock aspect ratio for media items
          const aspect = r.w / r.h;
          // Use the dominant axis based on handle direction
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          const useWidth = absDx > absDy;

          if (useWidth) {
            if (r.handle.includes("e")) newW = Math.max(minSize, r.w + dx);
            if (r.handle.includes("w")) newW = Math.max(minSize, r.w - dx);
            newH = Math.max(minSize, newW / aspect);
            newW = newH * aspect; // recalculate in case newH was clamped
          } else {
            if (r.handle.includes("s")) newH = Math.max(minSize, r.h + dy);
            if (r.handle.includes("n")) newH = Math.max(minSize, r.h - dy);
            newW = Math.max(minSize, newH * aspect);
            newH = newW / aspect; // recalculate in case newW was clamped
          }

          if (r.handle.includes("w")) newX = r.x + (r.w - newW);
          if (r.handle.includes("n")) newY = r.y + (r.h - newH);
        } else {
          if (r.handle.includes("e")) newW = Math.max(minSize, r.w + dx);
          if (r.handle.includes("w")) { newW = Math.max(minSize, r.w - dx); newX = r.x + (r.w - newW); }
          if (r.handle.includes("s")) newH = Math.max(minSize, r.h + dy);
          if (r.handle.includes("n")) { newH = Math.max(minSize, r.h - dy); newY = r.y + (r.h - newH); }
        }

        const updates: Partial<BoardItem> = { x: newX, y: newY, width: newW, height: newH };

        // Update arrow points to match new bounds, preserving direction
        if (item.kind === "arrow") {
          const [ox1, oy1, ox2, oy2] = item.points;
          const startLeft = ox1 < ox2;
          const startTop = oy1 < oy2;
          (updates as Record<string, unknown>).points = [
            startLeft ? 0 : newW,
            startTop ? 0 : newH,
            startLeft ? newW : 0,
            startTop ? newH : 0,
          ];
        }

        updateBoardItem(item.id, updates);
      }
    };

    const handleUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      dragStart.current = null;
      resizeStart.current = null;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [isDragging, isResizing, camera.zoom, item, updateBoardItem]);

  const [isHovered, setIsHovered] = useState(false);

  const isShape = item.kind !== "media";
  const showResizeHandles = isSelected && activeTool === "select";

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        absolute group
        ${item.kind === "media" ? "rounded-xl overflow-hidden shadow-lg shadow-black/30" : ""}
        ${isSelected ? "ring-2 ring-[var(--color-accent)] ring-offset-1 ring-offset-transparent" : isMarqueePreview ? "ring-2 ring-[var(--color-accent)]/50 ring-offset-1 ring-offset-transparent" : ""}
        ${isDragging ? "z-50" : ""}
        ${!isShape ? "transition-shadow duration-200" : ""}
        ${!isShape && isDragging ? "shadow-2xl shadow-black/50" : ""}
        ${!isShape && !isDragging ? "hover:shadow-xl hover:shadow-black/40" : ""}
      `}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        cursor: activeTool !== "select" ? "crosshair" : isDragging ? "grabbing" : "grab",
      }}
    >
      {item.kind === "media" && <MediaContent item={item} hovered={isHovered} />}
      {item.kind === "rect" && <RectContent item={item} />}
      {item.kind === "ellipse" && <EllipseContent item={item} />}
      {item.kind === "arrow" && <ArrowContent item={item} />}
      {item.kind === "text" && <TextContent item={item} />}

      {/* Resize handles */}
      {showResizeHandles && (
        <>
          {(["nw", "ne", "sw", "se"] as ResizeHandle[]).map((handle) => (
            <div
              key={handle}
              onMouseDown={(e) => handleResizeStart(e, handle)}
              className={`
                absolute w-3 h-3 rounded-full
                bg-[var(--color-accent)] border-2 border-[var(--color-surface-0)]
                opacity-0 group-hover:opacity-100 transition-opacity z-10
                ${handle === "nw" ? "top-[-5px] left-[-5px] cursor-nw-resize" : ""}
                ${handle === "ne" ? "top-[-5px] right-[-5px] cursor-ne-resize" : ""}
                ${handle === "sw" ? "bottom-[-5px] left-[-5px] cursor-sw-resize" : ""}
                ${handle === "se" ? "bottom-[-5px] right-[-5px] cursor-se-resize" : ""}
              `}
            />
          ))}
        </>
      )}
    </div>
  );
}
