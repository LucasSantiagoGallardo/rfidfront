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
      const sql = `UPDATE dni SET tag ='' WHERE tag = :rfid_id");`;
      await conn.query(sql);
    }
    // SQL #2
    {
      const sql = `UPDATE tag SET estado = :estado WHERE rfid_id = :rfid_id
    ");`;
      await conn.query(sql);
    }
    // SQL #3
    {
      const sql = `INSERT INTO asig (ID_dni, ID_tag, Mov, fecha) VALUES ('$dni', '$rfid_id', '$estado', NOW())");`;
      await conn.query(sql);
    }
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/update-tag:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
