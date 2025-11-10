import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // Parámetros detectados en PHP: from, to
    const from = (req.method === 'GET' ? search.get('from') : (body?.from ?? search.get('from')));
    const to = (req.method === 'GET' ? search.get('to') : (body?.to ?? search.get('to')));
    // SQL #1
    {
      const sql = `SELECT COUNT(DISTINCT dni)
     FROM hist
    WHERE fecha_hora BETWEEN ? AND ?
      AND dni IS NOT NULL AND dni <> '' AND dni <> '0'",
  [$from, $to]
);`;
      const params = [from, to]; // TODO: verificá el orden de parámetros
      await conn.query(sql, params as any);
    }
    // SQL #2
    {
      const sql = `SELECT COUNT(*) FROM providers WHERE active = 'True'"
);`;
      await conn.query(sql);
    }
    // SQL #3
    {
      const sql = `SELECT COUNT(DISTINCT llave)
     FROM hist
    WHERE fecha_hora BETWEEN ? AND ?
      AND llave IS NOT NULL AND llave <> ''",
  [$from, $to]
);`;
      const params = [from, to]; // TODO: verificá el orden de parámetros
      await conn.query(sql, params as any);
    }
    // SQL #4
    {
      const sql = `SELECT COUNT(*) FROM tags WHERE status = 'active'"
);`;
      await conn.query(sql);
    }
    // SQL #5
    {
      const sql = `SELECT COUNT(*) FROM tags");`;
      await conn.query(sql);
    }
    // SQL #6
    {
      const sql = `SELECT COUNT(*) FROM hist
    WHERE fecha_hora BETWEEN ? AND ?
      AND LOWER(estado) = 'permitido'",
  [$from, $to]
);`;
      const params = [from, to]; // TODO: verificá el orden de parámetros
      await conn.query(sql, params as any);
    }
    // SQL #7
    {
      const sql = `SELECT COUNT(*) FROM hist
    WHERE fecha_hora BETWEEN ? AND ?
      AND LOWER(estado) = 'denegado'",
  [$from, $to]
);`;
      const params = [from, to]; // TODO: verificá el orden de parámetros
      const [rows] = await conn.query(sql, params as any);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/stats:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
