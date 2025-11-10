// src/lib/db.ts
import mysql from "mysql2/promise";

let connection: mysql.Connection | null = null;

export async function db() {
  if (!connection) {
    connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "adeco2",
    });
    console.log("✅ Conectado a MySQL (adeco2)");
  }
  return connection;
}