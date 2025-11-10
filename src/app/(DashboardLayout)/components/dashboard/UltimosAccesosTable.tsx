'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface Props {
  data: {
    Event_Date: string;
    Name: string;
    Last_Name: string;
    ID_key: string;
    Type_Mov: string;
    ID_Access_Point: string;
  }[];
}

const UltimosAccesosTable: React.FC<Props> = ({ data }) => {
  const columns: GridColDef[] = [
    { field: 'fecha', headerName: 'Dia', width: 180 },
    { field: 'hora', headerName: 'Hora', width: 180 },
    { field: 'nombre', headerName: 'Nombre', width: 120 },
    { field: 'apellido', headerName: 'Apellido', width: 120 },
    { field: 'llave', headerName: 'Llave', width: 120 },
    {
      field: 'resultado',
      headerName: 'Estado.',
      width: 100,
      renderCell: (params) =>
        params.row.resultado === 'permitido' ? (
          <Box display="flex" alignItems="center" color="green">
            <ArrowUpwardIcon fontSize="small" />
            <Typography ml={0.5}>Permitido</Typography>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" color="red">
            <ArrowDownwardIcon fontSize="small" />
            <Typography ml={0.5}>Denegado</Typography>
          </Box>
        ),
    },
    { field: 'barrera', headerName: 'Barrera', width: 100 },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Últimos Accesos</Typography>
      <Box style={{ height: 800 }}>
        <DataGrid
rows={Array.isArray(data) ? data.map((row, index) => ({ id: index, ...row })) : []}
columns={columns}
          pageSizeOptions={[5]}
          initialState={{
            pagination: { paginationModel: { pageSize: 15, page: 0 } },
          }}
        />
      </Box>
    </Box>
  );
};

export default UltimosAccesosTable;
