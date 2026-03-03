import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/auth-helpers";
import { pool } from "@/lib/db";
import { getMediaUrl } from "@/lib/r2";

export async function GET() {
  try {
    const session = await getRequiredSession();

    const result = await pool.query(
      `SELECT id, filename, r2_key, content_type, size, type, created_at
       FROM media_files
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [session.user.id]
    );

    const files = result.rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      url: getMediaUrl(row.r2_key),
      r2Key: row.r2_key,
      type: row.type as "image" | "video" | "gif",
      size: Number(row.size),
      createdAt: new Date(row.created_at).getTime(),
    }));

    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
