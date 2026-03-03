import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/auth-helpers";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const session = await getRequiredSession();
    const result = await pool.query(
      `SELECT api_key FROM users WHERE id = $1`,
      [session.user.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ apiKey: result.rows[0].api_key });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST() {
  try {
    const session = await getRequiredSession();
    const result = await pool.query(
      `UPDATE users SET api_key = encode(gen_random_bytes(32), 'hex'), updated_at = now()
       WHERE id = $1 RETURNING api_key`,
      [session.user.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ apiKey: result.rows[0].api_key });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
