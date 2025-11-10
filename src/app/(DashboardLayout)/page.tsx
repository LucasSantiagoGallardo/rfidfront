'use client';
import React, { useMemo, useState, useCallback } from 'react';
import { 
  Box, Grid, Paper, Typography, 
  Snackbar, Alert, Button, Avatar, Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material';

import BuscadorGlobal from './components/dashboard/BuscadorGlobal'; 
import LectorControl from './components/dashboard/LectorControl'; 
import KeyStatusChart from './components/dashboard/KeyStatusChart'; 
import AccessDashboardCore from './components/dashboard/AccessDashboardCore'; 
import DashboardLayout from './components/dashboard/DashboardLayout';
// Tipado de Registro
interface Registro {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  lector: string;
  estado: 'PERMITIDO' | 'DENEGADO' | 'ERROR';
  fecha: string;
  imagen_base64?: string;
}

/**
 * Página principal del Dashboard.
 */
export default function DashboardPage() {
  // Estados de Filtro
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [barrera, setBarrera] = useState('');
  const [dni, setDni] = useState('');
  
  // Estado de Notificación (movido al padre)
  const [noti, setNoti] = useState({
      open: false,
      mensaje: '',
      tipo: 'info' as 'success' | 'error' | 'info',
      data: null as Registro | null,
      foto: null as string | null,
  });
  const [modalData, setModalData] = useState<Registro | null>(null);

  // Callback para manejar el evento del WebSocket
  const handleNewRealTimeEvent = useCallback((newEvent: Registro) => {
    const isPermitido = newEvent.estado === 'PERMITIDO';
    
    setNoti({
        open: true,
        mensaje: `${newEvent.nombre} ${newEvent.apellido} - ${newEvent.estado}`,
        tipo: isPermitido ? 'success' : 'error',
        data: newEvent,
        foto: newEvent.imagen_base64 || null,
    });
  }, []);

  const filters = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (estado) p.set('estado', estado);
    if (dateFrom) p.set('date_from', dateFrom);
    if (dateTo) p.set('date_to', dateTo);
    if (barrera) p.set('barrera', barrera);
    if (dni) p.set('dni', dni);
    return p;
  }, [q, estado, dateFrom, dateTo, barrera, dni]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Panel de Control ADECO Profesional
      </Typography>
   <DashboardLayout />

      {/* 1. FILTROS Y BÚSQUEDA */}
      <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
        <Typography variant="h6" mb={2}>Filtros de Registros</Typography>
        <BuscadorGlobal
          q={q} onQ={setQ}
          estado={estado} onEstado={setEstado}
          dateFrom={dateFrom} onDateFrom={setDateFrom}
          dateTo={dateTo} onDateTo={setDateTo}
          barrera={barrera} onBarrera={setBarrera}
          dni={dni} onDni={setDni}
        />
      </Paper>

      <Grid container spacing={3}>
        {/* 2. CONTROL Y KPIS */}
        <Grid item xs={12} lg={4}>
            <LectorControl /> 
            <Box mt={3}>
                <KeyStatusChart />
            </Box>
        </Grid>

        {/* 3. LIVE FEED Y ANALÍTICAS */}
        <Grid item xs={12} lg={8}>
          <AccessDashboardCore 
            filters={filters} 
            onNewRealTimeEvent={handleNewRealTimeEvent} // Pasando el callback
          />
        </Grid>
      </Grid>

      {/* --- SNACKBAR DE NOTIFICACIÓN EN TIEMPO REAL (En el padre) --- */}
      <Snackbar
          open={noti.open}
          autoHideDuration={6000}
          onClose={() => setNoti(s => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
          <Alert
              onClose={() => setNoti(s => ({ ...s, open: false }))}
              severity={noti.tipo}
              variant="filled"
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
              action={noti.data ? (
                  <Button color="inherit" size="small" onClick={() => {
                      setNoti(s => ({ ...s, open: false }));
                      setModalData(noti.data); // Abrir Modal
                  }}>
                      Ver detalle
                  </Button>
              ) : undefined}
          >
              {noti.foto && <Avatar src={`data:image/jpeg;base64,${noti.foto}`} sx={{ width: 40, height: 40, border: '2px solid white' }} />}
              {noti.mensaje || "Nuevo Acceso"}
          </Alert>
      </Snackbar>

      {/* --- MODAL DETALLE DE ACCESO (En el padre) --- */}
      <Dialog open={!!modalData} onClose={() => setModalData(null)} maxWidth="sm" fullWidth>
          {modalData && (
              <>
                  <DialogTitle>{modalData.nombre} {modalData.apellido}</DialogTitle>
                  <DialogContent>
                      {modalData.imagen_base64 && (
                          <Box display="flex" justifyContent="center" mb={2}>
                              <img src={`data:image/jpeg;base64,${modalData.imagen_base64}`} alt="Captura" style={{ width: '100%', borderRadius: 8 }} />
                          </Box>
                      )}
                      <Typography><b>DNI:</b> {modalData.dni}</Typography>
                      <Typography><b>Lector:</b> {modalData.lector}</Typography>
                      <Typography><b>Estado:</b> {modalData.estado}</Typography>
                      <Typography><b>Fecha:</b> {modalData.fecha}</Typography>
                  </DialogContent>
                  <DialogActions>
                      <Button onClick={() => setModalData(null)}>Cerrar</Button>
                  </DialogActions>
              </>
          )}
      </Dialog>
    </Box>
  );
}