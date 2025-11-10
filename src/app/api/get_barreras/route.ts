import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/get_barreras */
export async function GET() {
  try {
    const conn = await db();
    const [rows] = await conn.query("SELECT id, nombre, codigo FROM barreras ORDER BY nombre ASC");
    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error("❌ Error /api/get_barreras:", err);
    return NextResponse.json([], { status: 500 });
  }
}
