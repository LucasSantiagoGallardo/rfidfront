import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // Parámetros detectados en PHP: customer, customer_group, only_assigned, q
    const customer = (req.method === 'GET' ? search.get('customer') : (body?.customer ?? search.get('customer')));
    const customer_group = (req.method === 'GET' ? search.get('customer_group') : (body?.customer_group ?? search.get('customer_group')));
    const only_assigned = (req.method === 'GET' ? search.get('only_assigned') : (body?.only_assigned ?? search.get('only_assigned')));
    const q = (req.method === 'GET' ? search.get('q') : (body?.q ?? search.get('q')));
    // SQL #1
    {
      const sql = `SELECT
  SUM(CASE WHEN (dni.tag IS NOT NULL AND dni.tag<>'') THEN 1 ELSE 0 END) AS total,
  SUM(CASE WHEN (dni.tag IS NOT NULL AND dni.tag<>'')
            AND (dni.Id_Customer IS NULL OR dni.Id_Customer='' OR dni.Id_Customer='1') THEN 1 ELSE 0 END) AS totala,
  SUM(CASE WHEN (dni.tag IS NOT NULL AND dni.tag<>'')
            AND NOT (dni.Id_Customer IS NULL OR dni.Id_Customer='' OR dni.Id_Customer='1') THEN 1 ELSE 0 END) AS totalp,
  SUM(CASE WHEN (dni.tag IS NOT NULL AND dni.tag<>'')
            AND NOT (dni.Id_Customer IS NULL OR dni.Id_Customer='' OR dni.Id_Customer='1')
            AND NOW() > CONCAT(CURDATE(), ' 22:00:00')
           THEN 1 ELSE 0 END) AS asigc
FROM dni
{$whereSql}
";`;
      const [rows] = await conn.query(sql);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/dni_tags_stats:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
