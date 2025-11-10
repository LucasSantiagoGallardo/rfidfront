'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Modal, Grid, TextField, IconButton, Tooltip, Checkbox, FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import RefreshIcon from '@mui/icons-material/Refresh';
import Swal from 'sweetalert2';

const API_URL = "http://192.168.0.112:8000"; // tu backend FastAPI

interface Lector {
  nombre: string;
  ip: string;
  puerto: number;
  rele_on: string;
  rele_off: string;
  endpoint: string;
  rtsp_url?: string;
  lectura_auto?: boolean;
}

type LectorEstado = {
  conectado?: boolean;
  ultimo_uid?: string;
  error?: boolean;
};

export default function LectoresCRUD() {
  const [lectores, setLectores] = useState<Lector[]>([]);
  const [estados, setEstados] = useState<Record<string, LectorEstado>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lector | null>(null);
  const [form, setForm] = useState<Lector>({
    nombre: '', ip: '', puerto: 0, rele_on: '', rele_off: '', endpoint: '',
    rtsp_url: '', lectura_auto: true
  });
  const [leyendo, setLeyendo] = useState<string | null>(null);

  useEffect(() => {
    fetchLectores();
    fetchEstados();
    const timer = setInterval(fetchEstados, 5000);
    return () => clearInterval(timer);
  }, []);

  const fetchLectores = async () => {
    try {
      const res = await fetch(`${API_URL}/lectores`);
      if (res.ok) {
        setLectores(await res.json());
      }
    } catch {
      Swal.fire('Error', 'No se pudieron cargar los lectores', 'error');
    }
  };

  const fetchEstados = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/estado-lectores`);
      const data = await res.json();
      setEstados(data);
    } catch {
      setEstados({});
    }
    setRefreshing(false);
  };

  const handleOpen = (lector?: Lector) => {
    setEditing(lector ?? null);
    setForm(lector ?? {
      nombre: '', ip: '', puerto: 0, rele_on: '', rele_off: '', endpoint: '',
      rtsp_url: '', lectura_auto: true
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setForm({
      nombre: '', ip: '', puerto: 0, rele_on: '', rele_off: '', endpoint: '',
      rtsp_url: '', lectura_auto: true
    });
  };

  // ✅ CRUD REAL (MySQL persistente)
  const handleSave = async () => {
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing
        ? `${API_URL}/lectores/${form.endpoint}`
        : `${API_URL}/lectores`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        Swal.fire('Éxito', 'Lector guardado correctamente', 'success');
        fetchLectores();
      } else {
        Swal.fire('Error', 'No se pudo guardar el lector', 'error');
      }
    } catch (e) {
      Swal.fire('Error', String(e), 'error');
    } finally {
      handleClose();
    }
  };

  const handleDelete = async (lector: Lector) => {
    const confirm = await Swal.fire({
      title: `¿Eliminar ${lector.nombre}?`,
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}/lectores/${lector.endpoint}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        Swal.fire('Eliminado', 'Lector borrado correctamente', 'success');
        fetchLectores();
      } else {
        Swal.fire('Error', 'No se pudo eliminar el lector', 'error');
      }
    } catch {
      Swal.fire('Error', 'Fallo de conexión al backend', 'error');
    }
  };

  const handleAbrir = async (lector: Lector) => {
    await fetch(`${API_URL}/barrera-control?endpoint=${encodeURIComponent(lector.endpoint)}&action=open`);
    fetchEstados();
  };

  const handleCerrar = async (lector: Lector) => {
    await fetch(`${API_URL}/barrera-control?endpoint=${encodeURIComponent(lector.endpoint)}&action=close`);
    fetchEstados();
  };

  return (
    <Box>
      <Typography variant="h4" mb={2}>Configuración de Lectores</Typography>
      <Button startIcon={<AddIcon />} variant="contained" onClick={() => handleOpen()}>Nuevo Lector</Button>
      <IconButton sx={{ ml: 2 }} onClick={fetchEstados} disabled={refreshing}>
        <RefreshIcon />
      </IconButton>

      <Box mt={2}>
        {lectores.length === 0 && <Typography>No hay lectores configurados.</Typography>}
        {lectores.map(lector => {
          const estado = estados[lector.endpoint] || {};
          return (
            <Box key={lector.endpoint} sx={{
              display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#f5f5f5',
              p: 2, borderRadius: 2, mb: 2, boxShadow: 1,
              transition: 'box-shadow .2s', '&:hover': { boxShadow: 4 }
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">{lector.nombre}</Typography>
                <Typography variant="body2">Endpoint: {lector.endpoint}</Typography>
                <Typography variant="body2">IP: {lector.ip}:{lector.puerto}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Rele On: {lector.rele_on} | Rele Off: {lector.rele_off}
                </Typography>
                {lector.rtsp_url && <Typography variant="body2" color="primary">RTSP: {lector.rtsp_url}</Typography>}
                <Typography variant="body2" color={
                  estado.conectado ? "success.main" : estado.error ? "error.main" : "text.secondary"
                }>
                  Estado:&nbsp;
                  {estado.conectado
                    ? <MeetingRoomOutlinedIcon color="success" fontSize="small" />
                    : estado.error
                      ? "Error"
                      : <span style={{ color: "#888" }}>Desconectado</span>}
                </Typography>
                <Typography variant="body2" color="info.main">
                  Último tag leído: {estado.ultimo_uid || "Ninguno"}
                </Typography>
                <Typography variant="body2">
                  Modo: {lector.lectura_auto ? "Lectura continua" : "Lectura bajo demanda"}
                </Typography>
                {leyendo === lector.endpoint && <CircularProgress size={24} sx={{ ml: 2 }} />}
              </Box>

              <Tooltip title="Abrir barrera">
                <span>
                  <IconButton color="success" onClick={() => handleAbrir(lector)}>
                    <MeetingRoomOutlinedIcon />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Cerrar barrera">
                <span>
                  <IconButton color="primary" onClick={() => handleCerrar(lector)}>
                    <DoorFrontIcon />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Editar">
                <IconButton onClick={() => handleOpen(lector)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Eliminar">
                <IconButton onClick={() => handleDelete(lector)}>
                  <DeleteIcon color="error" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        })}
      </Box>

      {/* Modal ABM */}
      <Modal open={open} onClose={handleClose}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper', p: 4, borderRadius: 3, width: 400, boxShadow: 8
        }}>
          <Typography variant="h6" mb={2}>{editing ? 'Editar Lector' : 'Nuevo Lector'}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField label="Nombre" fullWidth value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField label="Endpoint" fullWidth value={form.endpoint} onChange={e => setForm(f => ({ ...f, endpoint: e.target.value }))} /></Grid>
            <Grid item xs={8}><TextField label="IP" fullWidth value={form.ip} onChange={e => setForm(f => ({ ...f, ip: e.target.value }))} /></Grid>
            <Grid item xs={4}><TextField label="Puerto" fullWidth type="number" value={form.puerto} onChange={e => setForm(f => ({ ...f, puerto: Number(e.target.value) }))} /></Grid>
            <Grid item xs={6}><TextField label="Rele ON (hex)" fullWidth value={form.rele_on} onChange={e => setForm(f => ({ ...f, rele_on: e.target.value }))} /></Grid>
            <Grid item xs={6}><TextField label="Rele OFF (hex)" fullWidth value={form.rele_off} onChange={e => setForm(f => ({ ...f, rele_off: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField label="RTSP URL" fullWidth value={form.rtsp_url} onChange={e => setForm(f => ({ ...f, rtsp_url: e.target.value }))} /></Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox checked={form.lectura_auto ?? true}
                  onChange={e => setForm(f => ({ ...f, lectura_auto: e.target.checked }))} />}
                label="Lectura automática (loop continuo)"
              />
            </Grid>
          </Grid>
          <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="contained" onClick={handleSave}>Guardar</Button>
            <Button variant="outlined" onClick={handleClose}>Cancelar</Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
