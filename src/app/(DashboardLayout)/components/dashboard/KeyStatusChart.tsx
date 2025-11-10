// src/app/(DashboardLayout)/components/dashboard/KeyStatusChart.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PHP_API_BASE_URL = process.env.NEXT_PUBLIC_PHP_API_URL; 
const API_ENDPOINT = `${PHP_API_BASE_URL}/get-key-status.php`;

interface KeyStatus {
  name: string;
  value: number;
}

const KeyStatusChart: React.FC<{ data: KeyStatus[] }> = ({ data }) => {
  const colors = ['#82ca9d', '#ff7979']; 

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" mb={2}>Estado de Llaves</Typography>
        <Box sx={{ height: 250, width: '100%' }}>
            {data.length > 0 && data.reduce((sum, item) => sum + item.value, 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={data} 
                            cx="50%" 
                            cy="50%" 
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80} 
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={colors[index % colors.length]} 
                                />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="textSecondary">Cargando o sin datos.</Typography>
                </Box>
            )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Contenedor con lógica de fetching
const KeyStatusChartContainer: React.FC = () => {
  const [data, setData] = useState<KeyStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        if (!PHP_API_BASE_URL) return;
        setLoading(true);
        try {
            const response = await fetch(API_ENDPOINT);
            if (!response.ok) { throw new Error(`Error HTTP: ${response.status}`); }
            const result: KeyStatus[] = await response.json();
            setData(result);
        } catch (error) {
            console.error("Error fetching key status:", error);
            setData([]); 
        } finally {
            setLoading(false);
        }
    };

    fetchData(); 
    const intervalId = setInterval(fetchData, 60000); 
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
        <Card><CardContent><Typography variant="h6" mb={2}>Estado de Llaves</Typography>
        <Box display="flex" justifyContent="center" alignItems="center" height={250}>
            <CircularProgress />
        </Box></CardContent></Card>
    );
  }

  return <KeyStatusChart data={data} />;
};

export default KeyStatusChartContainer;