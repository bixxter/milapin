import { NextRequest, NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/auth-helpers";
import { pool } from "@/lib/db";
import type { BoardState } from "@/lib/types";

export async function GET() {
  try {
    const session = await getRequiredSession();

    const result = await pool.query(
      `SELECT state FROM boards WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ items: [], comments: [], notes: "" });
    }

    const state = result.rows[0].state as BoardState;

    // Migrate old items without `kind` field
    if (state.items) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state.items = (state.items as any[]).map((item) => {
        if (!item.kind) {
          return { ...item, kind: "media" };
        }
        return item;
      });
    }

    return NextResponse.json(state);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getRequiredSession();
    const body: BoardState = await request.json();

    await pool.query(
      `UPDATE boards SET state = $1::jsonb WHERE user_id = $2`,
      [JSON.stringify(body), session.user.id]
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
