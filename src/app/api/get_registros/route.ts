import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/get_registros?q=&estado=&date_from=&date_to=&barrera=&dni=&limit=1500
 * Equivalente a get_registros.php para el dashboard (tabla y gráficas)
 */
export async function GET(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const estado = (url.searchParams.get("estado") || "").trim().toLowerCase();
    const dateFrom = url.searchParams.get("date_from") || "";
    const dateTo = url.searchParams.get("date_to") || "";
    const barrera = url.searchParams.get("barrera") || "";
    const dni = url.searchParams.get("dni") || "";
    const limit = Number(url.searchParams.get("limit") || 1500);

    let sql = `
      SELECT 
        r.id,
        r.fecha,
        r.hora,
        r.dni,
        r.nombre,
        r.apellido,
        r.llave,
        r.barrera,
        r.resultado
      FROM registros r
      WHERE 1=1
    `;
    const params: any[] = [];

    if (q) {
      sql += ` AND (
        r.nombre LIKE ? OR
        r.apellido LIKE ? OR
        r.dni LIKE ? OR
        r.llave LIKE ? OR
        r.barrera LIKE ? OR
        r.resultado LIKE ?
      )`;
      params.push(`%${q}%`,`%${q}%`,`%${q}%`,`%${q}%`,`%${q}%`,`%${q}%`);
    }

    if (dni) { sql += " AND r.dni = ?"; params.push(dni); }
    if (barrera) { sql += " AND r.barrera = ?"; params.push(barrera); }

    if (estado) {
      if (estado === "permitido") sql += " AND r.resultado IN ('permitido','ok','1','true')";
      else if (estado === "denegado") sql += " AND r.resultado IN ('denegado','0','false','fail','rechazado')";
      else if (estado === "desconocido") sql += " AND r.resultado NOT IN ('permitido','ok','1','true','denegado','0','false','fail','rechazado')";
    }

    if (dateFrom) { sql += " AND r.fecha >= ?"; params.push(dateFrom); }
    if (dateTo) { sql += " AND r.fecha <= ?"; params.push(dateTo); }

    sql += " ORDER BY r.fecha DESC, r.hora DESC LIMIT ?";
    params.push(limit);

    const [rows] = await conn.query(sql, params);
    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error("❌ Error /api/get_registros:", err);
    return NextResponse.json([], { status: 500 });
  }
}
