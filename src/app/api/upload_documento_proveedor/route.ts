import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // Parámetros detectados en PHP: observaciones, proveedor_id, tipo, vencimiento
    const observaciones = (req.method === 'GET' ? search.get('observaciones') : (body?.observaciones ?? search.get('observaciones')));
    const proveedor_id = (req.method === 'GET' ? search.get('proveedor_id') : (body?.proveedor_id ?? search.get('proveedor_id')));
    const tipo = (req.method === 'GET' ? search.get('tipo') : (body?.tipo ?? search.get('tipo')));
    const vencimiento = (req.method === 'GET' ? search.get('vencimiento') : (body?.vencimiento ?? search.get('vencimiento')));
    // SQL #1
    {
      const sql = `INSERT INTO documentacion_proveedor (proveedor_id, tipo, archivo_url, vencimiento, observaciones) VALUES (?, ?, ?, ?, ?)");`;
      const params = [observaciones, proveedor_id, tipo, vencimiento]; // TODO: verificá el orden de parámetros
      await conn.query(sql, params as any);
    }
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/upload_documento_proveedor:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
