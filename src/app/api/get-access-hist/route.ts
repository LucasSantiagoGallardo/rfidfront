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
            ah.Event_Date, 
            ah.Type_Mov, 
            ah.ID_Access_Point, 
            d.Name, 
            d.Last_Name,
            ah.ID_key
        FROM 
            access_hist ah
        INNER JOIN 
            dni d ON d.Dni = ah.Dni
        WHERE 
            (d.Active = 'True' OR d.Active = 'Yes')
            AND ah.ID_Access_Point IN (1, 2, 3, 4)
        GROUP BY 
            ah.Event_Date
        ORDER BY 
            ah.Event_Date DESC
        LIMIT 30 ");`;
      const [rows] = await conn.query(sql);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/get-access-hist:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
