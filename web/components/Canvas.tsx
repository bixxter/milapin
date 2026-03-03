"use client";

import { useStore } from "@/lib/store";
import type { BoardItem } from "@/lib/types";
import { useRef, useState, useCallback, useEffect } from "react";
import CanvasItem from "./CanvasItem";
import CommentPin from "./CommentPin";
import { useUpload } from "@/lib/useUpload";

export default function Canvas() {
  const camera = useStore((s) => s.camera);
  const pan = useStore((s) => s.pan);
  const zoomTo = useStore((s) => s.zoomTo);
  const boardItems = useStore((s) => s.boardItems);
  const addBoardItem = useStore((s) => s.addBoardItem);
  const mediaFiles = useStore((s) => s.mediaFiles);
  const clearSelection = useStore((s) => s.clearSelection);
  const setSelectedIds = useStore((s) => s.setSelectedIds);
  const draggingFromSidebar = useStore((s) => s.draggingFromSidebar);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const activeTool = useStore((s) => s.activeTool);
  const setActiveTool = useStore((s) => s.setActiveTool);
  const setEditingTextId = useStore((s) => s.setEditingTextId);
  const comments = useStore((s) => s.comments);
  const addComment = useStore((s) => s.addComment);
  const setEditingCommentId = useStore((s) => s.setEditingCommentId);
  const setMarqueePreviewIds = useStore((s) => s.setMarqueePreviewIds);

  const { upload } = useUpload();
  const [fileDragOver, setFileDragOver] = useState(false);
  const fileDragCounter = useRef(0);
  const pendingDropPos = useRef<{ clientX: number; clientY: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const panStart = useRef<{ mx: number; my: number; cx: number; cy: number } | null>(null);

  // Marquee selection
  const [marquee, setMarquee] = useState<{
    startX: number; startY: number; endX: number; endY: number;
  } | null>(null);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);

  // Drawing state
  const [drawPreview, setDrawPreview] = useState<{
    x: number; y: number; w: number; h: number;
    startLeft: boolean; startTop: boolean;
  } | null>(null);
  const drawStart = useRef<{ canvasX: number; canvasY: number; clientX: number; clientY: number } | null>(null);

  // Space key for panning + delete
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        const target = e.target as HTMLElement;
        if (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        setSpaceHeld(true);
      }
      if (e.code === "Delete" || e.code === "Backspace") {
        const target = e.target as HTMLElement;
        if (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        const selected = useStore.getState().selectedIds;
        selected.forEach((id) => useStore.getState().removeBoardItem(id));
      }
      // Escape: back to select
      if (e.code === "Escape") {
        setActiveTool("select");
        useStore.getState().setEditingTextId(null);
        useStore.getState().setEditingCommentId(null);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [setActiveTool]);

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - camera.x) / camera.zoom,
        y: (clientY - rect.top - camera.y) / camera.zoom,
      };
    },
    [camera]
  );

  // Mouse wheel — native non-passive listener to block browser pinch-zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const delta = -e.deltaY * 0.005;
        zoomTo(camera.zoom * (1 + delta), { x: e.clientX, y: e.clientY });
      } else {
        pan(-e.deltaX, -e.deltaY);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [camera.zoom, zoomTo, pan]);

  // Touch events — pan with one finger, pinch-zoom with two fingers
  const touchRef = useRef<{
    mode: "none" | "pan" | "pinch";
    startX: number;
    startY: number;
    cx: number;
    cy: number;
    // pinch state
    startDist: number;
    startZoom: number;
    midX: number;
    midY: number;
  } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const dist = (a: Touch, b: Touch) =>
      Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const [a, b] = [e.touches[0], e.touches[1]];
        const cam = useStore.getState().camera;
        touchRef.current = {
          mode: "pinch",
          startX: 0, startY: 0,
          cx: cam.x, cy: cam.y,
          startDist: dist(a, b),
          startZoom: cam.zoom,
          midX: (a.clientX + b.clientX) / 2,
          midY: (a.clientY + b.clientY) / 2,
        };
      } else if (e.touches.length === 1) {
        const cam = useStore.getState().camera;
        touchRef.current = {
          mode: "pan",
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          cx: cam.x, cy: cam.y,
          startDist: 0, startZoom: cam.zoom,
          midX: 0, midY: 0,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchRef.current) return;

      if (touchRef.current.mode === "pinch" && e.touches.length === 2) {
        e.preventDefault();
        const [a, b] = [e.touches[0], e.touches[1]];
        const curDist = dist(a, b);
        const scale = curDist / touchRef.current.startDist;
        const newZoom = touchRef.current.startZoom * scale;

        // Zoom toward the midpoint of the two fingers
        const midX = (a.clientX + b.clientX) / 2;
        const midY = (a.clientY + b.clientY) / 2;
        useStore.getState().zoomTo(newZoom, { x: midX, y: midY });
      } else if (touchRef.current.mode === "pan" && e.touches.length === 1) {
        // Only pan on canvas background when using select tool
        const state = useStore.getState();
        if (state.activeTool !== "select") return;

        const dx = e.touches[0].clientX - touchRef.current.startX;
        const dy = e.touches[0].clientY - touchRef.current.startY;
        useStore.setState({
          camera: {
            ...state.camera,
            x: touchRef.current.cx + dx,
            y: touchRef.current.cy + dy,
          },
        });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      // If went from 2 fingers to 1, reset to pan with remaining finger
      if (touchRef.current?.mode === "pinch" && e.touches.length === 1) {
        const cam = useStore.getState().camera;
        touchRef.current = {
          mode: "pan",
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          cx: cam.x, cy: cam.y,
          startDist: 0, startZoom: cam.zoom,
          midX: 0, midY: 0,
        };
        return;
      }
      if (e.touches.length === 0) {
        touchRef.current = null;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle-click or space+left-click = pan
      if (e.button === 1 || (e.button === 0 && spaceHeld)) {
        e.preventDefault();
        setIsPanning(true);
        panStart.current = { mx: e.clientX, my: e.clientY, cx: camera.x, cy: camera.y };
        return;
      }

      if (e.button !== 0) return;

      // Comment tool
      if (activeTool === "comment") {
        e.preventDefault();
        const pos = screenToCanvas(e.clientX, e.clientY);
        const newComment = {
          id: `comment-${Date.now()}`,
          x: pos.x,
          y: pos.y,
          text: "",
          createdAt: Date.now(),
        };
        addComment(newComment);
        setEditingCommentId(newComment.id);
        return;
      }

      // Drawing tools
      if (activeTool !== "select") {
        e.preventDefault();
        const pos = screenToCanvas(e.clientX, e.clientY);
        drawStart.current = { canvasX: pos.x, canvasY: pos.y, clientX: e.clientX, clientY: e.clientY };

        if (activeTool === "text") {
          // Text: place immediately
          const newItem: BoardItem = {
            id: `text-${Date.now()}`,
            kind: "text",
            x: pos.x,
            y: pos.y,
            width: 200,
            height: 40,
            text: "",
            fontSize: 18,
            color: "var(--color-text-primary)",
            align: "left",
            fontWeight: "normal",
            fontStyle: "normal",
            textTransform: "none",
            textDecoration: "none",
            fontFamily: "sans",
          };
          addBoardItem(newItem);
          setSelectedIds(new Set([newItem.id]));
          setEditingTextId(newItem.id);
          setActiveTool("select");
          drawStart.current = null;
        }
        return;
      }

      // Select tool: marquee
      clearSelection();
      marqueeStart.current = { x: e.clientX, y: e.clientY };
    },
    [spaceHeld, camera.x, camera.y, activeTool, clearSelection, screenToCanvas, addBoardItem, setSelectedIds, setActiveTool, setEditingTextId, addComment, setEditingCommentId]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Panning
      if (isPanning && panStart.current) {
        useStore.setState({
          camera: {
            ...camera,
            x: panStart.current.cx + (e.clientX - panStart.current.mx),
            y: panStart.current.cy + (e.clientY - panStart.current.my),
          },
        });
        return;
      }

      // Drawing preview
      if (drawStart.current && activeTool !== "select" && activeTool !== "text") {
        const pos = screenToCanvas(e.clientX, e.clientY);
        const sx = drawStart.current.canvasX;
        const sy = drawStart.current.canvasY;
        setDrawPreview({
          x: Math.min(sx, pos.x),
          y: Math.min(sy, pos.y),
          w: Math.abs(pos.x - sx),
          h: Math.abs(pos.y - sy),
          startLeft: sx <= pos.x,
          startTop: sy <= pos.y,
        });
        return;
      }

      // Marquee
      if (marqueeStart.current) {
        const m = {
          startX: marqueeStart.current.x,
          startY: marqueeStart.current.y,
          endX: e.clientX,
          endY: e.clientY,
        };
        setMarquee(m);

        // Live preview: compute intersecting items
        const left = Math.min(m.startX, m.endX);
        const right = Math.max(m.startX, m.endX);
        const top = Math.min(m.startY, m.endY);
        const bottom = Math.max(m.startY, m.endY);
        const preview = new Set<string>();
        boardItems.forEach((item) => {
          const sx = item.x * camera.zoom + camera.x;
          const sy = item.y * camera.zoom + camera.y;
          const sr = (item.x + item.width) * camera.zoom + camera.x;
          const sb = (item.y + item.height) * camera.zoom + camera.y;
          if (sx < right && sr > left && sy < bottom && sb > top) {
            preview.add(item.id);
          }
        });
        setMarqueePreviewIds(preview);
      }
    },
    [isPanning, camera, activeTool, screenToCanvas, boardItems, setMarqueePreviewIds]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      // Pan end
      if (isPanning) {
        setIsPanning(false);
        panStart.current = null;
        return;
      }

      // Finish drawing
      if (drawStart.current && activeTool !== "select" && activeTool !== "text") {
        const pos = screenToCanvas(e.clientX, e.clientY);
        const sx = drawStart.current.canvasX;
        const sy = drawStart.current.canvasY;
        const x = Math.min(sx, pos.x);
        const y = Math.min(sy, pos.y);
        const w = Math.abs(pos.x - sx);
        const h = Math.abs(pos.y - sy);

        // Only create if dragged enough
        if (w > 5 || h > 5) {
          const id = `${activeTool}-${Date.now()}`;
          let newItem: BoardItem;

          if (activeTool === "rect") {
            newItem = {
              id, kind: "rect",
              x, y, width: Math.max(w, 20), height: Math.max(h, 20),
              fill: "transparent", stroke: "#e8e8ed", strokeWidth: 2, borderRadius: 8,
            };
          } else if (activeTool === "ellipse") {
            newItem = {
              id, kind: "ellipse",
              x, y, width: Math.max(w, 20), height: Math.max(h, 20),
              fill: "transparent", stroke: "#e8e8ed", strokeWidth: 2,
            };
          } else {
            // arrow – preserve drag direction
            const aw = Math.max(w, 20);
            const ah = Math.max(h, 20);
            const startLeft = sx <= pos.x;
            const startTop = sy <= pos.y;
            newItem = {
              id, kind: "arrow",
              x, y, width: aw, height: ah,
              stroke: "#e8e8ed", strokeWidth: 2,
              points: [
                startLeft ? 0 : aw,
                startTop ? 0 : ah,
                startLeft ? aw : 0,
                startTop ? ah : 0,
              ],
            };
          }

          addBoardItem(newItem);
          setSelectedIds(new Set([id]));
          setActiveTool("select");
        }

        drawStart.current = null;
        setDrawPreview(null);
        return;
      }

      // Marquee select end
      if (marquee) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const left = Math.min(marquee.startX, marquee.endX);
          const right = Math.max(marquee.startX, marquee.endX);
          const top = Math.min(marquee.startY, marquee.endY);
          const bottom = Math.max(marquee.startY, marquee.endY);

          const selected = new Set<string>();
          boardItems.forEach((item) => {
            const sx = item.x * camera.zoom + camera.x;
            const sy = item.y * camera.zoom + camera.y;
            const sr = (item.x + item.width) * camera.zoom + camera.x;
            const sb = (item.y + item.height) * camera.zoom + camera.y;
            if (sx < right && sr > left && sy < bottom && sb > top) {
              selected.add(item.id);
            }
          });
          if (selected.size > 0) setSelectedIds(selected);
        }
        setMarquee(null);
        marqueeStart.current = null;
        setMarqueePreviewIds(new Set());
      }
    },
    [isPanning, activeTool, marquee, boardItems, camera, screenToCanvas, addBoardItem, setSelectedIds, setActiveTool, setMarqueePreviewIds]
  );

  // Drop from sidebar or file system
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    fileDragCounter.current++;
    setFileDragOver(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    fileDragCounter.current--;
    if (fileDragCounter.current <= 0) {
      fileDragCounter.current = 0;
      setFileDragOver(false);
    }
  }, []);

  const placeMediaOnCanvas = useCallback(
    (filename: string, mediaType: "image" | "video" | "gif", url: string, dropPos: { x: number; y: number }) => {
      const src = url;
      const maxDim = 300;

      const createItem = (w: number, h: number) => {
        const scale = Math.min(maxDim / w, maxDim / h, 1);
        const width = Math.round(w * scale);
        const height = Math.round(h * scale);
        const newItem: BoardItem = {
          id: `${filename}-${Date.now()}`,
          kind: "media",
          filename,
          x: dropPos.x - width / 2,
          y: dropPos.y - height / 2,
          width,
          height,
        };
        addBoardItem(newItem);
      };

      if (mediaType === "video") {
        const video = document.createElement("video");
        video.src = src;
        video.onloadedmetadata = () => createItem(video.videoWidth, video.videoHeight);
        video.onerror = () => createItem(240, 180);
      } else {
        const img = new Image();
        img.src = src;
        img.onload = () => createItem(img.naturalWidth, img.naturalHeight);
        img.onerror = () => createItem(240, 180);
      }
    },
    [addBoardItem]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      fileDragCounter.current = 0;
      setFileDragOver(false);

      // File drop from system
      if (e.dataTransfer.files.length > 0 && !e.dataTransfer.getData("text/plain")) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        const results = await upload(e.dataTransfer.files);
        if (results) {
          for (const mediaFile of results) {
            placeMediaOnCanvas(mediaFile.filename, mediaFile.type, mediaFile.url, pos);
          }
        }
        return;
      }

      // Card drop from sidebar
      const filename = e.dataTransfer.getData("text/plain");
      if (!filename) return;
      const file = mediaFiles.find((f) => f.filename === filename);
      if (!file) return;
      if (boardItems.some((i) => i.kind === "media" && i.filename === filename)) return;

      const pos = screenToCanvas(e.clientX, e.clientY);
      placeMediaOnCanvas(filename, file.type, `/api/media/${encodeURIComponent(filename)}`, pos);
    },
    [mediaFiles, boardItems, screenToCanvas, upload, placeMediaOnCanvas]
  );

  const isDrawing = activeTool !== "select" && activeTool !== "comment";
  const cursorClass = isPanning
    ? "cursor-grabbing"
    : spaceHeld
      ? "cursor-grab"
      : activeTool === "comment"
        ? "cursor-crosshair"
        : isDrawing
          ? "cursor-crosshair"
          : "cursor-default";

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 overflow-hidden canvas-grid ${cursorClass} transition-[padding-left] duration-300`}
      style={{ paddingLeft: sidebarOpen ? 280 : 0, touchAction: "none" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Transformed canvas layer */}
      <div
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: "0 0",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {boardItems.map((item) => (
          <CanvasItem key={item.id} item={item} />
        ))}
        {comments.map((comment) => (
          <CommentPin key={comment.id} comment={comment} zoom={camera.zoom} />
        ))}

        {/* Draw preview ghost */}
        {drawPreview && drawPreview.w > 2 && drawPreview.h > 2 && (
          <div
            className="absolute pointer-events-none"
            style={{ left: drawPreview.x, top: drawPreview.y, width: drawPreview.w, height: drawPreview.h }}
          >
            {activeTool === "rect" && (
              <div className="w-full h-full rounded-lg border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-accent)]/5" />
            )}
            {activeTool === "ellipse" && (
              <svg width="100%" height="100%" className="overflow-visible">
                <ellipse
                  cx={drawPreview.w / 2} cy={drawPreview.h / 2}
                  rx={drawPreview.w / 2 - 1} ry={drawPreview.h / 2 - 1}
                  fill="var(--color-accent-muted)" stroke="var(--color-accent)"
                  strokeWidth="2" strokeDasharray="6 4"
                />
              </svg>
            )}
            {activeTool === "arrow" && (
              <svg width="100%" height="100%" className="overflow-visible">
                <line
                  x1={drawPreview.startLeft ? 0 : drawPreview.w}
                  y1={drawPreview.startTop ? 0 : drawPreview.h}
                  x2={drawPreview.startLeft ? drawPreview.w : 0}
                  y2={drawPreview.startTop ? drawPreview.h : 0}
                  stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round"
                />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Marquee overlay */}
      {marquee && (
        <div
          className="marquee fixed"
          style={{
            left: Math.min(marquee.startX, marquee.endX),
            top: Math.min(marquee.startY, marquee.endY),
            width: Math.abs(marquee.endX - marquee.startX),
            height: Math.abs(marquee.endY - marquee.startY),
          }}
        />
      )}

      {/* Drop indicator */}
      {(draggingFromSidebar || fileDragOver) && (
        <div className="fixed inset-0 pointer-events-none z-30">
          <div className="absolute inset-4 border-2 border-dashed border-[var(--color-accent)]/30 rounded-2xl" />
          {fileDragOver && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-[var(--color-accent)] bg-[var(--color-surface-2)]/80 backdrop-blur-sm px-4 py-2 rounded-lg">
                Drop files to upload
              </span>
            </div>
          )}
        </div>
      )}

      {/* Zoom indicator */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface-2)]/80 backdrop-blur-sm border border-[var(--color-border-subtle)]">
        <span className="text-[11px] font-mono text-[var(--color-text-tertiary)]">
          {Math.round(camera.zoom * 100)}%
        </span>
      </div>

      {/* Logo */}
      <div className="absolute bottom-4 left-4 z-30">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)]/60 backdrop-blur-sm border border-[var(--color-border-subtle)]">
          <div className="w-2 h-2 rounded-full bg-[var(--color-pin-rose)]" />
          <span className="text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
            milapin
          </span>
        </div>
      </div>
    </div>
  );
}
