import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // Parámetros detectados en PHP: proveedor_id
    const proveedor_id = (req.method === 'GET' ? search.get('proveedor_id') : (body?.proveedor_id ?? search.get('proveedor_id')));
    // SQL #1
    {
      const sql = `SELECT tipo, archivo_url, vencimiento, observaciones FROM documentacion_proveedor WHERE proveedor_id = ?");`;
      const params = [proveedor_id]; // TODO: verificá el orden de parámetros
      const [rows] = await conn.query(sql, params as any);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/get_documentos_proveedor:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
