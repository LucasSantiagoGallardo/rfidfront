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
      const sql = `DELETE, OPTIONS");`;
      await conn.query(sql);
    }
    // SQL #2
    {
      const sql = `INSERT INTO providers (company_name, contact_name, email, phone, key_expiration_date, notes, active)
        VALUES (:company_name, :contact_name, :email, :phone, :key_expiration_date, :notes, :active)
    ");`;
      await conn.query(sql);
    }
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/create-provider:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
