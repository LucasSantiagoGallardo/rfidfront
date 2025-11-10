import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // Parámetros detectados en PHP: customer, customer_group, only_assigned, q
    const customer = (req.method === 'GET' ? search.get('customer') : (body?.customer ?? search.get('customer')));
    const customer_group = (req.method === 'GET' ? search.get('customer_group') : (body?.customer_group ?? search.get('customer_group')));
    const only_assigned = (req.method === 'GET' ? search.get('only_assigned') : (body?.only_assigned ?? search.get('only_assigned')));
    const q = (req.method === 'GET' ? search.get('q') : (body?.q ?? search.get('q')));
    // SQL #1
    {
      const sql = `SELECT
    d.id                          AS ID,
    CAST(d.Dni AS CHAR)           AS Dni,
    TRIM(COALESCE(d.tag,''))      AS Tag,
    CASE WHEN d.Id_Customer IN ('$adecoList') THEN 'ADECO' ELSE 'P' END AS Tipo,
    CASE WHEN TRIM(COALESCE(d.tag,'')) <> '' THEN 'SI' ELSE 'NO' END AS Asignado,
    d.Permission_End              AS VenceRaw,
    $permExpr                     AS VenceCalc,
    CASE
      WHEN TRIM(COALESCE(d.tag,'')) = '' THEN 'ok'
      WHEN $permExpr IS NULL THEN 'ok'
      WHEN $permExpr < NOW() THEN 'vencido'
      ELSE 'ok'
    END AS Estado,
    d.Name      AS Nombre,
    d.Last_Name AS Apellido,
    COALESCE(NULLIF(TRIM(d.Id_Customer),''),'(null)') AS Id_Customer
  FROM dni d
  ".($where ? 'WHERE '.implode(' AND ',$where) : '')."
  ORDER BY d.id DESC
";`;
      const params = [customer]; // TODO: verificá el orden de parámetros
      const [rows] = await conn.query(sql, params as any);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/dni_tags_list:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
