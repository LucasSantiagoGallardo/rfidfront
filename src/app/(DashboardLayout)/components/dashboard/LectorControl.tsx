'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Card, CardContent, CardActions, Button, 
  Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, 
  Chip, Tooltip, Alert, CircularProgress 
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';

const API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL;

interface Lector {
  id: number;
  nombre: string;
  ip: string;
  puerto: number;
  endpoint: string; // Crucial para el control
}

interface LectorStatus {
  conectado: boolean;
  ultimo_uid: string | null;
  error: boolean;
  sensor_ir?: 'ocupado' | 'libre';
  rele_estado?: 'encendido' | 'apagado';
}

export default function LectorControl() {
  const [lectores, setLectores] = useState<Lector[]>([]);
  // La clave del estado es el 'endpoint' del lector
  const [estados, setEstados] = useState<{[key: string]: LectorStatus}>({}); 
  const [snackbar, setSnackbar] = useState({open: false, message: '', severity: 'info' as 'success' | 'error' | 'info'});
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'abrir' | 'cerrar' | null>(null);
  const [selectedLector, setSelectedLector] = useState<Lector | null>(null);
  const [actionLoading, setActionLoading] = useState(false);


  // 1. Fetch de Estados (Endpoint corregido)
  const fetchEstados = useCallback(() => {
    if (!API_URL) return;
    // El backend de FastAPI usa /estado-lectores
    fetch(`${API_URL}/estado-lectores`)
      .then(res => res.json())
      .then(data => setEstados(data))
      .catch(error => console.error("Error fetching lector states:", error));
  }, []);

  // 2. Fetch de Lectores e Inicialización
  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/lectores`)
      .then(res => res.json())
      .then(data => setLectores(data))
      .catch(error => console.error("Error fetching lectores:", error));

    const interval = setInterval(fetchEstados, 5000); 
    fetchEstados();
    return () => clearInterval(interval);
  }, [fetchEstados]);

  // 3. Manejo de la acción: Pide confirmación
  const requestAction = (lector: Lector, action: 'abrir' | 'cerrar') => {
    setSelectedAction(action);
    setSelectedLector(lector);
    setDialogOpen(true);
  };
  
  // 4. Ejecución de la acción tras la confirmación (Endpoint y método corregidos)
  const executeAction = async () => {
    if (!selectedLector || !selectedAction) return;
    setDialogOpen(false);
    setActionLoading(true);

    try {
        // Uso del endpoint /barrera-control con Query Params
        const url = `${API_URL}/barrera-control?endpoint=${selectedLector.endpoint}&action=${selectedAction}`; 
        
        // Se usa GET ya que el backend lo espera así
        const res = await fetch(url, { method: 'GET' }); 
        
        if (res.ok) {
            setSnackbar({ open: true, message: `Comando ${selectedAction.toUpperCase()} enviado a ${selectedLector.nombre}.`, severity: 'success' });
        } else {
            setSnackbar({ open: true, message: `Error al ${selectedAction} lector ${selectedLector.nombre}.`, severity: 'error' });
        }
    } catch (error) {
        setSnackbar({ open: true, message: `Error de red al comunicarse con el lector.`, severity: 'error' });
    } finally {
        setActionLoading(false);
        fetchEstados(); 
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedAction(null);
    setSelectedLector(null);
  };

  const renderStatusChip = (status: LectorStatus) => {
    if (!status || status.error) {
        return <Chip label="Error" size="small" color="warning" icon={<WarningAmberIcon />} />;
    }
    if (status.conectado) {
        return <Chip label="Conectado" size="small" color="success" icon={<CheckCircleOutlineIcon />} />;
    }
    
    return <Chip label="Desconectado" size="small" color="error" icon={<HighlightOffIcon />} />;
  };

  return (
    <Box>
      <Typography variant="h6" mb={2}>Control de Lectores</Typography>
      
      {actionLoading && (
        <Alert severity="info" sx={{mb: 2}}>
            <CircularProgress size={16} sx={{mr: 1}} /> Enviando comando...
        </Alert>
      )}

      <Box display="flex" flexWrap="wrap" gap={2}>
        {lectores.map(lector => {
          const status = estados[lector.endpoint] || { conectado: false, ultimo_uid: '---', error: false };
          const isConnected = status.conectado;

          return (
            <Card key={lector.id} sx={{ minWidth: 280, maxWidth: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">{lector.nombre}</Typography>
                    {renderStatusChip(status)}
                </Box>
                <Typography variant="body2" color="text.secondary">Endpoint: {lector.endpoint}</Typography>
                <Typography variant="body2" color="text.secondary">IP: {lector.ip}:{lector.puerto}</Typography>
                <Typography variant="body2" sx={{mt: 1}}>
                  Último Tag: <Typography component="span" fontWeight="bold">{status.ultimo_uid ?? '---'}</Typography>
                </Typography>
                
                {/* Visualización del estado del Relé y Sensor IR */}
                <Box mt={1} display="flex" gap={1}>
                    <Chip 
                        label={`Relé: ${status.rele_estado ?? 'N/A'}`} 
                        size="small" 
                        color={status.rele_estado === 'encendido' ? 'success' : 'default'}
                    />
                    <Chip 
                        label={`IR: ${status.sensor_ir ?? 'N/A'}`} 
                        size="small" 
                        color={status.sensor_ir === 'ocupado' ? 'error' : 'info'}
                    />
                </Box>

              </CardContent>
              
              <CardActions sx={{ borderTop: '1px solid #eee', p: 1 }}>
                <Tooltip title="Abrir acceso temporalmente">
                    <Button 
                        onClick={() => requestAction(lector, 'abrir')} 
                        color="success" 
                        variant="contained" 
                        startIcon={<LockOpenIcon />}
                        disabled={!isConnected || actionLoading}
                    >
                        Abrir
                    </Button>
                </Tooltip>
                <Tooltip title="Cerrar acceso/Bloquear">
                    <Button 
                        onClick={() => requestAction(lector, 'cerrar')} 
                        color="error" 
                        variant="outlined" 
                        startIcon={<LockIcon />}
                        disabled={!isConnected || actionLoading}
                    >
                        Cerrar
                    </Button>
                </Tooltip>
              </CardActions>
            </Card>
          );
        })}
      </Box>

      {/* DIÁLOGO DE CONFIRMACIÓN */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Confirmar Acción Crítica</DialogTitle>
        <DialogContent>
          <Alert severity={selectedAction === 'abrir' ? 'warning' : 'error'} sx={{ mb: 2 }}>
            Está a punto de **{selectedAction?.toUpperCase()}** el lector **{selectedLector?.nombre}**.
          </Alert>
          <Typography>¿Confirma que desea enviar el comando?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary" variant="outlined">
            Cancelar
          </Button>
          <Button 
            onClick={executeAction} 
            color={selectedAction === 'abrir' ? 'success' : 'error'} 
            variant="contained" 
            autoFocus
          >
            {selectedAction === 'abrir' ? 'Confirmar Apertura' : 'Confirmar Cierre'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* SNACKBAR DE NOTIFICACIONES */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({...s, open: false}))}
      >
        <Alert onClose={() => setSnackbar(s => ({...s, open: false}))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}