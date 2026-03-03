"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import Canvas from "@/components/Canvas";
import Minimap from "@/components/Minimap";
import Toolbar from "@/components/Toolbar";
import NotesSidebar from "@/components/NotesSidebar";
import UserMenu from "@/components/UserMenu";
import UploadToast from "@/components/UploadToast";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const setMediaFiles = useStore((s) => s.setMediaFiles);
  const setBoardItems = useStore((s) => s.setBoardItems);
  const boardItems = useStore((s) => s.boardItems);
  const comments = useStore((s) => s.comments);
  const setComments = useStore((s) => s.setComments);
  const notes = useStore((s) => s.notes);
  const setNotes = useStore((s) => s.setNotes);
  const prevBoardRef = useRef<string>("");
  const [ready, setReady] = useState(false);

  // Fetch media files
  const fetchMedia = useCallback(async () => {
    const res = await fetch("/api/media");
    const data = await res.json();
    setMediaFiles(data.files || []);
  }, [setMediaFiles]);

  // Initial load — both requests finish before we render
  useEffect(() => {
    async function init() {
      try {
        const [mediaRes, boardRes] = await Promise.all([
          fetch("/api/media"),
          fetch("/api/board"),
        ]);
        const [mediaData, boardData] = await Promise.all([
          mediaRes.json(),
          boardRes.json(),
        ]);

        if (boardData.items) {
          setBoardItems(boardData.items);
          prevBoardRef.current = JSON.stringify({ items: boardData.items, comments: boardData.comments || [] });
        }
        if (boardData.comments) {
          setComments(boardData.comments);
        }
        if (boardData.notes) {
          setNotes(boardData.notes);
        }
        setMediaFiles(mediaData.files || []);
      } catch (err) {
        console.error("Failed to init:", err);
      } finally {
        setReady(true);
      }
    }
    init();
  }, [setMediaFiles, setBoardItems, setComments, setNotes]);

  // Save board state (debounced)
  const saveBoard = useCallback(async () => {
    const current = JSON.stringify({ items: boardItems, comments, notes });
    if (current === prevBoardRef.current) return;
    prevBoardRef.current = current;

    try {
      await fetch("/api/board", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: boardItems, comments, notes }),
      });
    } catch (err) {
      console.error("Failed to save board:", err);
    }
  }, [boardItems, comments, notes]);

  // Poll for new media every 3 seconds (only after initial load)
  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(fetchMedia, 3000);
    return () => clearInterval(interval);
  }, [ready, fetchMedia]);

  // Auto-save board on changes (debounced 1s)
  useEffect(() => {
    if (!ready) return;
    const timeout = setTimeout(saveBoard, 1000);
    return () => clearTimeout(timeout);
  }, [ready, saveBoard]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (!ready || status === "loading" || status === "unauthenticated") {
    return (
      <main className="h-screen w-screen flex items-center justify-center bg-[var(--color-surface-0)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--color-pin-rose)] animate-pulse" />
          <span className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            loading
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-[var(--color-surface-0)]">
      <Sidebar />
      <Canvas />
      <Toolbar />
      <Minimap />
      <NotesSidebar />
      <UserMenu />
      <UploadToast />
    </main>
  );
}
