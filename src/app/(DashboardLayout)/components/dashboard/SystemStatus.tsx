'use client';
import React, { useEffect, useState } from 'react';
import { Paper, Typography, Chip, Stack, CircularProgress } from '@mui/material';

const API_URL = 'http://192.168.0.112:8000';

export default function SystemStatus() {
  const [status, setStatus] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/estado-lectores`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Error estado lectores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 10000);
    return () => clearInterval(timer);
  }, []);

  if (loading)
    return (
      <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
        <CircularProgress size={24} />
      </Paper>
    );

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Typography variant="h6" mb={1} fontWeight={600}>
        Estado de Lectores
      </Typography>
      {Object.entries(status).map(([endpoint, data]) => (
        <Stack
          key={endpoint}
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Typography>{endpoint}</Typography>
          <Chip
            label={data.conectado ? 'Conectado' : 'Desconectado'}
            color={data.conectado ? 'success' : 'error'}
            size="small"
          />
        </Stack>
      ))}
    </Paper>
  );
}
