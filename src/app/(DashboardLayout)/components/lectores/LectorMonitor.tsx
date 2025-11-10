"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useWebSocket } from "@/lib/ws";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Button,
} from "@mui/material";
import LogsTable from "./LogsTable";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import EventTimeline from "./EventTimeline"; // 🕓 timeline de eventos en vivo

interface LectorEstado {
  conectado: boolean;
  tiempo_online: string;
  lecturas_hoy: number;
  logs: string[];
}

export default function LectorMonitor() {
  const [lectores, setLectores] = useState<Record<string, LectorEstado>>({});
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<any>({});

  // === Cargar estado inicial desde backend ===
  const fetchEstado = async () => {
    setLoading(true);
    try {
      const res = await api.get("/estado-lectores/");
      setLectores(res.data);
    } catch (err) {
      console.error("Error cargando estado", err);
    } finally {
      setLoading(false);
    }
  };

  // === Cargar resumen general ===
  const fetchResumen = async () => {
    try {
      const res = await api.get("/estado-lectores/resumen");
      setResumen(res.data);
    } catch (err) {
      console.error("Error cargando resumen", err);
    }
  };

  useEffect(() => {
    fetchEstado();
    fetchResumen();
    const i = setInterval(fetchResumen, 15000);
    return () => clearInterval(i);
  }, []);

  // === Exportar logs CSV ===
  const handleExportLogs = async () => {
    try {
      const desde = dayjs().subtract(7, "day").format("YYYY-MM-DD");
      const hasta = dayjs().format("YYYY-MM-DD");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/export/logs?desde=${desde}&hasta=${hasta}`
      );
      const blob = await res.blob();
      saveAs(blob, `logs_${desde}_to_${hasta}.csv`);
    } catch (err) {
      console.error("Error exportando logs", err);
    }
  };

  // === WebSocket: manejar eventos en tiempo real ===
  useWebSocket((msg) => {
    console.log("📡 Mensaje WS recibido:", msg);

    // 🔹 Estado de conexión / desconexión
    if (msg.tipo === "estado_lector") {
      setLectores((prev) => {
        const actualizado = {
          ...prev,
          [msg.endpoint]: {
            ...(prev[msg.endpoint] || {
              tiempo_online: "0s",
              lecturas_hoy: 0,
              logs: [],
            }),
            conectado: msg.conectado,
          },
        };
        return actualizado;
      });

      // 🔄 sincroniza desde backend si un lector se conecta
      if (msg.conectado) fetchEstado();
    }

    // 🔹 Nueva lectura RFID
    else if (msg.tipo === "nuevo_evento") {
      setLectores((prev) => {
        const actual = prev[msg.lector] || {
          conectado: true,
          tiempo_online: "0s",
          lecturas_hoy: 0,
          logs: [],
        };
        const nuevoLog = `${new Date().toLocaleTimeString()} — ${
          msg.estado === "permitido"
            ? "✅ Lectura permitida"
            : "⛔ Lectura denegada"
        } UID ${msg.uid}`;
        return {
          ...prev,
          [msg.lector]: {
            ...actual,
            lecturas_hoy: actual.lecturas_hoy + 1,
            logs: [...(actual.logs || []), nuevoLog].slice(-20),
          },
        };
      });
    }
  });

  // === UI ===
  if (loading) return <CircularProgress />;

  const lectorKeys = Object.keys(lectores);
  if (lectorKeys.length === 0)
    return <Typography variant="body2">No hay lectores activos.</Typography>;

  return (
    <Box sx={{ p: 4 }}>
      {/* === Cabecera === */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" fontWeight="bold">
          Monitoreo de Lectores RFID
        </Typography>
        <Button
          startIcon={<FileDownloadIcon />}
          variant="outlined"
          onClick={handleExportLogs}
        >
          Exportar Logs CSV
        </Button>
      </Box>

      {/* === Resumen general === */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Chip
            label={`Lectores: ${resumen.total_lectores || 0}`}
            color="default"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <Chip
            label={`Conectados: ${resumen.conectados || 0}`}
            color="success"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <Chip
            label={`Desconectados: ${resumen.desconectados || 0}`}
            color="error"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <Chip
            label={`Lecturas hoy: ${resumen.total_lecturas_hoy || 0}`}
            color="info"
          />
        </Grid>
      </Grid>

      {/* === Tarjetas de lectores === */}
      <Grid container spacing={3}>
        {lectorKeys.map((key) => {
          const l = lectores[key];
          return (
            <Grid item xs={12} md={6} lg={4} key={key}>
              <Card sx={{ boxShadow: 3 }}>
                <CardHeader
                  title={key}
                  action={
                    <Chip
                      label={l.conectado ? "Conectado" : "Desconectado"}
                      color={l.conectado ? "success" : "error"}
                    />
                  }
                />
                <Divider />
                <CardContent>
                  <Typography variant="body2" gutterBottom>
                    🕒 Uptime: {l.tiempo_online}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    📖 Lecturas hoy: {l.lecturas_hoy}
                  </Typography>

                  <Typography variant="subtitle2" mt={2}>
                    Últimos eventos:
                  </Typography>
                  <LogsTable
                    logs={(l.logs || []).map((txt) => ({
                      mensaje: txt,
                      tipo_evento: txt.includes("Conectado")
                        ? "conexion"
                        : txt.includes("Desconectado")
                        ? "desconexion"
                        : txt.includes("Error")
                        ? "error"
                        : "lectura",
                    }))}
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* === Timeline en tiempo real === */}
      <Divider sx={{ my: 4 }} />
      <EventTimeline />
    </Box>
  );
}
