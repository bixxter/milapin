"use client";

import { useStore } from "@/lib/store";

export default function Minimap() {
  const boardItems = useStore((s) => s.boardItems);
  const camera = useStore((s) => s.camera);
  const setCamera = useStore((s) => s.setCamera);
  const sidebarOpen = useStore((s) => s.sidebarOpen);

  if (boardItems.length === 0) return null;

  // Compute bounds of all items
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  boardItems.forEach((item) => {
    minX = Math.min(minX, item.x);
    minY = Math.min(minY, item.y);
    maxX = Math.max(maxX, item.x + item.width);
    maxY = Math.max(maxY, item.y + item.height);
  });

  const padding = 100;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const worldW = maxX - minX;
  const worldH = maxY - minY;

  const mapW = 160;
  const mapH = 120;
  const scale = Math.min(mapW / worldW, mapH / worldH);

  // Viewport rectangle in minimap coordinates
  const vpW = (typeof window !== "undefined" ? window.innerWidth : 1200) / camera.zoom;
  const vpH = (typeof window !== "undefined" ? window.innerHeight : 800) / camera.zoom;
  const vpX = (-camera.x / camera.zoom - minX) * scale;
  const vpY = (-camera.y / camera.zoom - minY) * scale;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const worldX = clickX / scale + minX;
    const worldY = clickY / scale + minY;

    setCamera({
      ...camera,
      x: -worldX * camera.zoom + window.innerWidth / 2,
      y: -worldY * camera.zoom + window.innerHeight / 2,
    });
  };

  return (
    <div
      className="fixed bottom-12 right-4 z-40 rounded-xl overflow-hidden border border-[var(--color-border-default)] bg-[var(--color-surface-1)]/90 backdrop-blur-sm"
      style={{ width: mapW, height: mapH }}
    >
      <svg
        width={mapW}
        height={mapH}
        className="cursor-crosshair"
        onClick={handleClick}
      >
        {/* Items */}
        {boardItems.map((item) => (
          <rect
            key={item.id}
            x={(item.x - minX) * scale}
            y={(item.y - minY) * scale}
            width={item.width * scale}
            height={item.height * scale}
            rx={2}
            fill="var(--color-accent)"
            fillOpacity={0.6}
          />
        ))}

        {/* Viewport */}
        <rect
          x={vpX}
          y={vpY}
          width={vpW * scale}
          height={vpH * scale}
          rx={2}
          fill="none"
          stroke="var(--color-text-secondary)"
          strokeWidth={1}
          strokeDasharray="3 2"
        />
      </svg>
    </div>
  );
}
