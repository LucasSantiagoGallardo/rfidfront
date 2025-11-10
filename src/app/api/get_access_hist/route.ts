import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/get_access_hist?date_from=&date_to=&groupBy=(hour|day|barrera)&barrera=&dni=
 * Agrega conteos para gráficas de líneas/barras.
 */
export async function GET(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const dateFrom = url.searchParams.get("date_from") || "";
    const dateTo = url.searchParams.get("date_to") || "";
    const barrera = url.searchParams.get("barrera") || "";
    const dni = url.searchParams.get("dni") || "";
    const groupBy = (url.searchParams.get("groupBy") || "day").toLowerCase();

    let groupSql = "DATE(r.fecha) AS bucket";
    if (groupBy === "hour") groupSql = "CONCAT(DATE(r.fecha), ' ', LPAD(HOUR(r.hora),2,'0'), ':00') AS bucket";
    if (groupBy === "barrera") groupSql = "r.barrera AS bucket";

    let sql = `
      SELECT
        ${groupSql},
        SUM(CASE WHEN r.resultado IN ('permitido','ok','1','true') THEN 1 ELSE 0 END) AS permitidos,
        SUM(CASE WHEN r.resultado IN ('denegado','0','false','fail','rechazado') THEN 1 ELSE 0 END) AS denegados,
        COUNT(*) AS total
      FROM registros r
      WHERE 1=1
    `;
    const params: any[] = [];

    if (dateFrom) { sql += " AND r.fecha >= ?"; params.push(dateFrom); }
    if (dateTo) { sql += " AND r.fecha <= ?"; params.push(dateTo); }
    if (barrera) { sql += " AND r.barrera = ?"; params.push(barrera); }
    if (dni) { sql += " AND r.dni = ?"; params.push(dni); }

    sql += ` GROUP BY bucket ORDER BY bucket ASC`;

    const [rows] = await conn.query(sql, params);
    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error("❌ Error /api/get_access_hist:", err);
    return NextResponse.json([], { status: 500 });
  }
}
