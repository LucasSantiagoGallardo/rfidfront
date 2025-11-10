import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dni = searchParams.get("dni");
    const barrera = searchParams.get("barrera");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000);
    const where: string[] = []; const args: any[] = [];
    if (dni) { where.push("dni = ?"); args.push(dni); }
    if (barrera) { where.push("barrera = ?"); args.push(barrera); }
    const sql = `SELECT id, Id_Key AS id_key, dni, barrera, estado, timestamp
                 FROM hist ${where.length ? "WHERE " + where.join(" AND ") : ""}
                 ORDER BY id DESC LIMIT ?`;
    args.push(limit);
    const [rows] = await db.query(sql, args);
    return NextResponse.json(rows);
  } catch (e:any) {
    console.error(e);
    return NextResponse.json({ error: "Error obteniendo historial" }, { status: 500 });
  }
}
