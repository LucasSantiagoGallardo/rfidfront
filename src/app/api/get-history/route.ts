import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // Parámetros detectados en PHP: dni, end, start
    const dni = (req.method === 'GET' ? search.get('dni') : (body?.dni ?? search.get('dni')));
    const end = (req.method === 'GET' ? search.get('end') : (body?.end ?? search.get('end')));
    const start = (req.method === 'GET' ? search.get('start') : (body?.start ?? search.get('start')));
    // SQL #1
    {
      const sql = `SELECT Event_Date, Type_Mov, ID_Access_Point, Validation FROM access_hist WHERE Dni = :dni";`;
      const [rows] = await conn.query(sql);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/get-history:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
