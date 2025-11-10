"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Add, Edit, Delete } from "@mui/icons-material";
import api from "@/lib/api";
import LectorDetail from "./LectorDetail";


interface Lector {
  nombre: string;
  ip: string;
  puerto: number;
  endpoint: string;
  rele_on: string;
  rele_off: string;
  rtsp_url?: string;
  lectura_auto?: boolean;
}

export default function LectoresCRUD() {
  const [lectores, setLectores] = useState<Lector[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editando, setEditando] = useState<Lector | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; type: "success" | "error" }>({
    open: false,
    message: "",
    type: "success",
  });
const [selected, setSelected] = useState<string | null>(null);

  const cargarLectores = async () => {
    setLoading(true);
    try {
      const res = await api.get("/lectores");
      setLectores(res.data);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Error al cargar lectores", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarLectores();
  }, []);

  const handleSave = async () => {
    try {
      if (editando && lectores.some((l) => l.endpoint === editando.endpoint)) {
        await api.put(`/lectores/${editando.endpoint}`, editando);
        setSnack({ open: true, message: "Lector actualizado", type: "success" });
      } else if (editando) {
        await api.post("/lectores", editando);
        setSnack({ open: true, message: "Lector creado", type: "success" });
      }
      setOpenDialog(false);
      setEditando(null);
      cargarLectores();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Error al guardar lector", type: "error" });
    }
  };

  const handleDelete = async (endpoint: string) => {
    if (!confirm("¿Seguro que deseas eliminar este lector?")) return;
    try {
      await api.delete(`/lectores/${endpoint}`);
      setSnack({ open: true, message: "Lector eliminado", type: "success" });
      cargarLectores();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Error al eliminar lector", type: "error" });
    }
  };

  const columns: GridColDef[] = [
    { field: "nombre", headerName: "Nombre", flex: 1 },
    { field: "ip", headerName: "IP", flex: 1 },
    { field: "puerto", headerName: "Puerto", flex: 0.6 },
    { field: "endpoint", headerName: "Endpoint", flex: 1 },
    {
      field: "acciones",
      headerName: "Acciones",
      flex: 0.8,
      renderCell: (params) => (
        <>
          <IconButton color="primary" onClick={() => { setEditando(params.row); setOpenDialog(true); }}>
            <Edit />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.endpoint)}>
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Gestión de Lectores RFID
      </Typography>

      <Button
        variant="contained"
        startIcon={<Add />}
        sx={{ mb: 2 }}
        onClick={() => {
          setEditando({
            nombre: "",
            ip: "",
            puerto: 0,
            endpoint: "",
            rele_on: "",
            rele_off: "",
            rtsp_url: "",
            lectura_auto: true,
          });
          setOpenDialog(true);
        }}
      >
        Agregar Lector
      </Button>

      <div style={{ height: 300, width: "100%" }}>
        <DataGrid
          rows={lectores.map((l, i) => ({ id: i, ...l }))}
          columns={columns}
          pageSizeOptions={[5, 10]}
          loading={loading}
          disableRowSelectionOnClick
        />
        <LectorDetail
  open={Boolean(selected)}
  endpoint={selected}
  onClose={() => setSelected(null)}
/>
      </div>

      {/* Dialogo Crear/Editar */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editando && lectores.some((l) => l.endpoint === editando.endpoint) ? "Editar Lector" : "Nuevo Lector"}</DialogTitle>
        <DialogContent>
          {editando && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <TextField
                label="Nombre"
                value={editando.nombre}
                onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                fullWidth
              />
              <TextField
                label="IP"
                value={editando.ip}
                onChange={(e) => setEditando({ ...editando, ip: e.target.value })}
                fullWidth
              />
              <TextField
                label="Puerto"
                type="number"
                value={editando.puerto}
                onChange={(e) => setEditando({ ...editando, puerto: Number(e.target.value) })}
                fullWidth
              />
              <TextField
                label="Endpoint"
                value={editando.endpoint}
                onChange={(e) => setEditando({ ...editando, endpoint: e.target.value })}
                fullWidth
              />
              <TextField
                label="Comando Rele ON"
                value={editando.rele_on}
                onChange={(e) => setEditando({ ...editando, rele_on: e.target.value })}
                fullWidth
              />
              <TextField
                label="Comando Rele OFF"
                value={editando.rele_off}
                onChange={(e) => setEditando({ ...editando, rele_off: e.target.value })}
                fullWidth
              />
              <TextField
                label="RTSP URL"
                value={editando.rtsp_url || ""}
                onChange={(e) => setEditando({ ...editando, rtsp_url: e.target.value })}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de notificaciones */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.type} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
