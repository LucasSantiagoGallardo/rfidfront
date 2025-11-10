import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/get_summary?date_from=&date_to=
 * Devuelve:
 * - total_permitidos
 * - total_denegados
 * - usuarios_activos (dni.Active == 'True')
 * - llaves_activas (tags.estado == 1)
 */
export async function GET(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const dateFrom = url.searchParams.get("date_from") || "";
    const dateTo = url.searchParams.get("date_to") || "";

    // Conteo de resultados en registros
    let sql1 = `SELECT
      SUM(CASE WHEN resultado IN ('permitido','ok','1','true') THEN 1 ELSE 0 END) AS total_permitidos,
      SUM(CASE WHEN resultado IN ('denegado','0','false','fail','rechazado') THEN 1 ELSE 0 END) AS total_denegados,
      COUNT(*) AS total
      FROM registros WHERE 1=1`;
    const p1: any[] = [];
    if (dateFrom) { sql1 += " AND fecha >= ?"; p1.push(dateFrom); }
    if (dateTo) { sql1 += " AND fecha <= ?"; p1.push(dateTo); }
    const [rows1] = await conn.query(sql1, p1);

    // Usuarios activos
    const [rows2] = await conn.query(`SELECT COUNT(*) AS usuarios_activos FROM dni WHERE Active IN ('True','true','1')`);

    // Llaves activas
    const [rows3] = await conn.query(`SELECT COUNT(*) AS llaves_activas FROM tags WHERE estado = 1`);

    const a = Array.isArray(rows1) && rows1[0] ? rows1[0] : { total_permitidos: 0, total_denegados: 0, total: 0 };
    const b = Array.isArray(rows2) && rows2[0] ? rows2[0] : { usuarios_activos: 0 };
    const c = Array.isArray(rows3) && rows3[0] ? rows3[0] : { llaves_activas: 0 };

    return NextResponse.json({
      total_permitidos: Number(a.total_permitidos || 0),
      total_denegados: Number(a.total_denegados || 0),
      total_registros: Number(a.total || 0),
      usuarios_activos: Number(b.usuarios_activos || 0),
      llaves_activas: Number(c.llaves_activas || 0),
    });
  } catch (err) {
    console.error("❌ Error /api/get_summary:", err);
    return NextResponse.json({ total_permitidos: 0, total_denegados: 0, total_registros: 0, usuarios_activos: 0, llaves_activas: 0 }, { status: 500 });
  }
}
