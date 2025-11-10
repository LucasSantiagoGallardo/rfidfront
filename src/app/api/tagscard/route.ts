import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // SQL #1
    {
      const sql = `SELECT COUNT(*) FROM `tag`");`;
      await conn.query(sql);
    }
    // SQL #2
    {
      const sql = `SELECT tipo, COUNT(*) as count FROM `tag` GROUP BY tipo");`;
      await conn.query(sql);
    }
    // SQL #3
    {
      const sql = `SELECT COUNT(tag) FROM `dni` JOIN tag on dni.tag = tag.rfid_id WHERE tag.tipo = 'calcomania'");`;
      await conn.query(sql);
    }
    // SQL #4
    {
      const sql = `SELECT COUNT(tag) FROM `dni` JOIN tag on dni.tag = tag.rfid_id WHERE tag.tipo = 'llavero'");`;
      const [rows] = await conn.query(sql);
    }
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error /api/tagscard:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
