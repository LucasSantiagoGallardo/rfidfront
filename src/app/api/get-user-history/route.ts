import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // Parámetros detectados en PHP: Dni
    const Dni = (req.method === 'GET' ? search.get('Dni') : (body?.Dni ?? search.get('Dni')));
    // SQL #1
    {
      const sql = `SELECT 
            ah.Event_Date, 
            ah.Type_Mov, 
            ah.ID_Access_Point 
        FROM 
            access_hist ah 
        WHERE 
            ah.Dni = ?
        ORDER BY 
            ah.Event_Date DESC
    ");`;
      const params = [Dni]; // TODO: verificá el orden de parámetros
      const [rows] = await conn.query(sql, params as any);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/get-user-history:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
