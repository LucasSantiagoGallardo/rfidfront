"use client";
import { useEffect, useState } from "react";
import { Box, Button, Grid, MenuItem, TextField, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import dayjs from "dayjs";
import api from "@/lib/api";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { saveAs } from "file-saver";

interface LecturaHora {
  hora: string;
  cantidad: number;
  lector: string;
}

export default function ActividadLecturas() {
  const [datos, setDatos] = useState<LecturaHora[]>([]);
  const [lectores, setLectores] = useState<string[]>([]);
  const [filtros, setFiltros] = useState({
    lector: "",
    desde: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
    hasta: dayjs().format("YYYY-MM-DD"),
  });

  const cargarLectores = async () => {
    const res = await api.get("/lectores/");
    setLectores(res.data.map((l: any) => l.endpoint));
  };

  const cargarDatos = async () => {
    const { lector, desde, hasta } = filtros;
    const res = await api.get("/lecturas/por-hora", { params: { lector, desde, hasta } });
    setDatos(res.data);
  };

  const exportarCSV = async () => {
    const { lector, desde, hasta } = filtros;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/export/logs?endpoint=${lector}&desde=${desde}&hasta=${hasta}`);
    const blob = await res.blob();
    saveAs(blob, `logs_${lector || "todos"}_${desde}_a_${hasta}.csv`);
  };

  useEffect(() => {
    cargarLectores();
    cargarDatos();
  }, []);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>📊 Actividad de Lecturas RFID</Typography>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={3}>
          <TextField
            select fullWidth label="Lector"
            value={filtros.lector}
            onChange={(e) => setFiltros({ ...filtros, lector: e.target.value })}
          >
            <MenuItem value="">Todos</MenuItem>
            {lectores.map((l) => (
              <MenuItem key={l} value={l}>{l}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Desde"
            type="date"
            value={filtros.desde}
            fullWidth
            onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Hasta"
            type="date"
            value={filtros.hasta}
            fullWidth
            onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <Button variant="contained" onClick={cargarDatos}>Aplicar filtros</Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportarCSV}
            sx={{ ml: 1 }}
          >
            Exportar CSV
          </Button>
        </Grid>
      </Grid>

      <BarChart
        xAxis={[{ dataKey: "hora", label: "Hora", scaleType: "band" }]}
        series={[{ dataKey: "cantidad", label: "Lecturas", color: "#2196f3" }]}
        dataset={datos}
        width={800}
        height={400}
      />
    </Box>
  );
}
