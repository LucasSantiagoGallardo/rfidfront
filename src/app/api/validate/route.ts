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
      const sql = `SELECT * FROM dni WHERE Id_Key = ?";`;
      const params = []; // TODO: verificá el orden de parámetros
      await conn.query(sql, params as any);
    }
    // SQL #2
    {
      const sql = `INSERT INTO `hist` (`Id_Key`, `dni`, `barrera`, `estado`) VALUES (:id_key, :dni, :barrera, 'permitido')");`;
      await conn.query(sql);
    }
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/validate:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
