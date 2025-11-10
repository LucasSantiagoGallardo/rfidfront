'use client';
import React from 'react';
import { Box, Grid, Typography, Paper } from '@mui/material';
import HeaderKPIs from './HeaderKPIs';
import LiveAccessCard from './LiveAccessCard';
import AccessChart from './AccessChart';
import AccessTable from './AccessTable';
import BarrieControl from './BarrieControl';
import SystemStatus from './SystemStatus';
import { WebSocketProvider } from './WebSocketProvider';

export default function DashboardLayout() {
  return (
    <WebSocketProvider>
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'grey.50', minHeight: '100vh' }}>
        <Typography variant="h4" fontWeight={700} mb={3}>
          Panel de Control ADECO
        </Typography>

        {/* KPIs + Último acceso */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <HeaderKPIs />
          </Grid>
          <Grid item xs={12} md={4}>
            <LiveAccessCard />
          </Grid>
        </Grid>

        {/* Gráfico + Estado del sistema */}
        <Grid container spacing={3} mt={1}>
          <Grid item xs={12} md={8}>
            <AccessChart />
          </Grid>
          <Grid item xs={12} md={4}>
            <SystemStatus />
          </Grid>
        </Grid>

        {/* Tabla + Control manual */}
        <Grid container spacing={3} mt={1}>
          <Grid item xs={12} md={8}>
            <AccessTable />
          </Grid>
          <Grid item xs={12} md={4}>
            <BarrieControl />
          </Grid>
        </Grid>
      </Box>
    </WebSocketProvider>
  );
}
