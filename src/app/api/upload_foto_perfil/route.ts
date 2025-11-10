import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // Parámetros detectados en PHP: dni, tipo
    const dni = (req.method === 'GET' ? search.get('dni') : (body?.dni ?? search.get('dni')));
    const tipo = (req.method === 'GET' ? search.get('tipo') : (body?.tipo ?? search.get('tipo')));
    // SQL #1
    {
      const sql = `UPDATE dni SET $tipo = ? WHERE Dni = ?");`;
      const params = [dni, tipo]; // TODO: verificá el orden de parámetros
      await conn.query(sql, params as any);
    }
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/upload_foto_perfil:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
