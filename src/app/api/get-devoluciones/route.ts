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
      const sql = `SELECT 
            a.ID,
            d.Dni,
            d.Name,
            d.Last_Name,
            d.tag AS Tag,
            a.Mov AS Asignado,
            p.company_name,
            a.fecha
        FROM asig a
        JOIN dni d ON d.Dni = a.ID_dni
        JOIN providers p ON d.Id_Customer = p.id
        WHERE 
            a.Mov = 'Asignado'
            AND p.company_name != 'AdecoAgro'
        ORDER BY a.fecha DESC
    ");`;
      const [rows] = await conn.query(sql);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/get-devoluciones:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
