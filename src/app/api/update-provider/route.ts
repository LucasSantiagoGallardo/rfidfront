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
      const sql = `UPDATE providers
        SET company_name = :company_name,
            contact_name = :contact_name,
            email = :email,
            phone = :phone,
            key_expiration_date = :key_expiration_date,
            notes = :notes,
            active = :active
        WHERE id = :id
    ");`;
      await conn.query(sql);
    }
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/update-provider:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
