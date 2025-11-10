import LectoresCRUD from "@/app/(DashboardLayout)/components/lectores/LectoresCRUD";
import LectorMonitor from "@/app/(DashboardLayout)/components/lectores/LectorMonitor";
import ActividadLecturas from "@/app/(DashboardLayout)/components/lectores/ActividadLecturas";
import { Box, Divider } from "@mui/material";

export default function Page() {
  return (
    <Box sx={{ p: 3 }}>
      <LectorMonitor />
      <Divider sx={{ my: 4 }} />
      <ActividadLecturas />
      <Divider sx={{ my: 4 }} />
      <LectoresCRUD />
    </Box>
  );
}
