import { NextRequest, NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/auth-helpers";
import { pool } from "@/lib/db";
import { uploadToR2, getMediaUrl } from "@/lib/r2";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/webm",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_STORAGE = 500 * 1024 * 1024; // 500 MB

const GO_BACKEND_URL = process.env.GO_BACKEND_URL || "http://localhost:8080";

function getMediaType(contentType: string): "image" | "video" | "gif" {
  if (contentType === "image/gif") return "gif";
  if (contentType.startsWith("video/")) return "video";
  return "image";
}

async function uploadVideoViaGo(
  file: File,
  userId: string,
  apiKey: string
): Promise<{
  r2Key: string;
  filename: string;
  size: number;
  contentType: string;
}> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_id", userId);
  formData.append("filename", `${randomUUID()}-${file.name}`);

  const resp = await fetch(`${GO_BACKEND_URL}/compress-upload`, {
    method: "POST",
    headers: { "X-API-Key": apiKey },
    body: formData,
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error || `Go backend returned ${resp.status}`);
  }

  const data = await resp.json();
  return {
    r2Key: data.r2_key,
    filename: data.filename,
    size: data.size,
    contentType: data.content_type,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getRequiredSession();
    const userId = session.user.id;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed: ${file.type}` },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 10 MB limit" },
        { status: 400 }
      );
    }

    // Check quota
    const userResult = await pool.query(
      `SELECT storage_used, api_key FROM users WHERE id = $1`,
      [userId]
    );
    const storageUsed = Number(userResult.rows[0]?.storage_used ?? 0);
    if (storageUsed + file.size > MAX_STORAGE) {
      return NextResponse.json(
        { error: "Storage quota exceeded (500 MB limit)" },
        { status: 413 }
      );
    }

    const mediaType = getMediaType(file.type);

    // Video: proxy through Go backend for compression
    if (mediaType === "video") {
      const apiKey = userResult.rows[0]?.api_key;
      if (!apiKey) {
        return NextResponse.json(
          { error: "API key not configured. Please generate one in Settings." },
          { status: 400 }
        );
      }

      const result = await uploadVideoViaGo(file, userId, apiKey);

      return NextResponse.json({
        file: {
          id: null,
          filename: result.filename,
          url: getMediaUrl(result.r2Key),
          r2Key: result.r2Key,
          type: "video",
          size: result.size,
          createdAt: Date.now(),
        },
      });
    }

    // Images/GIFs: upload directly to R2 (existing logic)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uuid = randomUUID();
    const r2Key = `${userId}/${uuid}-${file.name}`;
    await uploadToR2(r2Key, buffer, file.type);

    // Insert into DB
    const insertResult = await pool.query(
      `INSERT INTO media_files (user_id, filename, r2_key, content_type, size, type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [userId, file.name, r2Key, file.type, file.size, mediaType]
    );

    // Update storage_used
    await pool.query(
      `UPDATE users SET storage_used = storage_used + $1 WHERE id = $2`,
      [file.size, userId]
    );

    const row = insertResult.rows[0];

    return NextResponse.json({
      file: {
        id: row.id,
        filename: file.name,
        url: getMediaUrl(r2Key),
        r2Key,
        type: mediaType,
        size: file.size,
        createdAt: new Date(row.created_at).getTime(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
