import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // SQL #1
    {
      const sql = `SELECT u.*, t.* 
        FROM tag t
        LEFT JOIN  dni u ON  t.rfid_id  = u.tag  
       
    ");`;
      const [rows] = await conn.query(sql);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/tags:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
