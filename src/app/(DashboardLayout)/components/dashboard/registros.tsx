'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Modal,
  Paper,
  Avatar,
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface Registro {
  id?: number;
  epc?: string;
  uid?: string;
  lector?: string;
  estado?: string;
  dni?: string;
  nombre?: string;
  apellido?: string;
  fecha?: string;
  imagen?: string | null;
}

export default function Registros() {
  const [rows, setRows] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const API_URL = 'http://192.168.0.112:8000';

  // 🔹 Cargar registros iniciales
  useEffect(() => {
    fetch(`${API_URL}/accesos`)
      .then((res) => res.json())
      .then((data) => setRows(data))
      .catch((err) => console.error('❌ Error cargando accesos:', err))
      .finally(() => setLoading(false));
  }, []);

  // 🔹 WebSocket: escuchar accesos en tiempo real
  useEffect(() => {
    const ws = new WebSocket('ws://192.168.0.112:8000/ws/accesos');

    ws.onmessage = (event) => {
      const nuevo = JSON.parse(event.data);
      console.log('📡 Nuevo acceso recibido:', nuevo);

      // Insertar nuevo registro arriba
      setRows((prev) => [nuevo, ...prev.slice(0, 99)]);

      // Feedback visual tipo toast
      const toast = document.createElement('div');
      toast.textContent = `${nuevo.nombre || 'Usuario'} ${nuevo.estado}`;
      Object.assign(toast.style, {
        position: 'fixed',
        top: '10px',
        right: '10px',
        background:
          nuevo.estado === 'permitido' ? '#4caf50' : '#f44336',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '8px',
        fontWeight: 'bold',
        zIndex: 9999,
        opacity: 0.9,
        transition: 'opacity 0.3s ease',
      });
      document.body.appendChild(toast);
      setTimeout(() => (toast.style.opacity = '0'), 2500);
      setTimeout(() => toast.remove(), 3000);
    };

    ws.onclose = () => console.log('🔴 WebSocket cerrado');
    return () => ws.close();
  }, []);

  // 🔹 Imagen modal
  const handleImageClick = (img: string | null) => {
    if (img) {
      setSelectedImage(`data:image/jpeg;base64,${img}`);
      setModalOpen(true);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'imagen',
      headerName: 'Foto',
      width: 90,
      sortable: false,
      renderCell: (params) =>
        params.row.imagen ? (
          <Avatar
            src={`data:image/jpeg;base64,${params.row.imagen}`}
            alt="captura"
            sx={{
              width: 56,
              height: 56,
              border: '2px solid #ccc',
              cursor: 'pointer',
              transition: '0.2s',
              '&:hover': { transform: 'scale(1.1)' },
            }}
            onClick={() => handleImageClick(params.row.imagen)}
          />
        ) : (
          <Typography variant="caption" color="text.secondary">
            —
          </Typography>
        ),
    },
    {
      field: 'nombre',
      headerName: 'Nombre',
      width: 160,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>
          {params.row.nombre} {params.row.apellido}
        </Typography>
      ),
    },
    { field: 'dni', headerName: 'DNI', width: 120 },
    { field: 'lector', headerName: 'Lector', width: 140 },
    {
      field: 'fecha',
      headerName: 'Fecha / Hora',
      width: 170,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.fecha?.replace('T', ' ') ?? '—'}
        </Typography>
      ),
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 130,
      renderCell: (params) => {
        const estadoLower = params.row.estado?.toLowerCase() || '';
        const color =
          estadoLower === 'permitido'
            ? 'success'
            : estadoLower === 'denegado'
            ? 'error'
            : 'default';
        return (
          <Chip
            label={params.row.estado?.toUpperCase() || '—'}
            color={color}
            size="small"
            sx={{
              fontWeight: 'bold',
              bgcolor:
                estadoLower === 'permitido'
                  ? 'rgba(76,175,80,0.1)'
                  : estadoLower === 'denegado'
                  ? 'rgba(244,67,54,0.1)'
                  : undefined,
            }}
          />
        );
      },
    },
  ];

  return (
    <Paper
      elevation={3}
      sx={{ p: 2, borderRadius: 2, mt: 2, minHeight: 400 }}
    >
      <Typography variant="h6" fontWeight={700} mb={2}>
        📋 Registros recientes
      </Typography>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={(r) => r.id || Math.random()}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell': { alignItems: 'center' },
            '& .MuiDataGrid-row': {
              transition: '0.3s',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
            },
            '& .MuiDataGrid-row--permitido': {
              backgroundColor: 'rgba(76,175,80,0.1)',
            },
            '& .MuiDataGrid-row--denegado': {
              backgroundColor: 'rgba(244,67,54,0.1)',
            },
          }}
          getRowClassName={(params) => {
            const estado = params.row.estado?.toLowerCase();
            return estado === 'permitido'
              ? 'MuiDataGrid-row--permitido'
              : estado === 'denegado'
              ? 'MuiDataGrid-row--denegado'
              : '';
          }}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: { sortModel: [{ field: 'fecha', sort: 'desc' }] },
          }}
        />
      </Box>

      {/* Modal imagen ampliada */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 2,
            boxShadow: 24,
            outline: 'none',
          }}
        >
          {selectedImage && (
            <img
              src={selectedImage}
              alt="ampliada"
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                borderRadius: '10px',
              }}
            />
          )}
        </Box>
      </Modal>
    </Paper>
  );
}
