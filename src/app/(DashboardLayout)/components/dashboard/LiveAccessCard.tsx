'use client';
import React from 'react';
import { Paper, Typography, Box, Avatar } from '@mui/material';
import { useAccessWS } from './WebSocketProvider';

export default function LiveAccessCard() {
  const { lastEvent } = useAccessWS();

  if (!lastEvent)
    return (
      <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Esperando eventos RFID...
        </Typography>
      </Paper>
    );

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor:
          lastEvent.estado?.toLowerCase() === 'permitido'
            ? 'success.light'
            : 'error.light',
      }}
    >
      <Avatar
        src={`data:image/jpeg;base64,${lastEvent.imagen || ''}`}
        sx={{ width: 100, height: 100, mb: 1 }}
      />
      <Typography fontWeight={700}>
        {lastEvent.nombre} {lastEvent.apellido}
      </Typography>
      <Typography variant="body2">{lastEvent.dni}</Typography>
      <Typography variant="body2" color="text.secondary">
        {lastEvent.lector} • {lastEvent.estado}
      </Typography>
      <Typography variant="caption">{lastEvent.fecha}</Typography>
    </Paper>
  );
}
