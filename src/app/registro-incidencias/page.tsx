'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Alert,
  TextField, InputAdornment, Button, Divider, FormControlLabel, Switch,
  Autocomplete, CircularProgress, Tooltip, IconButton
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import GroupIcon from '@mui/icons-material/Group';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import KeyIcon from '@mui/icons-material/VpnKey';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://10.10.67.195';

// ===== Tipos =====
type Row = {
  ID: number;
  Dni: string;
  Tag: string;
  Tipo: 'ADECO' | 'P';
  Asignado: 'SI' | 'NO';
  VenceRaw?: string | null;
  VenceCalc?: string | null;   // lo mandamos en SQL como DATETIME -> texto
  Estado: 'ok' | 'vencido';
  Nombre?: string;
  Apellido?: string;
  Id_Customer?: string;
};

type Stats = {
  total: number;   // asignados totales (con tag)
  totala: number;  // asignados ADECO
  totalp: number;  // asignados PROV
  asigc: number;   // vencidos
};

type CustomerOption = { id: string; label: string };

// ===== Constantes =====
const GROUPS = [
  { id: 'ADECO', label: 'Grupo: ADECO' },
  { id: 'PROV', label: 'Grupo: Proveedores' },
];

const DEFAULT_STATS: Stats = { total: 0, totala: 0, totalp: 0, asigc: 0 };

// ===== Utils =====
function safeJSON(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

function exportCSV(rows: Row[], filename = 'tags.csv') {
  const headers = ['ID', 'Dni', 'Tag', 'Tipo', 'Asignado', 'Vence', 'Estado', 'Nombre', 'Apellido', 'Id_Customer'];
  const esc = (v: any) => `"${String(v ?? '').replaceAll('"','""')}"`;
  const lines = rows.map(r => [
    r.ID, r.Dni, r.Tag, r.Tipo, r.Asignado, r.VenceRaw ?? '', r.Estado, r.Nombre ?? '', r.Apellido ?? '', r.Id_Customer ?? ''
  ].map(esc).join(','));
  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function isTodayCordoba22Hint(row: Row) {
  // Si no es ADECO, está asignado y no está vencido => mostrar “Válido hasta hoy 22:00”
  return row.Tipo !== 'ADECO' && row.Asignado === 'SI' && row.Estado !== 'vencido';
}

// ===== Componente =====
export default function DevolucionTagsPage() {
  // Filtros
  const [q, setQ] = useState('');
  const [onlyAssigned, setOnlyAssigned] = useState<boolean>(false);
  const [customerGroup, setCustomerGroup] = useState<'ADECO' | 'PROV' | ''>('');
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<CustomerOption[]>([]);

  // Datos
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [rows, setRows] = useState<Row[]>([]);

  // UI
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Cargar catálogo de empresas (Id_Customer) desde la tabla que ya tenés: lo deducimos de la data
  // Si ya tenés endpoint de customers, podés reemplazar por un fetch a ese endpoint.
  const refreshCustomersFromRows = useCallback((data: Row[]) => {
    const set = new Map<string, CustomerOption>();
    data.forEach(r => {
      const id = (r.Id_Customer ?? '').trim();
      if (id) set.set(id, { id, label: `Empresa #${id}` });
    });
    const list = Array.from(set.values()).sort((a, b) => a.label.localeCompare(b.label));
    setAvailableCustomers(list);
  }, []);

  // Construye query string común para lista y stats
  const buildQuery = () => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (onlyAssigned) p.set('only_assigned', '1');
    if (customerGroup) p.set('customer_group', customerGroup);
    const ids = customers.map(c => c.id).filter(Boolean);
    if (ids.length) p.set('customer', ids.join(','));
    return p.toString();
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const qs = buildQuery();
      const res = await fetch(`${API_URL}/dni_tags_list.php?${qs}`);
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 160)}`);
      const data = safeJSON(text);
      if (!Array.isArray(data)) throw new Error('Respuesta no es JSON de filas');
      setRows(data);
      // Catálogo de empresas (si todavía no hay)
      if (!availableCustomers.length) refreshCustomersFromRows(data);
    } catch (e: any) {
      setErr(`No pude cargar la lista: ${e?.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, onlyAssigned, customerGroup, JSON.stringify(customers)]);

  const fetchStats = useCallback(async () => {
    try {
      const qs = buildQuery();
      const res = await fetch(`${API_URL}/dni_tags_stats.php?${qs}`);
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 160)}`);
      const data = safeJSON(text);
      if (!data) throw new Error('Respuesta no es JSON de stats');
      setStats({
        total: Number(data.total ?? 0),
        totala: Number(data.totala ?? 0),
        totalp: Number(data.totalp ?? 0),
        asigc: Number(data.asigc ?? 0),
      });
    } catch (e: any) {
      // Mostramos en una alerta discreta abajo (no interrumpe)
      setErr(prev => prev ? prev : `No pude cargar estadísticas: ${e?.message || String(e)}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, onlyAssigned, customerGroup, JSON.stringify(customers)]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchRows(), fetchStats()]);
  }, [fetchRows, fetchStats]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const columns: GridColDef[] = useMemo(() => [
    { field: 'ID', headerName: 'ID', width: 90 },
    { field: 'Dni', headerName: 'DNI', width: 130 },
    { field: 'Nombre', headerName: 'Nombre', width: 150 },
    { field: 'Apellido', headerName: 'Apellido', width: 150 },
    { field: 'Tag', headerName: 'Tag', width: 140 },
    { field: 'Tipo', headerName: 'Tipo', width: 110 },
    { field: 'Asignado', headerName: 'Asignado', width: 110 },
    {
      field: 'Vence', headerName: 'Vence', width: 170,
      valueGetter: ({ row }) => row?.VenceRaw || row?.VenceCalc || '',
    },
    {
      field: 'Estado', headerName: 'Estado', width: 120,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          label={row?.Estado === 'vencido' ? 'Vencido' : 'OK'}
          color={row?.Estado === 'vencido' ? 'error' : 'success'}
          variant="filled"
        />
      ),
    },
    {
      field: 'Aviso', headerName: 'Aviso', flex: 1, minWidth: 200, sortable: false,
      renderCell: ({ row }) => isTodayCordoba22Hint(row)
        ? <Typography variant="caption" color="warning.main">Válido hasta hoy 22:00 (no ADECO)</Typography>
        : null
    },
    { field: 'Id_Customer', headerName: 'Empresa', width: 120 },
  ], []);

  const cards = useMemo(() => ([
    {
      title: 'Asignados (total)',
      value: stats.total || 0,
      icon: <GroupIcon fontSize="large" />,
      color: '#4caf50', bg: '#e8f5e9',
    },
    {
      title: 'Asignados ADECO',
      value: stats.totala || 0,
      icon: <LocalOfferIcon fontSize="large" />,
      color: '#2196f3', bg: '#e3f2fd',
    },
    {
      title: 'Asignados Proveedores',
      value: stats.totalp || 0,
      icon: <KeyIcon fontSize="large" />,
      color: '#ff9800', bg: '#fff3e0',
    },
    {
      title: 'Vencidos',
      value: stats.asigc || 0,
      icon: <AssignmentLateIcon fontSize="large" />,
      color: '#f44336', bg: '#ffebee',
    },
  ]), [stats]);

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Gestión de Tags</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Recargar">
            <span>
              <IconButton onClick={() => refreshAll()} disabled={loading}><RefreshIcon /></IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Exportar CSV">
            <span>
              <IconButton onClick={() => exportCSV(rows)} disabled={!rows.length}><DownloadIcon /></IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Filtros */}
      <Card sx={{ mb: 2, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
            <TextField
              size="small"
              label="Buscar (DNI, nombre, tag)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ minWidth: 260 }}
            />

            <FormControlLabel
              control={<Switch checked={onlyAssigned} onChange={(e) => setOnlyAssigned(e.target.checked)} />}
              label="Solo asignados"
            />

            <Autocomplete
              size="small"
              value={customerGroup ? GROUPS.find(g => g.id === customerGroup) ?? null : null}
              onChange={(_, v) => setCustomerGroup((v?.id as any) || '')}
              options={GROUPS}
              getOptionLabel={(o) => o.label}
              renderInput={(params) => <TextField {...params} label="Grupo (opcional)" />}
              sx={{ minWidth: 220 }}
            />

            <Autocomplete
              multiple size="small"
              value={customers}
              onChange={(_, v) => setCustomers(v)}
              options={availableCustomers}
              getOptionLabel={(o) => o.label}
              renderInput={(params) => <TextField {...params} label="Empresas (Id_Customer)" placeholder="Seleccionar..." />}
              sx={{ minWidth: 320 }}
            />

            <Box flexGrow={1} />

            <Stack direction="row" spacing={1}>
              <Button variant="outlined" disabled={loading} onClick={() => refreshAll()}>Aplicar</Button>
              <Button variant="text" disabled={loading} onClick={() => { setQ(''); setOnlyAssigned(false); setCustomerGroup(''); setCustomers([]); }}>
                Limpiar
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 1 }}>
        {cards.map((c, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3, bgcolor: c.bg }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: c.color }}>{c.icon}</Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">{c.title}</Typography>
                    <Typography variant="h5" fontWeight={700}>{c.value}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {err && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      {/* Tabla */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <div style={{ width: '100%' }}>
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
              getRowId={(r) => r.ID}
              disableRowSelectionOnClick
              loading={loading}
              sx={{
                border: 0,
                '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold' },
              }}
              pageSizeOptions={[10, 20, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 20, page: 0 } },
                sorting: { sortModel: [{ field: 'Estado', sort: 'asc' }] },
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        Regla: los tags **no ADECO** caducan el mismo día a las 22:00 (hora Córdoba).
      </Typography>
    </Box>
  );
}
