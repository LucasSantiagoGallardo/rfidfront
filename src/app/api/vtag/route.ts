import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // Parámetros detectados en PHP: dni, epc, nombre, nombreApe
    const dni = (req.method === 'GET' ? search.get('dni') : (body?.dni ?? search.get('dni')));
    const epc = (req.method === 'GET' ? search.get('epc') : (body?.epc ?? search.get('epc')));
    const nombre = (req.method === 'GET' ? search.get('nombre') : (body?.nombre ?? search.get('nombre')));
    const nombreApe = (req.method === 'GET' ? search.get('nombreApe') : (body?.nombreApe ?? search.get('nombreApe')));
    // SQL #1
    {
      const sql = `SELECT * FROM dni WHERE (tag = :tag OR Id_Key = :tag) LIMIT 1");`;
      await conn.query(sql);
    }
    // SQL #2
    {
      const sql = `INSERT INTO hist (Id_Key, barrera, dni, nombre, apellido, resultado) VALUES (:id_key, :barrera, :dni, :nombre, :apellido, :resultado)");`;
      await conn.query(sql);
    }
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/vtag:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
