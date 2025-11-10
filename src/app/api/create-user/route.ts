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
      const sql = `SELECT Dni, Name, Last_Name, Id_Key, tag 
        FROM dni 
        WHERE Dni = :dni OR Id_Key = :id_key OR tag = :tag
    ");`;
      await conn.query(sql);
    }
    // SQL #3
    {
      const sql = `INSERT INTO dni (Dni, Name, Last_Name, Telefono, Active, Id_Key, Id_Customer, tag) 
        VALUES (:Dni, :Name, :Last_Name, :Telefono, :Active, :Id_Key, :Id_Customer, :tag)");`;
      await conn.query(sql);
    }
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/create-user:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
