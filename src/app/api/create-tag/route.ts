import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // SQL #1
    {
      const sql = `INSERT INTO tag (rfid_id, tipo, estado, fecha)
        VALUES (:rfid_id, :tipo, 1, NOW())
    ");`;
      await conn.query(sql);
    }
    // SQL #2
    {
      const sql = `INSERT INTO asig (ID_tag, Mov, fecha) VALUES ('$rfid_id', 'Creado', NOW())");`;
      await conn.query(sql);
    }
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/create-tag:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
