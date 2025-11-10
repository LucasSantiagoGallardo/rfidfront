import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readJSON } from "@/lib/request";

export async function DELETE(req: NextRequest) {
  try {
    const body = await readJSON<{ id:number }>(req);
    if (!body.id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
    await db.query("DELETE FROM tags WHERE id = ?", [body.id]);
    return NextResponse.json({ success:true });
  } catch (e:any){ console.error(e); return NextResponse.json({ error:"Error" },{status:500}); }
}
