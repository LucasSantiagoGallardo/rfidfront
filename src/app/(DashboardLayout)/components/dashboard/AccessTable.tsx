'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Dialog, DialogContent, Avatar, CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

const API_URL = 'http://192.168.0.112:8000';

export default function AccessTable() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openImg, setOpenImg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/accesos`);
      const data = await res.json();
      setRows(data);
    } catch (err) {
      console.error('Error obteniendo accesos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 15000);
    return () => clearInterval(timer);
  }, []);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'fecha', headerName: 'Fecha', width: 150 },
    { field: 'nombre', headerName: 'Nombre', width: 160 },
    { field: 'apellido', headerName: 'Apellido', width: 160 },
    { field: 'dni', headerName: 'DNI', width: 120 },
    { field: 'lector', headerName: 'Lector', width: 120 },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 130,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color:
              params.value?.toLowerCase() === 'permitido'
                ? 'success.main'
                : 'error.main',
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'imagen',
      headerName: 'Foto',
      width: 100,
      renderCell: (params) =>
        params.value ? (
          <Avatar
            src={`data:image/jpeg;base64,${params.value}`}
            sx={{
              width: 40,
              height: 40,
              cursor: 'pointer',
              border: '2px solid #ddd',
            }}
            onClick={() => setOpenImg(params.value)}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        ),
    },
  ];

  return (
    <Paper elevation={1} sx={{ p: 2, height: 400 }}>
      <Typography variant="h6" mb={1} fontWeight={600}>
        Últimos accesos
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r.id}
          autoHeight
          pageSizeOptions={[10, 20]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
          }}
          density="compact"
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': { fontWeight: 700 },
          }}
        />
      )}

      <Dialog open={!!openImg} onClose={() => setOpenImg(null)}>
        <DialogContent>
          <img
            src={`data:image/jpeg;base64,${openImg}`}
            alt="captura"
            style={{ width: '100%', borderRadius: 8 }}
          />
        </DialogContent>
      </Dialog>
    </Paper>
  );
}
