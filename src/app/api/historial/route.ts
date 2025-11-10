import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // Parámetros detectados en PHP: dni
    const dni = (req.method === 'GET' ? search.get('dni') : (body?.dni ?? search.get('dni')));
    // SQL #1
    {
      const sql = `SELECT fecha, barrera, accion FROM historial WHERE dni = ?";`;
      const params = [dni]; // TODO: verificá el orden de parámetros
      const [rows] = await conn.query(sql, params as any);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/historial:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
