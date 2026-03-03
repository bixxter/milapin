export interface MediaFile {
  id: string;
  filename: string;
  url: string;
  r2Key?: string;
  type: "image" | "video" | "gif";
  size: number;
  createdAt: number;
}

export type Tool = "select" | "rect" | "ellipse" | "arrow" | "text" | "comment";

export interface Comment {
  id: string;
  x: number;
  y: number;
  text: string;
  createdAt: number;
}

export type BoardItemKind = "media" | "rect" | "ellipse" | "arrow" | "text";

export interface BoardItemBase {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MediaItem extends BoardItemBase {
  kind: "media";
  filename: string;
}

export interface RectItem extends BoardItemBase {
  kind: "rect";
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
}

export interface EllipseItem extends BoardItemBase {
  kind: "ellipse";
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface ArrowItem extends BoardItemBase {
  kind: "arrow";
  stroke: string;
  strokeWidth: number;
  // Start/end relative to x,y (bounding box)
  points: [number, number, number, number];
}

export interface TextItem extends BoardItemBase {
  kind: "text";
  text: string;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textTransform: "none" | "uppercase";
  textDecoration: "none" | "underline" | "line-through";
  fontFamily: "sans" | "serif" | "mono";
}

export type BoardItem = MediaItem | RectItem | EllipseItem | ArrowItem | TextItem;

export interface BoardState {
  items: BoardItem[];
  comments?: Comment[];
  notes?: string;
  camera?: { x: number; y: number; zoom: number };
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}
