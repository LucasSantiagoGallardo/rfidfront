'use client';
import React, { useEffect, useState } from 'react';
import { Paper, Typography } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

const API_URL = 'http://192.168.0.112:8000';

export default function AccessChart() {
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/accesos`);
      const rows = await res.json();
      const hours = Array.from({ length: 24 }, (_, i) => ({
        hora: `${String(i).padStart(2, '0')}:00`,
        permitido: 0,
        denegado: 0,
      }));
      rows.forEach((r: any) => {
        const h = new Date(r.fecha).getHours();
        if (r.estado === 'permitido') hours[h].permitido++;
        else if (r.estado === 'denegado') hours[h].denegado++;
      });
      setData(hours);
    } catch (err) {
      console.error('Error gráfico:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 20000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Typography variant="h6" mb={1} fontWeight={600}>
        Actividad por hora
      </Typography>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hora" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="permitido" fill="#2e7d32" name="Permitidos" />
          <Bar dataKey="denegado" fill="#c62828" name="Denegados" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
