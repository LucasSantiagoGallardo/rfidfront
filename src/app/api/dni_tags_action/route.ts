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
      const sql = `DELETE, OPTIONS");`;
      await conn.query(sql);
    }
    // SQL #2
    {
      const sql = `UPDATE dni SET tag = '', Id_Key = '' WHERE id IN ($in)";`;
      await conn.query(sql);
    }
    // SQL #3
    {
      const sql = `UPDATE dni SET tag = '' WHERE id IN ($in)";`;
      await conn.query(sql);
    }
    // SQL #4
    {
      const sql = `UPDATE dni SET Permission_End = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m-%d') WHERE id IN ($in)";`;
      await conn.query(sql);
    }
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/dni_tags_action:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
