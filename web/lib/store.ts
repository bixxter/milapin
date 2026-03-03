import { create } from "zustand";
import type { MediaFile, BoardItem, Point, Tool, Comment } from "./types";

type HistorySnapshot = { boardItems: BoardItem[]; comments: Comment[] };

interface AppState {
  // Media files from the downloads folder
  mediaFiles: MediaFile[];
  setMediaFiles: (files: MediaFile[]) => void;
  removeMediaFile: (filename: string) => void;

  // Board items (placed on canvas)
  boardItems: BoardItem[];
  setBoardItems: (items: BoardItem[]) => void;
  addBoardItem: (item: BoardItem) => void;
  updateBoardItem: (id: string, updates: Partial<BoardItem>) => void;
  removeBoardItem: (id: string) => void;

  // Selection
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  toggleSelected: (id: string, multi: boolean) => void;
  clearSelection: () => void;
  marqueePreviewIds: Set<string>;
  setMarqueePreviewIds: (ids: Set<string>) => void;

  // Active tool
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;

  // Canvas viewport
  camera: { x: number; y: number; zoom: number };
  setCamera: (camera: { x: number; y: number; zoom: number }) => void;
  pan: (dx: number, dy: number) => void;
  zoomTo: (zoom: number, pivot: Point) => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Notes sidebar (right)
  notesSidebarOpen: boolean;
  toggleNotesSidebar: () => void;
  notes: string;
  setNotes: (notes: string) => void;

  // Drag state
  draggingFromSidebar: string | null;
  setDraggingFromSidebar: (filename: string | null) => void;

  // Editing text item
  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;

  // Comments
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  addComment: (comment: Comment) => void;
  updateComment: (id: string, text: string) => void;
  removeComment: (id: string) => void;
  editingCommentId: string | null;
  setEditingCommentId: (id: string | null) => void;

  // Undo/Redo history
  _past: HistorySnapshot[];
  _future: HistorySnapshot[];
  _pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export const useStore = create<AppState>((set) => ({
  mediaFiles: [],
  setMediaFiles: (files) => set({ mediaFiles: files }),
  removeMediaFile: (filename) =>
    set((s) => ({
      mediaFiles: s.mediaFiles.filter((f) => f.filename !== filename),
    })),

  boardItems: [],
  setBoardItems: (items) => {
    useStore.getState()._pushHistory();
    set({ boardItems: items });
  },
  addBoardItem: (item) => {
    useStore.getState()._pushHistory();
    set((s) => ({ boardItems: [...s.boardItems, item] }));
  },
  updateBoardItem: (id, updates) =>
    set((s) => ({
      boardItems: s.boardItems.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ) as BoardItem[],
    })),
  removeBoardItem: (id) => {
    useStore.getState()._pushHistory();
    set((s) => ({
      boardItems: s.boardItems.filter((i) => i.id !== id),
      selectedIds: (() => {
        const next = new Set(s.selectedIds);
        next.delete(id);
        return next;
      })(),
    }));
  },

  selectedIds: new Set(),
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  toggleSelected: (id, multi) =>
    set((s) => {
      const next = multi ? new Set(s.selectedIds) : new Set<string>();
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),
  clearSelection: () => set({ selectedIds: new Set() }),
  marqueePreviewIds: new Set(),
  setMarqueePreviewIds: (ids) => set({ marqueePreviewIds: ids }),

  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),

  camera: { x: 0, y: 0, zoom: 1 },
  setCamera: (camera) => set({ camera }),
  pan: (dx, dy) =>
    set((s) => ({
      camera: { ...s.camera, x: s.camera.x + dx, y: s.camera.y + dy },
    })),
  zoomTo: (zoom, pivot) =>
    set((s) => {
      const clampedZoom = Math.min(Math.max(zoom, 0.1), 5);
      const scale = clampedZoom / s.camera.zoom;
      return {
        camera: {
          zoom: clampedZoom,
          x: pivot.x - (pivot.x - s.camera.x) * scale,
          y: pivot.y - (pivot.y - s.camera.y) * scale,
        },
      };
    }),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  notesSidebarOpen: false,
  toggleNotesSidebar: () => set((s) => ({ notesSidebarOpen: !s.notesSidebarOpen })),
  notes: "",
  setNotes: (notes) => set({ notes }),

  draggingFromSidebar: null,
  setDraggingFromSidebar: (filename) =>
    set({ draggingFromSidebar: filename }),

  editingTextId: null,
  setEditingTextId: (id) => set({ editingTextId: id }),

  comments: [],
  setComments: (comments) => {
    useStore.getState()._pushHistory();
    set({ comments });
  },
  addComment: (comment) => {
    useStore.getState()._pushHistory();
    set((s) => ({ comments: [...s.comments, comment] }));
  },
  updateComment: (id, text) => {
    useStore.getState()._pushHistory();
    set((s) => ({
      comments: s.comments.map((c) =>
        c.id === id ? { ...c, text } : c
      ),
    }));
  },
  removeComment: (id) => {
    useStore.getState()._pushHistory();
    set((s) => ({ comments: s.comments.filter((c) => c.id !== id) }));
  },
  editingCommentId: null,
  setEditingCommentId: (id) => set({ editingCommentId: id }),

  // Undo/Redo history
  _past: [],
  _future: [],
  _pushHistory: () =>
    set((s) => ({
      _past: [...s._past.slice(-49), { boardItems: s.boardItems, comments: s.comments }],
      _future: [],
    })),
  undo: () =>
    set((s) => {
      const prev = s._past[s._past.length - 1];
      if (!prev) return s;
      return {
        _past: s._past.slice(0, -1),
        _future: [...s._future, { boardItems: s.boardItems, comments: s.comments }],
        boardItems: prev.boardItems,
        comments: prev.comments,
      };
    }),
  redo: () =>
    set((s) => {
      const next = s._future[s._future.length - 1];
      if (!next) return s;
      return {
        _future: s._future.slice(0, -1),
        _past: [...s._past, { boardItems: s.boardItems, comments: s.comments }],
        boardItems: next.boardItems,
        comments: next.comments,
      };
    }),
}));
