'use client';
import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography } from '@mui/material';

const API_URL = 'http://192.168.0.112:8000';

export default function HeaderKPIs() {
  const [stats, setStats] = useState({ total: 0, permitidos: 0, denegados: 0 });

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/accesos`);
      const data = await res.json();
      const permitidos = data.filter((x: any) => x.estado === 'permitido').length;
      const denegados = data.filter((x: any) => x.estado === 'denegado').length;
      setStats({ total: data.length, permitidos, denegados });
    } catch (err) {
      console.error('Error KPIs:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Grid container spacing={2}>
      {[
        { label: 'Total Accesos', value: stats.total },
        { label: 'Permitidos', value: stats.permitidos },
        { label: 'Denegados', value: stats.denegados },
      ].map((kpi) => (
        <Grid item xs={12} sm={4} key={kpi.label}>
          <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="overline" color="text.secondary">
              {kpi.label}
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {kpi.value}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
