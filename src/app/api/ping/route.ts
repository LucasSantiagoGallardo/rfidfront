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
      const sql = `SELECT DATABASE()")->fetchColumn();`;
      await conn.query(sql);
    }
    // SQL #2
    {
      const sql = `SELECT COUNT(*) FROM providers")->fetchColumn();`;
      const [rows] = await conn.query(sql);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/ping:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
