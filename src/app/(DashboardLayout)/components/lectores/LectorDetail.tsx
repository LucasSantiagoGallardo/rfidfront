"use client";
import { useEffect, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Grid,
  Paper,
} from "@mui/material";
import api from "@/lib/api";
import { useWebSocket } from "@/lib/ws";

interface Props {
  open: boolean;
  endpoint: string | null;
  onClose: () => void;
}

interface EstadoLector {
  conectado: boolean;
  ultimaConexion?: string;
  tiempoOnline?: string;
  lecturasHoy?: number;
  logs?: string[];
}

export default function LectorDetail({ open, endpoint, onClose }: Props) {
  const [estado, setEstado] = useState<EstadoLector | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar info inicial del lector
  const cargarEstado = async () => {
    if (!endpoint) return;
    setLoading(true);
    try {
      const res = await api.get(`/estado-lectores`);
      const data = res.data[endpoint];
      setEstado({
        conectado: data?.conectado || false,
        tiempoOnline: data?.tiempo_online || "N/A",
        lecturasHoy: data?.lecturas_hoy || 0,
        logs: data?.logs || [],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) cargarEstado();
  }, [open, endpoint]);

  // Escuchar eventos en tiempo real por WebSocket
  useWebSocket((msg) => {
    if (msg.tipo === "estado_lector" && msg.endpoint === endpoint) {
      setEstado((prev) => ({
        ...prev!,
        conectado: msg.conectado,
        tiempoOnline: msg.tiempoOnline,
      }));
    } else if (msg.tipo === "nuevo_evento" && msg.lector === endpoint) {
      setEstado((prev) => ({
        ...prev!,
        lecturasHoy: (prev?.lecturasHoy || 0) + 1,
      }));
    }
  });

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 420, p: 3 }}>
        {loading ? (
          <CircularProgress />
        ) : estado ? (
          <>
            <Typography variant="h6" fontWeight="bold">
              Lector: {endpoint}
            </Typography>
            <Chip
              color={estado.conectado ? "success" : "error"}
              label={estado.conectado ? "Conectado" : "Desconectado"}
              sx={{ mt: 1 }}
            />
            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="subtitle2">Tiempo en línea</Typography>
                  <Typography variant="h6">{estado.tiempoOnline}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="subtitle2">Lecturas hoy</Typography>
                  <Typography variant="h6">{estado.lecturasHoy}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold">
              Historial de Conexiones
            </Typography>

            <List dense>
              {estado.logs && estado.logs.length > 0 ? (
                estado.logs.map((log, i) => (
                  <ListItem key={i}>
                    <ListItemText primary={log} />
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay registros.
                </Typography>
              )}
            </List>
          </>
        ) : (
          <Typography>No se encontró información del lector.</Typography>
        )}
      </Box>
    </Drawer>
  );
}
