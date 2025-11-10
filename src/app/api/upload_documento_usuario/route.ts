import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const conn = await db();
    const url = new URL(req.url);
    const search = url.searchParams;
    let body: any = {};
    if (req.method !== 'GET') { try { body = await req.json(); } catch { body = {}; } }
    // Parámetros detectados en PHP: dni, tipo
    const dni = (req.method === 'GET' ? search.get('dni') : (body?.dni ?? search.get('dni')));
    const tipo = (req.method === 'GET' ? search.get('tipo') : (body?.tipo ?? search.get('tipo')));
    // SQL #1
    {
      const sql = `delete = $mysqli->prepare("DELETE FROM documentacion_usuario WHERE dni = ? AND tipo = ?");`;
      const params = [dni, tipo]; // TODO: verificá el orden de parámetros
      await conn.query(sql, params as any);
    }
    // SQL #2
    {
      const sql = `delete->bind_param("ss", $dni, $tipo);`;
      await conn.query(sql);
    }
    // SQL #3
    {
      const sql = `delete->execute();`;
      await conn.query(sql);
    }
    // SQL #4
    {
      const sql = `insert = $mysqli->prepare("INSERT INTO documentacion_usuario (dni, tipo, estado, vencimiento, archivo_url) VALUES (?, ?, 'vigente', '', ?)");`;
      const params = [dni, tipo]; // TODO: verificá el orden de parámetros
      await conn.query(sql, params as any);
    }
    // SQL #5
    {
      const sql = `insert->bind_param("sss", $dni, $tipo, $urlRelativa);`;
      await conn.query(sql);
    }
    // SQL #6
    {
      const sql = `insert->execute();`;
      await conn.query(sql);
    }
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/upload_documento_usuario:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
