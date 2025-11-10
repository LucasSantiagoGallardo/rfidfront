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
      const sql = `SELECT * FROM dni WHERE Dni = '$dni'");`;
      await conn.query(sql);
    }
    // SQL #2
    {
      const sql = `SELECT * FROM documentacion_usuario WHERE dni = '$dni'");`;
      await conn.query(sql);
    }
    // SQL #3
    {
      const sql = `SELECT tipo, estado, vencimiento, archivo_url FROM documentacion_usuario WHERE dni = '$dni'");`;
      await conn.query(sql);
    }
    // SQL #4
    {
      const sql = `SELECT * FROM historial WHERE dni = '$dni' ORDER BY fecha DESC, hora DESC LIMIT 20");`;
      const [rows] = await conn.query(sql);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/get_perfil:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
