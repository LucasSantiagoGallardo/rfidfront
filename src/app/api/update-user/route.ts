import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const conn = await db();
    const body = await req.json();

    const {
      Dni,
      Name,
      Last_Name,
      Telefono,
      Active,
      Id_Key,
      Id_Customer,
      tag,
      ID_tag,
    } = body;

    // 🔹 Validación mínima
    if (!Dni) {
      return NextResponse.json({ error: "DNI es requerido" }, { status: 400 });
    }

    // 1️⃣ Buscar posibles duplicados
    const sqlCheck = `
      SELECT Dni, Name, Last_Name, Id_Key, tag
      FROM dni
      WHERE tag = ? AND Dni != ?
    `;
    const [existing] = await conn.query(sqlCheck, [tag, Dni]);

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { error: `Tag ya asignado a otro usuario (DNI: ${existing[0].Dni})` },
        { status: 409 }
      );
    }

    // 2️⃣ Actualizar datos del usuario
    const sqlUpdate = `
      UPDATE dni
      SET Name = ?, Last_Name = ?, Telefono = ?, Active = ?, Id_Key = ?, Id_Customer = ?, tag = ?
      WHERE Dni = ?
    `;
    await conn.query(sqlUpdate, [
      Name,
      Last_Name,
      Telefono,
      Active,
      Id_Key,
      Id_Customer,
      tag,
      Dni,
    ]);

    // 3️⃣ Registrar en historial de asignaciones
    const sqlInsertAsig = `
      INSERT INTO asig (ID_dni, ID_tag, Mov, fecha)
      VALUES (?, ?, 'update', NOW())
    `;
    await conn.query(sqlInsertAsig, [Dni, ID_tag || tag]);

    return NextResponse.json({ message: "Usuario actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error /api/update-user:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
