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
      const sql = `UPDATE dni SET 
    Name = ?, 
    Last_Name = '', 
    Id_Key = ?, 
    Patente = ?, 
    tag = ?, 
    Telefono = ?, 
    Id_Customer = ?, 
    Active = ?, 
    Obs = ?, 
    Permission_End = ? 
WHERE Dni = ?";`;
      const params = []; // TODO: verificá el orden de parámetros
      await conn.query(sql, params as any);
    }
    // SQL #2
    {
      const sql = `update = $mysqli->prepare($sql);`;
      await conn.query(sql);
    }
    // SQL #3
    {
      const sql = `update) {
    echo json_encode(['error' => 'Error al preparar el UPDATE', 'detalle' => $mysqli->error]);`;
      await conn.query(sql);
    }
    // SQL #4
    {
      const sql = `update->bind_param(
    "ssssssssss",
    $data['nombre'],
    $data['idKey'],
    $data['patente'],
    $data['tag'],
    $data['telefono'],
    $data['proveedor'],
    $data['activo'],
    $data['obs'],
    $data['permisoHasta'],
    $dni
);`;
      await conn.query(sql);
    }
    // SQL #5
    {
      const sql = `update->execute();`;
      await conn.query(sql);
    }
    // SQL #6
    {
      const sql = `DELETE FROM documentacion_usuario WHERE dni = '$dni'");`;
      await conn.query(sql);
    }
    // SQL #7
    {
      const sql = `INSERT INTO documentacion_usuario (dni, tipo, estado, vencimiento) VALUES (?, ?, ?, ?)");`;
      const params = []; // TODO: verificá el orden de parámetros
      await conn.query(sql, params as any);
    }
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error('❌ Error /api/update_perfil:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
