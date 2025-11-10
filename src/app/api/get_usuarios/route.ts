import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/get_usuarios?q=&active=(true|false|all)&limit=100
 */
export async function GET(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const active = (url.searchParams.get("active") || "all").toLowerCase();
    const limit = Number(url.searchParams.get("limit") || 100);

    let sql = `
      SELECT u.Dni, u.Name, u.Last_Name, u.Telefono, u.Id_Key, u.patente, u.tag,
             u.Active, u.Id_Customer, p.company_name
      FROM dni u
      LEFT JOIN providers p ON p.id = u.Id_Customer
      WHERE 1=1
    `;
    const params: any[] = [];

    if (q) {
      sql += ` AND (
        u.Dni LIKE ? OR
        u.Name LIKE ? OR
        u.Last_Name LIKE ? OR
        u.Id_Key LIKE ? OR
        u.tag LIKE ? OR
        p.company_name LIKE ?
      )`;
      params.push(`%${q}%`,`%${q}%`,`%${q}%`,`%${q}%`,`%${q}%`,`%${q}%`);
    }

    if (active === "true") sql += " AND u.Active IN ('True','true', '1')";
    if (active === "false") sql += " AND u.Active IN ('False','false', '0')";

    sql += " ORDER BY u.Dni DESC LIMIT ?";
    params.push(limit);

    const [rows] = await conn.query(sql, params);
    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error("❌ Error /api/get_usuarios:", err);
    return NextResponse.json([], { status: 500 });
  }
}
