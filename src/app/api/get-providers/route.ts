import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const conn = await db();

    // ✅ Consulta igual que en tu PHP original
    const sql = `
      SELECT id, company_name 
      FROM providers
      ORDER BY company_name ASC
    `;
    const [rows] = await conn.query(sql);

    // ✅ Forzamos que siempre sea array (aunque no haya resultados)
    const providers = Array.isArray(rows) ? rows : [];

    return NextResponse.json(providers);
  } catch (err) {
    console.error("❌ Error /api/get-providers:", err);
    // ✅ Si hay error, devolvemos un array vacío
    return NextResponse.json([], { status: 500 });
  }
}
