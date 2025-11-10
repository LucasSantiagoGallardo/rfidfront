'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Modal,
  Typography,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 900,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

interface Persona {
  id: number;
  Id_Key: string;
  Dni: string;
  Name: string;
  Last_Name: string;
  Provider?: string;
}
// ✅ Uso de la variable de entorno estandarizada
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL; 

export default function BuscadorGlobal() {
  const [open, setOpen] = useState(false);
  const [termino, setTermino] = useState('');
  const [resultados, setResultados] = useState<Persona[]>([]);

  const buscar = async () => {
    if (!termino) return;
    if (!FASTAPI_URL) {
        alert("Error de configuración: FASTAPI_URL no está definido.");
        return;
    }
    
    try {
      // ✅ Migración a endpoint FastAPI (asumido: /usuarios/buscar)
      const url = `${FASTAPI_URL}/usuarios/buscar`; 

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Enviando el término en el cuerpo JSON
        body: JSON.stringify({ termino: termino }),
      });

      if (!res.ok) {
        throw new Error(`Error en la búsqueda: ${res.statusText}`);
      }

      const data: Persona[] = await res.json();
      setResultados(data);
      setOpen(true);
    } catch (error) {
      console.error('Error al buscar:', error);
      alert('Error al realizar la búsqueda. Revise la consola.');
    }
  };

  const columnas: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'Id_Key', headerName: 'ID Key', width: 120 },
    { field: 'Dni', headerName: 'DNI', width: 120 },
    { field: 'Name', headerName: 'Nombre', width: 150 },
    { field: 'Last_Name', headerName: 'Apellido', width: 150 },
    { field: 'Provider', headerName: 'Proveedor', width: 150 },
    {
      field: 'Acciones',
      headerName: 'Acciones',
      width: 150,
      renderCell: (params) => (
        <>
          <Tooltip title="Editar">
            <IconButton size="small"><EditIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small"><DeleteIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Detalles">
            <IconButton size="small"><InfoIcon /></IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <Box mb={2}>
      <Box display="flex" gap={1} mb={2}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por DNI, nombre, apellido, proveedor o ID Key"
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
        />
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={buscar}
        >
          Buscar
        </Button>
      </Box>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={style}>
          <Typography variant="h6" mb={2}>Resultados de búsqueda</Typography>
          <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={resultados}
              columns={columnas}
              pageSizeOptions={[5, 10]}
              initialState={{
                pagination: { paginationModel: { pageSize: 5, page: 0 } },
              }}
            />
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}