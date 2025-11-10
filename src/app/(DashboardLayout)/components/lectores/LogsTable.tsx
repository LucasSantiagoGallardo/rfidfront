"use client";
import { Box, Typography, List, ListItem, ListItemText, Chip } from "@mui/material";

interface Log {
  fecha?: string;
  tipo_evento?: string;
  mensaje: string;
}

const colorMap: Record<string, "success" | "error" | "warning" | "info"> = {
  conexion: "success",
  desconexion: "error",
  lectura: "info",
  error: "warning",
};

export default function LogsTable({ logs }: { logs: Log[] }) {
  if (!logs || logs.length === 0)
    return <Typography variant="body2" color="text.secondary">Sin logs disponibles.</Typography>;

  return (
    <Box sx={{ maxHeight: 300, overflowY: "auto", border: "1px solid #ddd", borderRadius: 2, p: 1 }}>
      <List dense>
        {logs.map((log, i) => (
          <ListItem key={i} divider>
            <Chip
              label={log.tipo_evento || "evento"}
              color={colorMap[log.tipo_evento || "info"]}
              size="small"
              sx={{ mr: 1 }}
            />
            <ListItemText
              primary={log.mensaje}
              secondary={log.fecha ? new Date(log.fecha).toLocaleString() : ""}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
