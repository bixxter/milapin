import { NextRequest, NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/auth-helpers";
import { pool } from "@/lib/db";
import { deleteFromR2 } from "@/lib/r2";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getRequiredSession();
    const { id } = await params;

    // Find the media file (ensure it belongs to the user)
    const result = await pool.query(
      `SELECT id, r2_key, size FROM media_files WHERE id = $1 AND user_id = $2`,
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = result.rows[0];

    // Delete from R2
    await deleteFromR2(file.r2_key);

    // Delete from DB and update storage_used
    await pool.query(`DELETE FROM media_files WHERE id = $1`, [id]);
    await pool.query(
      `UPDATE users SET storage_used = GREATEST(0, storage_used - $1) WHERE id = $2`,
      [file.size, session.user.id]
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
