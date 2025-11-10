import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/users */
export async function GET() {
  try {
    const conn = await db();
    const [rows] = await conn.query(`
      SELECT u.*, p.company_name 
      FROM dni u
      LEFT JOIN providers p ON u.Id_Customer = p.id
    `);
    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error("❌ Error /api/users:", err);
    return NextResponse.json([], { status: 500 });
  }
}
