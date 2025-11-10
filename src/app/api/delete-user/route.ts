import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
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
      const sql = `DELETE, OPTIONS");`;
      await conn.query(sql);
    }
    // SQL #2
    {
      const sql = `DELETE FROM dni WHERE Dni = :Dni");`;
      await conn.query(sql);
    }
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/delete-user:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
