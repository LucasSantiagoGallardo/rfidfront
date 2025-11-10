'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box, Grid, Typography, Card, CardContent, Chip, Stack, TextField, InputAdornment,
  Button, IconButton, Tooltip, Alert, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import KeyIcon from '@mui/icons-material/VpnKey';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import EventBusyIcon from '@mui/icons-material/EventBusy';

const API_URL = process.env.NEXT_PUBLIC_API_URL2 ?? 'http://10.10.67.195';
// Endpoint de lista con fecha de asignación (JOIN con asig)
const LIST_ENDPOINT = `${API_URL}/dni_list_asig.php`;

// Tipos
interface Row {
  ID: number;
  Dni: string;
  Tag: string;
  Tipo: 'ADECO' | 'P' | string;
  Asignado: 'SI' | 'NO';
  Vence?: string | null;
  Estado: 'ok' | 'vencido' | string;
  Nombre?: string;
  Apellido?: string;
  // NUEVO: fecha de asignación que devuelve el PHP como "YYYY-MM-DD HH:mm:ss[.ffffff]"
  fecha_asignacion?: string | null;
}
interface Stats {
  total: number;
  totala: number;
  totalp: number;
  asigc: number;
}

// Helper para formatear la fecha del backend
const formatFecha = (isoish: string | null | undefined) => {
  if (!isoish) return '-';
  const cleaned = isoish.replace(' ', 'T').split('.')[0]; // quita microsegundos si existen
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return isoish;
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};



const columns: GridColDef<any>[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'dni', headerName: 'DNI', width: 140 },
  { field: 'tag', headerName: 'Tag', width: 140 },
  { field: 'tipo', headerName: 'Tipo', width: 110 },
  {
    field: 'asignado', headerName: 'Asignado', width: 110,
    renderCell: ({ value }) => (
      <Chip size="small" label={value === 'SI' ? 'SI' : 'SI'} color={value === 'SI' ? 'success' : 'default'} />
    ),
  },
  {
    field: 'fecha_asignacion',
    headerName: 'Asignado el',
    minWidth: 190,
    flex: 1,
    // MUI X v6
    valueGetter: (_value, row) => row?.fecha_asignacion ?? null,
    valueFormatter: (value) => formatFecha(value as string | null),
    sortComparator: (v1, v2) => {
      const toTs = (v: string | null) => {
        if (!v) return 0;
        const cleaned = v.replace(' ', 'T').split('.')[0];
        const t = new Date(cleaned).getTime();
        return isNaN(t) ? 0 : t;
      };
      return toTs(v1 as string | null) - toTs(v2 as string | null);
    },
  },
  {
    field: 'estado', headerName: 'Estado', width: 120,
    renderCell: ({ value }) =>
      value === 'vencido'
        ? <Chip size="small" label="Vencido" color="error" />
        : <Chip size="small" label="OK" color="success" variant="outlined" />,
  },
  { field: 'vence', headerName: 'Vence', width: 120 },
  { field: 'name', headerName: 'Nombre', width: 140 },
  { field: 'last_name', headerName: 'Apellido', width: 140 },
];




export default function TagsDevolucion() {
  const [rows, setRows] = useState<Row[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, totala: 0, totalp: 0, asigc: 0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');
  const [q, setQ] = useState('');
  const [onlyAssigned, setOnlyAssigned] = useState(false);
  const [selection, setSelection] = useState<GridRowSelectionModel>([]);

  // Diálogo Reasignar
  const [openAssign, setOpenAssign] = useState(false);
  const [assignDni, setAssignDni] = useState('');
  const [assignTag, setAssignTag] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/dni_tags_stats.php`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Stats;
      setStats(data);
    } catch (e: any) {
      setErr(`Error cargando KPIs: ${e.message || e}`);
    }
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const params = new URLSearchParams();
      // si tu nuevo PHP todavía NO soporta filtros, no pasa nada si quedan vacíos.
      if (q.trim()) params.set('q', q.trim());
      if (onlyAssigned) params.set('only_assigned', '1');

      const url = params.toString()
        ? `${LIST_ENDPOINT}?${params.toString()}`
        : LIST_ENDPOINT;

      const res = await fetch(url);
      const text = await res.text();
      let data: any[] = [];
      try {
        data = JSON.parse(text);
        console.log(data)
      } catch {
        throw new Error('Respuesta inválida del servidor');
      }
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(`Error cargando tags: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  }, [q, onlyAssigned]);

  useEffect(() => {
    fetchStats();
    fetchRows();
  }, [fetchStats, fetchRows]);

  const filtered = useMemo(() => rows, [rows]);

  const doAction = async (action: 'devolver' | 'liberar' | 'vencer') => {
    if (!selection.length) return;
    try {
      const res = await fetch(`${API_URL}/dni_tags_action.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: selection }),
      });
      const j = await res.json();
      if (!res.ok || j.ok === false) throw new Error(j.message || 'Error en acción');
      await Promise.all([fetchStats(), fetchRows()]);
      setSelection([]);
    } catch (e: any) {
      setErr(`Acción fallida: ${e.message || e}`);
    }
  };

  const openAssignDialog = () => {
    const selRow = rows.find(r => r.ID === selection[0]);
    setAssignDni(selRow?.Dni || '');
    setAssignTag(selRow?.Tag || '');
    setOpenAssign(true);
  };

  const confirmAssign = async () => {
    if (!assignDni.trim() || !assignTag.trim()) {
      setErr('Ingresá DNI destino y TAG');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/dni_tags_assign.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: assignDni.trim(), tag: assignTag.trim() }),
      });
      const j = await res.json();
      if (!res.ok || j.ok === false) throw new Error(j.message || 'Error al asignar');
      setOpenAssign(false);
      setAssignDni(''); setAssignTag('');
      await Promise.all([fetchStats(), fetchRows()]);
      setSelection([]);
    } catch (e: any) {
      setErr(`No se pudo asignar: ${e.message || e}`);
    }
  };

  const kpiCards = [
    { title: 'Total Tags', value: stats.total, icon: <GroupIcon />, color: '#e8f5e9' },
    { title: 'Asignados ADECO', value: stats.totala, icon: <LocalOfferIcon />, color: '#e3f2fd' },
    { title: 'Asignados P', value: stats.totalp, icon: <KeyIcon />, color: '#fff8e1' },
    { title: 'Vencidos', value: stats.asigc, icon: <AssignmentIcon />, color: '#ffebee' },
  ];

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6" fontWeight={700}>Gestión de Tags (tabla: dni)</Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <TextField
            size="small" placeholder="Buscar DNI, nombre, tag…"
            value={q} onChange={(e) => setQ(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
          <Chip
            label={onlyAssigned ? 'Sólo asignados' : 'Todos'}
            color={onlyAssigned ? 'primary' : 'default'}
            onClick={() => setOnlyAssigned(v => !v)}
            variant={onlyAssigned ? 'filled' : 'outlined'}
          />
          <Tooltip title="Recargar">
            <IconButton onClick={() => { fetchStats(); fetchRows(); }}>
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {kpiCards.map((c) => (
          <Grid item xs={12} sm={6} md={3} key={c.title}>
            <Card sx={{ backgroundColor: c.color, borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  {c.icon}
                  <Box>
                    <Typography variant="overline">{c.title}</Typography>
                    <Typography variant="h5" fontWeight={700}>{c.value}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <div style={{ width: '100%' }}>
            <DataGrid<Row>
              loading={loading}
              rows={filtered}
              columns={columns}
              checkboxSelection
              onRowSelectionModelChange={(m) => setSelection(m)}
              rowSelectionModel={selection}
              getRowId={(r:any) => r.id ?? r.ID}
              autoHeight
              sx={{
                border: 0,
                '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold' },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { page: 0, pageSize: 25 } },
                sorting: { sortModel: [{ field: 'fecha_asignacion', sort: 'desc' }] },
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button
          variant="outlined" color="warning" startIcon={<LogoutIcon />}
          disabled={!selection.length}
          onClick={() => doAction('devolver')}
        >
          Devolver (liberar tag)
        </Button>

        <Button
          variant="outlined" color="error" startIcon={<EventBusyIcon />}
          disabled={!selection.length}
          onClick={() => doAction('vencer')}
        >
          Marcar vencido
        </Button>

        <Button
          variant="contained" startIcon={<SwapHorizIcon />}
          disabled={!selection.length}
          onClick={openAssignDialog}
        >
          Reasignar…
        </Button>
      </Stack>

      {/* Diálogo Reasignar */}
      <Dialog open={openAssign} onClose={() => setOpenAssign(false)} fullWidth maxWidth="xs">
        <DialogTitle>Reasignar Tag</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="DNI destino"
              value={assignDni}
              onChange={(e) => setAssignDni(e.target.value)}
              autoFocus
            />
            <TextField
              label="TAG a asignar"
              value={assignTag}
              onChange={(e) => setAssignTag(e.target.value)}
              helperText="Si el tag ya está en otro usuario, se liberará y se asignará a este DNI."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssign(false)}>Cancelar</Button>
          <Button variant="contained" onClick={confirmAssign}>Asignar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
