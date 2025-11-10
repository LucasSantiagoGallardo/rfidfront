'use client';

import PageContainer from '../(DashboardLayout)/components/container/PageContainer';
 import Dashboard2 from '../(DashboardLayout)/components/dashboard/app';

const Dashboard = () => {
  return (
    <PageContainer title="Dashboard general" description="Resumen en tiempo real de toda la aplicación">
    <Dashboard2 />
  </PageContainer>
  );
};

export default Dashboard;
