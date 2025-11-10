// src/app/(DashboardLayout)/components/dashboard/AccessDashboardCore.tsx
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, Typography, Grid, CircularProgress, Paper, Divider, 
  FormControlLabel, Switch
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// URLs desde .env.local
const PHP_API_BASE_URL = process.env.NEXT_PUBLIC_PHP_API_URL;
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
const API_ENDPOINT = `${PHP_API_BASE_URL}/get-accesses.php`;

interface Registro {
  id: number;
  dni: string; 
  nombre: string;
  apellido: string;
  lector: string;
  estado: 'PERMITIDO' | 'DENEGADO' | 'ERROR';
  fecha: string; 
  imagen_base64?: string;
  // Añadir epc si viene de la tabla lecturas
  epc?: string; 
}

interface Kpis {
    total: number;
    permitidos: number;
    denegados: number;
    porcentajePermitidos: number;
}

interface AccessDashboardCoreProps {
    filters: URLSearchParams;
    onNewRealTimeEvent: (event: Registro) => void; 
}

// Función helper para enmascarar DNI
const maskDni = (dni: string | undefined) => {
    return dni && dni.length > 3 ? dni.substring(0, 3) + '***' : dni || 'N/A';
}


export default function AccessDashboardCore({ filters, onNewRealTimeEvent }: AccessDashboardCoreProps) {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<Kpis>({ total: 0, permitidos: 0, denegados: 0, porcentajePermitidos: 0 });
  const [maskPII, setMaskPII] = useState(() => localStorage.getItem('maskPII') === 'true');
  
  // Persistir estado de máscara
  useEffect(() => { localStorage.setItem('maskPII', String(maskPII)); }, [maskPII]);

  // A. Fetching de Datos Históricos (usando el nuevo endpoint PHP)
  const fetchData = useCallback(async () => {
    if (!PHP_API_BASE_URL) return;
    setLoading(true);
    // Añade los filtros al endpoint PHP
    const url = `${API_ENDPOINT}?${filters.toString()}`;
    
    try {
      const res = await fetch(url);
      const data: Registro[] = await res.json();
      
      // La DataGrid requiere que cada fila tenga un ID único
      const dataWithId = data.map(r => ({...r, id: r.id || (Math.random() * 10000000)}));

      setRegistros(dataWithId); 
      setLoading(false);
    } catch (error) {
      console.error('Error fetching historical data from PHP:', error);
      setLoading(false);
    }
  }, [filters]);

  // B. Conexión WebSocket (usa el endpoint del servicio en Python/FastAPI)
  useEffect(() => {
    if (!WEBSOCKET_URL) return;

    // Aseguramos que la URL sea un WS o WSS
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onmessage = (event) => {
      try {
          const data = JSON.parse(event.data);
          // Asumiendo que el payload de WS tiene el formato del Registro
          const newEvent: Registro = data.payload || data; 
          
          if (!newEvent.id) {
              newEvent.id = Date.now(); // Asegura un ID para la tabla
          }

          // 1. Integrar inmediatamente en la tabla (LIVE FEED)
          setRegistros(prevRegistros => {
            // Limitar la tabla para evitar problemas de memoria en el navegador
            return [newEvent, ...prevRegistros.slice(0, 999)];
          });

          // 2. Disparar el callback para que el padre muestre el Snackbar
          onNewRealTimeEvent(newEvent); 
      } catch (e) {
          console.error("Error procesando mensaje WebSocket:", e);
      }
    };

    ws.onclose = () => { console.log("WebSocket desconectado. Intentando reconectar en 5s..."); setTimeout(() => { /* Reconnect logic */ }, 5000); };
    ws.onerror = (error) => { console.error("WebSocket Error:", error); };

    return () => ws.close();
  }, [onNewRealTimeEvent]);


  // C. Cálculo de KPIs
  useEffect(() => {
    const total = registros.length;
    const permitidos = registros.filter(r => r.estado === 'PERMITIDO').length;
    const denegados = total - permitidos;
    const porcentajePermitidos = total > 0 ? (permitidos / total) * 100 : 0;
    setKpis({ total, permitidos, denegados, porcentajePermitidos });
  }, [registros]);
  
  // D. Inicialización: Recargar datos históricos cuando cambian los filtros
  useEffect(() => { fetchData(); }, [fetchData]);


  // Definición de columnas de la tabla (FIX aplicado aquí)
  const columns: GridColDef[] = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'fecha', headerName: 'Fecha y Hora', width: 180 }, 
    { 
        field: 'dni', 
        headerName: 'DNI', 
        width: 150, 
        // ✅ FIX: Control de seguridad usando optional chaining (?.)
        valueGetter: (params) => {
            const dniValue = params.row?.dni; 
            return maskPII ? maskDni(dniValue) : dniValue;
        }
    },
    { field: 'nombre', headerName: 'Nombre', width: 150 },
    { field: 'apellido', headerName: 'Apellido', width: 150 },
    { field: 'lector', headerName: 'Lector', width: 120 },
    { 
        field: 'estado', 
        headerName: 'Estado', 
        width: 120,
        renderCell: (params) => (
            <Typography color={params.value === 'PERMITIDO' ? 'success.main' : 'error.main'} fontWeight="bold">
                {params.value}
            </Typography>
        )
    },
    { field: 'epc', headerName: 'EPC/Key ID', width: 200 },
  ], [maskPII]);


  const dataPie = [
    { name: 'Permitidos', value: kpis.permitidos },
    { name: 'Denegados', value: kpis.denegados },
  ];
  const COLORS = ['#00C49F', '#FF8042'];

  return (
    <Box>
      {/* Indicador de carga */}
      {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}
      
      {/* KPIs DE ACCESO */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" color="primary">{kpis.total}</Typography>
            <Typography variant="subtitle1" color="textSecondary">Total Registros</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" color="success.main">{kpis.permitidos}</Typography>
            <Typography variant="subtitle1" color="textSecondary">Permitidos</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" color="error.main">{kpis.denegados}</Typography>
            <Typography variant="subtitle1" color="textSecondary">Denegados</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Grid container spacing={2}>
        {/* GRÁFICO DE ESTADO Y OPCIONES */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" mb={2}>Resumen de Estado</Typography>
            <Box sx={{ height: 200, mb: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dataPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                    {dataPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Divider sx={{ my: 2 }} />
            <FormControlLabel
              control={<Switch checked={maskPII} onChange={(e) => setMaskPII(e.target.checked)} />}
              label="Enmascarar datos personales (DNI)"
            />
          </Paper>
        </Grid>

        {/* TABLA UNIFICADA DE REGISTROS (LIVE FEED) */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, height: 600 }}>
            <Typography variant="h6" mb={2}>Feed de Accesos en Vivo ({registros.length} registros)</Typography>
            <Box sx={{ height: 500, width: '100%' }}>
              <DataGrid
                rows={registros}
                columns={columns}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                loading={loading}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}