import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // Parámetros detectados en PHP: id_tag
    const id_tag = (req.method === 'GET' ? search.get('id_tag') : (body?.id_tag ?? search.get('id_tag')));
    // SQL #1
    {
      const sql = `SELECT tipo FROM tag WHERE rfid_id = :rfid_id");`;
      const [rows] = await conn.query(sql);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/check-tag:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
