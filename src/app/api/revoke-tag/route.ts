import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // Parámetros detectados en PHP: custo, dni, tag
    const custo = (req.method === 'GET' ? search.get('custo') : (body?.custo ?? search.get('custo')));
    const dni = (req.method === 'GET' ? search.get('dni') : (body?.dni ?? search.get('dni')));
    const tag = (req.method === 'GET' ? search.get('tag') : (body?.tag ?? search.get('tag')));
    // SQL #1
    {
      const sql = `UPDATE dni SET tag = '' WHERE Dni = '$dni'`;
      await conn.query(sql);
    }
    // SQL #2
    {
      const sql = `INSERT INTO asig (ID_dni, ID_tag, ID_customer, Mov, fecha) VALUES ('$dni', '$tag','$compa', 'revoke', NOW())`;
      await conn.query(sql);
    }
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/revoke-tag:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
