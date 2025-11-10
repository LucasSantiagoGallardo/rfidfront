'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppBar, Toolbar, Box, Typography, Grid, Divider, CircularProgress, Paper,
  IconButton, Tooltip, TextField, Switch, FormControlLabel, Alert, Button, Chip,
  Stack, InputAdornment, List, ListItem, ListItemText, Select, MenuItem
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SecurityIcon from '@mui/icons-material/Security';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip,
  CartesianGrid, AreaChart, Area, XAxis, YAxis, Legend
} from 'recharts';
import BarrieControl from './barrieControl';
import Registros from './registros';

import { Snackbar, Alert as MuiAlert } from '@mui/material';

const API_URL = 'http://192.168.0.112:8000';
const WS_URL = 'ws://192.168.0.112:8000/ws/accesos'; // WebSocket backend

// Sonidos
const SOUND_OK = '/sounds/ok.mp3';
const SOUND_DENIED = '/sounds/denied.mp3';

type RawRegistro = {
  id?: number | string;
  fecha?: string;
  hora?: string;
  nombre?: string;
  apellido?: string;
  dni?: string | number;
  llave?: string;
  barrera?: string;
  resultado?: string | boolean | number | null;
};

type Estado = '' | 'permitido' | 'denegado' | 'desconocido';
type KPI = { label: string; value: string | number; };

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
const maskDni = (d?: string | number) => !d ? '—' : String(d).replace(/(\d{3})\d+(\d{2})$/, '$1***$2');
const toNum = (v: any) => Number.isFinite(Number(v)) ? Number(v) : 0;

function normalizarResultado(v: RawRegistro['resultado']): 'permitido' | 'denegado' | 'desconocido' {
  const s = String(v ?? '').trim().toLowerCase();
  if (['permitido','ok','true','1','allowed','success','aprobado'].includes(s)) return 'permitido';
  if (['denegado','false','0','rejected','fail','denied','rechazado','error'].includes(s)) return 'denegado';
  return 'desconocido';
}

function EstadoBadge({ value }: { value: RawRegistro['resultado'] }) {
  const res = normalizarResultado(value);
  const color = res === 'permitido' ? 'success.main' : res === 'denegado' ? 'error.main' : 'warning.main';
  const Icon = res === 'permitido' ? CheckCircleIcon : res === 'denegado' ? CancelIcon : HelpOutlineIcon;
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color }}>
      <Icon fontSize="small" />
      <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{res}</Typography>
    </Stack>
  );
}

export default function App() {
  const [registros, setRegistros] = useState<RawRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
// Estados de WebSocket
const [socket, setSocket] = useState<WebSocket | null>(null);
const [noti, setNoti] = useState<{ mensaje: string; tipo: 'success' | 'error'; } | null>(null);
const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/accesos`);
      const data = await res.json();
      const rows = data.map((r: any) => ({
        id: r.id,
        fecha: r.fecha?.split(' ')[0],
        hora: r.fecha?.split(' ')[1],
        nombre: r.nombre,
        apellido: r.apellido,
        dni: r.dni,
        llave: r.epc,
        barrera: r.lector,
        resultado: r.estado,
      }));
      setRegistros(rows);
    } catch (e: any) {
      setError(e?.message);
    } finally {
      setLoading(false);
    }
  }, []);
useEffect(() => {
  // 🔌 conectar al WebSocket del backend
  const ws = new WebSocket("ws://192.168.0.112:8000/ws/accesos");

  ws.onopen = () => console.log("📡 WebSocket conectado");
  ws.onclose = () => console.log("❌ WebSocket cerrado");
  ws.onerror = (e) => console.error("⚠️ Error WS:", e);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.tipo === "nuevo_evento") {
        console.log("🔔 Evento recibido:", data);

        // reproducir sonido distinto según estado
        if (audioRef.current) {
          if (data.estado === "permitido") {
            audioRef.current.src = "/sounds/ok.mp3";
          } else {
            audioRef.current.src = "/sounds/denied.mp3";
          }
          audioRef.current.play().catch(() => {});
        }

        // mostrar notificación visual
        setNoti({
          mensaje: `${data.nombre ?? ''} ${data.apellido ?? ''} - ${data.estado.toUpperCase()}`,
          tipo: data.estado === "permitido" ? "success" : "error",
        });

        // (opcional) refrescar tabla automáticamente
        fetchData().catch(() => {});
      }
    } catch (err) {
      console.error("❌ Error parseando mensaje WS:", err);
    }
  };

  setSocket(ws);
  return () => ws.close();
}, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 🎧 Notificaciones Push + Sonido en tiempo real
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    const audioOK = new Audio(SOUND_OK);
    const audioDenied = new Audio(SOUND_DENIED);

    ws.onopen = () => console.log("🟢 WS conectado");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.tipo === "nuevo_evento") {
        const nombre = `${data.nombre ?? ''} ${data.apellido ?? ''}`.trim() || '—';
        const estado = data.estado?.toLowerCase();

        // Sonido
        if (estado === 'permitido') audioOK.play();
        else audioDenied.play();

        // Notificación push
        if (Notification.permission === 'granted') {
          new Notification(`Acceso ${estado}`, {
            body: `${nombre} (${data.dni || 'sin DNI'}) - ${data.lector}`,
            icon: estado === 'permitido' ? '/icons/success.png' : '/icons/error.png',
          });
        }

        // Refrescar tabla
        fetchData();
      }
    };

    ws.onclose = () => console.log("🔴 WS desconectado");
    if (Notification.permission !== 'granted') Notification.requestPermission();

    return () => ws.close();
  }, [fetchData]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: (t) => t.palette.grey[50] }}>
      <AppBar color="default" position="sticky">
        <Toolbar><SecurityIcon /><Typography ml={1}>Dashboard de Accesos</Typography></Toolbar>
      </AppBar>
      <Box p={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? <CircularProgress /> : (
          <DataGrid
            rows={registros}
            columns={[
              { field: 'fecha', headerName: 'Fecha', width: 140 },
              { field: 'hora', headerName: 'Hora', width: 100 },
              { field: 'nombre', headerName: 'Nombre', width: 140 },
              { field: 'apellido', headerName: 'Apellido', width: 140 },
              { field: 'dni', headerName: 'DNI', width: 120 },
              { field: 'barrera', headerName: 'Barrera', width: 150 },
              {
                field: 'resultado',
                headerName: 'Estado',
                width: 120,
                renderCell: (params) => <EstadoBadge value={params.row.resultado} />
              }
            ]}
            autoHeight
            pageSizeOptions={[10, 20, 40]}
            sx={{ border: 0, mt: 2 }}
          />
        )}
      </Box>
    </Box>
  );
}
