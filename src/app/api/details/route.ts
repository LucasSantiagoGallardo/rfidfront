import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // Parámetros detectados en PHP: dni
    const dni = (req.method === 'GET' ? search.get('dni') : (body?.dni ?? search.get('dni')));
    // SQL #1
    {
      const sql = `SELECT 
            ah.Event_Date,
            ah.Type_Mov,
            ah.ID_Access_Point,
            d.Name,
            d.Last_Name,
            CASE 
                WHEN ah.ID_Access_Point IN (1, 2) THEN 'Tambo1'
                WHEN ah.ID_Access_Point IN (3, 4) THEN 'Tambo2'
                ELSE 'Desconocido'
            END AS Barrera,
            CASE 
                WHEN ah.Type_Mov = 'IN' THEN 'Entrada'
                WHEN ah.Type_Mov = 'OUT' THEN 'Salida'
                ELSE 'Desconocido'
            END AS Movimiento
        FROM 
            access_hist ah
        INNER JOIN 
            dni d ON ah.Dni = d.Dni
        WHERE 
            ah.Dni = :dni
            GROUP BY
            AH.Event_Date
        
        ORDER BY 
            ah.Event_Date DESC
    ";`;
      const [rows] = await conn.query(sql);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/details:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
