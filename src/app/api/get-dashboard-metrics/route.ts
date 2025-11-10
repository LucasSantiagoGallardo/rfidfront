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
      const sql = `SELECT COUNT(*) AS active_users FROM dni WHERE Active = 'Yes' or Active = 'True'");`;
      await conn.query(sql);
    }
    // SQL #2
    {
      const sql = `SELECT 
    SUM(CASE WHEN Id_Key != ''  THEN 1 ELSE 0 END) AS active_keys,
    SUM(CASE WHEN Id_Key  = ''   THEN 0 ELSE 0 END) AS inactive_keys
FROM dni
    ");`;
      await conn.query(sql);
    }
    // SQL #3
    {
      const sql = `SELECT COUNT(*) AS total_providers FROM providers");`;
      const [rows] = await conn.query(sql);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/get-dashboard-metrics:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
