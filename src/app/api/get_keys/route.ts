import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/get_keys?dni= */
export async function GET(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const dni = url.searchParams.get("dni") || "";

    let sql = `SELECT t.id_tag AS id, t.tipo, t.estado, t.dni FROM tags t WHERE 1=1`;
    const params: any[] = [];

    if (dni) { sql += " AND t.dni = ?"; params.push(dni); }
    sql += " ORDER BY t.estado DESC, t.id_tag ASC";

    const [rows] = await conn.query(sql, params);
    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error("❌ Error /api/get_keys:", err);
    return NextResponse.json([], { status: 500 });
  }
}
