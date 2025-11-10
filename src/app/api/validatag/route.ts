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
      const sql = `SELECT * FROM dni WHERE tag = :rfid_id");`;
      await conn.query(sql);
    }
    // SQL #2
    {
      const sql = `SELECT timestamp FROM hist WHERE Id_Key = :id_key ORDER BY timestamp DESC LIMIT 1");`;
      await conn.query(sql);
    }
    // SQL #3
    {
      const sql = `INSERT INTO hist (Id_Key, dni, barrera, estado, nombre, apellido) VALUES (:id_key, :dni, :barrera, :estado, :nombre, :apellido)");`;
      await conn.query(sql);
    }
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/validatag:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
