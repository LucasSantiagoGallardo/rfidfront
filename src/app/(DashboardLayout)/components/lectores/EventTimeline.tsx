"use client";
import { useEffect, useState } from "react";
import {
  Box, Typography, List, ListItem, ListItemText, Chip, Divider,
} from "@mui/material";
import { useWebSocket } from "@/lib/ws";

interface Evento {
  hora: string;
  lector: string;
  tipo: "lectura" | "conexion" | "desconexion" | "error";
  mensaje: string;
}

export default function EventTimeline() {
  const [eventos, setEventos] = useState<Evento[]>([]);

  useWebSocket((msg) => {
    const ahora = new Date().toLocaleTimeString();
    let tipo: Evento["tipo"] = "lectura";
    let mensaje = "";

    if (msg.tipo === "estado_lector") {
      tipo = msg.conectado ? "conexion" : "desconexion";
      mensaje = msg.conectado ? "✅ Conectado" : "❌ Desconectado";
    } else if (msg.tipo === "nuevo_evento") {
      tipo = "lectura";
      mensaje =
        msg.estado === "permitido"
          ? `✅ Lectura permitida UID ${msg.uid}`
          : `⛔ Lectura denegada UID ${msg.uid}`;
    } else if (msg.tipo === "error") {
      tipo = "error";
      mensaje = `⚠️ ${msg.mensaje || "Error no especificado"}`;
    }

    setEventos((prev) => [
      { hora: ahora, lector: msg.endpoint || msg.lector, tipo, mensaje },
      ...prev.slice(0, 99),
    ]);
  });

  const color = (tipo: Evento["tipo"]) =>
    tipo === "conexion"
      ? "success"
      : tipo === "desconexion"
      ? "error"
      : tipo === "error"
      ? "warning"
      : "info";

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>🕓 Timeline de eventos en vivo</Typography>
      <Box
        sx={{
          border: "1px solid #ddd",
          borderRadius: 2,
          maxHeight: 400,
          overflowY: "auto",
          background: "#fafafa",
        }}
      >
        <List dense>
          {eventos.length === 0 && (
            <Typography variant="body2" sx={{ p: 2 }} color="text.secondary">
              Aún no hay eventos registrados.
            </Typography>
          )}
          {eventos.map((e, i) => (
            <ListItem key={i} divider>
              <Chip
                color={color(e.tipo)}
                label={e.tipo.toUpperCase()}
                size="small"
                sx={{ mr: 1, minWidth: 100 }}
              />
              <ListItemText
                primary={`${e.hora} — [${e.lector}] ${e.mensaje}`}
                primaryTypographyProps={{
                  sx: {
                    fontFamily: "monospace",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
}
