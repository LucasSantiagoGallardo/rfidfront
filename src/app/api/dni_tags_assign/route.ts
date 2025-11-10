import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // Parámetros detectados en PHP: dni_id, tag
    const dni_id = (req.method === 'GET' ? search.get('dni_id') : (body?.dni_id ?? search.get('dni_id')));
    const tag = (req.method === 'GET' ? search.get('tag') : (body?.tag ?? search.get('tag')));
    // SQL #1
    {
      const sql = `SELECT id, Id_Customer FROM dni WHERE id = :id");`;
      await conn.query(sql);
    }
    // SQL #2
    {
      const sql = `UPDATE dni SET tag = :tag, Permission_End = :perm WHERE id = :id");`;
      await conn.query(sql);
    }
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/dni_tags_assign:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
