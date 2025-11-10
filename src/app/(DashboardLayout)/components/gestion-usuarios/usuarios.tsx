'use client';

import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import IconButton from '@mui/material/IconButton';
import MemoryIcon from '@mui/icons-material/Memory';
import CircularProgress from '@mui/material/CircularProgress';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import BusinessIcon from '@mui/icons-material/Business';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import TagIcon from '@mui/icons-material/Tag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import KeyOffIcon from '@mui/icons-material/KeyOff';
import AddIcon from '@mui/icons-material/PersonAdd';
import { Box, Button, Grid, Modal, TextField, Typography, MenuItem, Select, InputLabel, FormControl, FormControlLabel, Checkbox } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Link from 'next/link';

interface User {
  id: number;
  Dni: string;
  Name: string;
  Last_Name: string;
  Telefono: string;
  Id_Key: string;
  company_name: string;
  Active: string;
  Id_Tag: string;
  tag: string;
  patente?: string;
  Id_Customer?: string;
  isAllowed?: boolean;
}

const API_URL =  "http://localhost:3000/api";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_API_URL || "http://localhost:8003";

export default function UserCRUD() {
  // HOOKS
  const [mounted, setMounted] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [rows, setRows] = useState<User[]>([]);
  const [filteredRows, setFilteredRows] = useState<User[]>([]);
  const [providers, setProviders] = useState<{ id: number; company_name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [open, setOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);
  const previousTagRef = useRef<string>('');
  const [lectores, setLectores] = useState<{ id: number; nombre: string }[]>([]);
  const [lectorSeleccionado, setLectorSeleccionado] = useState<number | null>(null);

  // ============================
  // ======= FETCH DATA =========
  // ============================

  const fetchRows = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, { method: 'GET' });
      const data = await res.json();
      const processed = data.map((row: User) => ({
        ...row,
        id: row.id || row.Dni,
      }));
      setRows(processed);
      setFilteredRows(processed);
    } catch (e) {
      console.error('❌ Error cargando usuarios:', e);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await fetch(`${API_URL}/get-providers`);
      const data = await res.json();
      setProviders(data);
    } catch (e) {
      console.error('❌ Error cargando proveedores:', e);
    }
  };

  const fetchLectores = async () => {
    try {
      const res = await fetch(`${SOCKET_URL}/lectores`);
      const data = await res.json();
      setLectores(data.filter((l: any) => !l.lectura_auto));
      if (data.length > 0 && lectorSeleccionado === null) {
        setLectorSeleccionado(data[0].id);
      }
    } catch (e) {
      console.error('❌ Error cargando lectores:', e);
    }
  };

  // ============================
  // ======= LIFECYCLE ==========
  // ============================

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchRows(), fetchProviders(), fetchLectores()]);
      setMounted(true);
    };
    init();
  }, []);

  if (!mounted)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );

  // ============================
  // ======= HANDLERS ===========
  // ============================

  const handleEdit = (row: User) => {
    previousTagRef.current = row.tag || '';
    setCurrentRow({ ...row, isAllowed: row.Active.toLowerCase() === 'true' });
    setIsEditing(true);
    setOpen(true);
  };

  const handleDelete = async (dni: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario?')) return;
    await fetch(`${API_URL}/delete-user?dni=${dni}`, { method: 'DELETE' });
    fetchRows();
  };

  const handleRevokeTag = async (dni: string, empresa: string, tag: string) => {
    const res = await fetch(`${API_URL}/revoke-tag?dni=${dni}&empresa=${empresa}&tag=${tag}`, { method: 'POST' });
    res.ok
      ? Swal.fire('Éxito', 'Tag revocado correctamente', 'success')
      : Swal.fire('Error', 'No se pudo revocar el tag', 'error');
    fetchRows();
  };

  const handleSave = async () => {
    if (!currentRow.Dni || !currentRow.Name || !currentRow.Last_Name) {
      Swal.fire('Campos incompletos', 'Por favor completá todos los datos.', 'warning');
      return;
    }

    const payload = {
      ...currentRow,
      Active: currentRow.isAllowed ? 'True' : 'False',
    };

    const url = isEditing ? `${API_URL}/update-user` : `${API_URL}/create-user`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      Swal.fire('Éxito', 'Usuario guardado correctamente', 'success');
      await fetchRows();
      setOpen(false);
    } else {
      Swal.fire('Error', 'Error al guardar el usuario', 'error');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = rows.filter((r) =>
      [r.Dni, r.Name, r.Last_Name, r.company_name].some((f) =>
        f?.toLowerCase().includes(value)
      )
    );
    setFilteredRows(filtered);
  };

  const toggleActiveFilter = () => {
    setShowActiveOnly((prev) => !prev);
    setFilteredRows(
      !showActiveOnly
        ? rows.filter((r) => r.Active.toLowerCase() === 'true')
        : rows
    );
  };

  // ============================
  // ======= COLUMNAS ===========
  // ============================

  const columns: GridColDef[] = [
    { field: 'Dni', headerName: 'DNI', flex: 1 },
    { field: 'Name', headerName: 'Nombre', flex: 1 },
    { field: 'Last_Name', headerName: 'Apellido', flex: 1 },
    { field: 'Telefono', headerName: 'Teléfono', flex: 1 },
    { field: 'company_name', headerName: 'Empresa', flex: 1 },
    {field: 'tag', headerName: 'Tag', flex :1 },
    {
      field: 'Active',
      headerName: 'Activo',
      flex: 1,
      renderCell: (params) =>
        params.row.Active.toLowerCase() === 'true' ? (
          <CheckCircleIcon color="success" />
        ) : (
          <CancelIcon color="error" />
        ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      flex: 2,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <IconButton
            color="warning"
            title="Revocar Tag"
            onClick={() =>
              handleRevokeTag(params.row.Dni, params.row.company_name, params.row.tag)
            }
          >
            <KeyOffIcon />
          </IconButton>
          <IconButton
            color="primary"
            title="Editar"
            onClick={() => handleEdit(params.row)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            title="Eliminar"
            onClick={() => handleDelete(params.row.Dni)}
          >
            <DeleteIcon />
          </IconButton>
          <Link href={`/detalles/${params.row.Dni}`} passHref legacyBehavior>
            <IconButton color="success" title="Ver Detalles">
              <LinkIcon />
            </IconButton>
          </Link>
        </Box>
      ),
    },
  ];

  // ============================
  // ========= RENDER ===========
  // ============================

  return (
    <Box>
      <Typography variant="h4" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssignmentIndIcon color="primary" sx={{ fontSize: 34 }} /> Gestión de Usuarios
      </Typography>

      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <TextField
          label="Buscar por DNI, Nombre o Empresa"
          fullWidth
          value={searchTerm}
          onChange={handleSearch}
        />
        <Button
          variant={showActiveOnly ? 'outlined' : 'contained'}
          color="secondary"
          onClick={toggleActiveFilter}
          startIcon={showActiveOnly ? <CancelIcon /> : <CheckCircleIcon />}
        >
          {showActiveOnly ? 'Mostrar Todos' : 'Mostrar Activos'}
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setCurrentRow({ isAllowed: false });
            setIsEditing(false);
            setOpen(true);
          }}
        >
          Agregar Usuario
        </Button>
      </Box>

      <DataGrid
        rows={filteredRows}
        columns={columns}
        paginationModel={{ pageSize: 15, page: 0 }}
        autoHeight
        sx={{
          '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold' },
          '& .MuiDataGrid-cell': { alignItems: 'center' },
        }}
      />

<Modal open={open} onClose={() => setOpen(false)}>
  <Box
    sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      bgcolor: 'background.paper',
      boxShadow: 12,
      p: 4,
      width: { xs: '90%', sm: 480 },
      borderRadius: 3,
      borderTop: isEditing ? '6px solid #0288d1' : '6px solid #1976d2',
    }}
  >
    <Typography
      variant="h6"
      mb={2}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        color: isEditing ? 'info.main' : 'primary.main',
        fontWeight: 600,
      }}
    >
      {isEditing ? (
        <>
          <EditIcon /> Editar usuario
        </>
      ) : (
        <>
          <AddIcon /> Agregar usuario
        </>
      )}
    </Typography>

    <Grid container spacing={2}>
      {/* DNI y Teléfono */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="DNI"
          fullWidth
          value={currentRow.Dni || ''}
          onChange={(e) => setCurrentRow({ ...currentRow, Dni: e.target.value })}
          disabled={isEditing}
          InputProps={{
            startAdornment: <AssignmentIndIcon sx={{ mr: 1, color: 'grey.500' }} fontSize="small" />,
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Teléfono"
          fullWidth
          value={currentRow.Telefono || ''}
          onChange={(e) => setCurrentRow({ ...currentRow, Telefono: e.target.value })}
          InputProps={{
            startAdornment: <PhoneIphoneIcon sx={{ mr: 1, color: 'grey.500' }} fontSize="small" />,
          }}
        />
      </Grid>

      {/* Nombre y Apellido */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Nombre"
          fullWidth
          value={currentRow.Name || ''}
          onChange={(e) => setCurrentRow({ ...currentRow, Name: e.target.value })}
          InputProps={{
            startAdornment: <PersonIcon sx={{ mr: 1, color: 'grey.500' }} fontSize="small" />,
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Apellido"
          fullWidth
          value={currentRow.Last_Name || ''}
          onChange={(e) => setCurrentRow({ ...currentRow, Last_Name: e.target.value })}
          InputProps={{
            startAdornment: <PersonIcon sx={{ mr: 1, color: 'grey.500' }} fontSize="small" />,
          }}
        />
      </Grid>

      {/* TAG + lector + leer */}
      <Grid item xs={12}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            p: 1.2,
            background: '#fafafa',
          }}
        >
          <TextField
            label="Tag"
            value={currentRow.tag || ''}
            onChange={(e) => setCurrentRow({ ...currentRow, tag: e.target.value })}
            disabled={leyendo}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: <TagIcon sx={{ mr: 1, color: 'grey.500' }} fontSize="small" />,
            }}
          />
          <Select
            value={lectorSeleccionado ?? ''}
            onChange={(e) => setLectorSeleccionado(Number(e.target.value))}
            sx={{ flex: 1 }}
            displayEmpty
          >
            <MenuItem value="" disabled>
              Lector
            </MenuItem>
            {lectores.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                {l.nombre}
              </MenuItem>
            ))}
          </Select>
          <IconButton
            color="primary"
            onClick={async () => {
              if (!lectorSeleccionado) {
                Swal.fire('Error', 'Seleccioná un lector primero', 'warning');
                return;
              }
              setLeyendo(true);
              try {
                const res = await fetch(`${SOCKET_URL}/lectores/${lectorSeleccionado}/leer-tag-directo`);
                const data = await res.json();
                if (data && data.tag_decimal) {
                  setCurrentRow((prev) => ({ ...prev, tag: String(data.tag_decimal) }));
                } else {
                  Swal.fire('Sin lectura', 'Aproxime el tag a la antena.', 'info');
                }
              } catch {
                Swal.fire('Error', 'No se pudo leer desde el lector.', 'error');
              }
              setLeyendo(false);
            }}
          >
            {leyendo ? <CircularProgress size={24} /> : <MemoryIcon />}
          </IconButton>
        </Box>
        <Typography variant="caption" sx={{ mt: 0.5, ml: 1, color: 'text.secondary' }}>
          Puede escribirlo manual o leerlo desde el lector.
        </Typography>
      </Grid>

      {/* Empresa */}
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Empresa</InputLabel>
          <Select
            value={currentRow.Id_Customer || ''}
            onChange={(e) =>
              setCurrentRow({
                ...currentRow,
                Id_Customer: e.target.value,
                company_name:
                  providers.find((p) => String(p.id) === String(e.target.value))?.company_name || '',
              })
            }
          >
            {providers.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.company_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Permitido y Patente */}
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={currentRow.isAllowed || false}
              onChange={(e) => setCurrentRow({ ...currentRow, isAllowed: e.target.checked })}
              icon={<CancelIcon />}
              checkedIcon={<CheckCircleIcon />}
            />
          }
          label="Permitido"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Patente"
          fullWidth
          value={currentRow.patente || ''}
          onChange={(e) => setCurrentRow({ ...currentRow, patente: e.target.value })}
          InputProps={{
            startAdornment: <LocalShippingIcon sx={{ mr: 1, color: 'grey.500' }} fontSize="small" />,
          }}
        />
      </Grid>
    </Grid>

    {/* Botones */}
    <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
      <Button
        variant="contained"
        color={isEditing ? 'info' : 'primary'}
        onClick={handleSave}
        startIcon={<CheckCircleIcon />}
        sx={{ px: 3, fontWeight: 600 }}
      >
        {isEditing ? 'Actualizar' : 'Guardar'}
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        startIcon={<CancelIcon />}
        onClick={() => setOpen(false)}
        sx={{ px: 3 }}
      >
        Cancelar
      </Button>
    </Box>
  </Box>
</Modal>




    </Box>
  );
}
