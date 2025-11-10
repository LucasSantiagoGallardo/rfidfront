'use client';
import React, { useState } from 'react';
import {
  Paper, Typography, Button, Stack, CircularProgress, Snackbar, Alert,
} from '@mui/material';

const API_URL = 'http://192.168.0.112:8000';

export default function BarrieControl() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const sendCommand = async (action: 'open' | 'close') => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/barrera-control?endpoint=casa&action=${action}`);
      const data = await res.json();
      setMsg({
        text: data.mensaje || 'Acción ejecutada',
        type: data.status === 'ok' ? 'success' : 'error',
      });
    } catch (err) {
      setMsg({ text: 'Error al conectar con el servidor', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Typography variant="h6" mb={1} fontWeight={600}>
        Control manual de barrera
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          color="success"
          onClick={() => sendCommand('open')}
          disabled={loading}
        >
          Abrir
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => sendCommand('close')}
          disabled={loading}
        >
          Cerrar
        </Button>
        {loading && <CircularProgress size={24} />}
      </Stack>

      <Snackbar
        open={!!msg}
        autoHideDuration={4000}
        onClose={() => setMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setMsg(null)}
          severity={msg?.type}
          sx={{ width: '100%' }}
        >
          {msg?.text}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
