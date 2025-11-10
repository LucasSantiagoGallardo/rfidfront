import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // No se detectaron consultas SQL en el PHP original.
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/noti:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
