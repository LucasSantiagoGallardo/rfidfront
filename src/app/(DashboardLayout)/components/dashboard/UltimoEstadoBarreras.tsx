'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
  Button,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface EstadoLector {
  id: number;
  nombre: string;
  ip: string;
  port: number;
  conectado?: boolean;
  ultimo_uid?: string;
  hora?: string;
}

const API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL;

const UltimoEstadoBarreras: React.FC = () => {
  const [barriers, setBarriers] = useState<EstadoLector[]>([]);
  const [estados, setEstados] = useState<{ [key: number]: any }>({});

  useEffect(() => {
    fetch(`${API_URL}/lectores`)
      .then(res => res.json())
      .then(data => setBarriers(data));

    fetchEstados();
    const interval = setInterval(fetchEstados, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchEstados = () => {
    fetch(`${API_URL}/lectores/estados`)
      .then(res => res.json())
      .then(data => setEstados(data));
  };

  const handleAction = async (lectorId: number, action: 'abrir' | 'cerrar') => {
    const res = await fetch(`${API_URL}/lectores/${lectorId}/${action}`, {
      method: 'POST'
    });
    fetchEstados();
  };

  return (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Estado de Últimas Lecturas por Barrera</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Barrera</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Último UID</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Última Hora</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {barriers.map(barrier => {
                const estado = estados[barrier.id] || {};
                return (
                  <TableRow key={barrier.id}>
                    <TableCell>{barrier.nombre}</TableCell>
                    <TableCell>{barrier.ip}:{barrier.port}</TableCell>
                    <TableCell>{estado.ultimo_uid || '---'}</TableCell>
                    <TableCell>
                      <Chip
                        label={estado.conectado ? 'Conectado' : 'Desconectado'}
                        color={estado.conectado ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{estado.hora || '---'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleAction(barrier.id, 'abrir')}
                        >
                          Abrir
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => handleAction(barrier.id, 'cerrar')}
                        >
                          Cerrar
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );
};

export default UltimoEstadoBarreras;
