import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // Parámetros detectados en PHP: termino
    const termino = (req.method === 'GET' ? search.get('termino') : (body?.termino ?? search.get('termino')));
    // SQL #1
    {
      const sql = `SELECT Dni, Name, Last_Name, Id_Customer, Id_Key, Permission_End, Obs, Order_POS, Update_NO, Active, Telefono, id, patente, tag
    FROM dni
    WHERE 
        Dni LIKE :t OR
        Name LIKE :t OR
        Last_Name LIKE :t OR
        Id_Key LIKE :t OR
        patente LIKE :t OR
        tag LIKE :t
    LIMIT 30
");`;
      const [rows] = await conn.query(sql);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/buscar-dni:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
