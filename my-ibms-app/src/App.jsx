import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/auth';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProtocolPage from './pages/ProtocolPage';
import MeasurePointPage from './pages/MeasurePointPage';
import MonitorPage from './pages/MonitorPage';
import WorkOrderPage from './pages/WorkOrderPage';
import AlarmPage from './pages/AlarmPage';
import UserManagePage from './pages/UserManagePage';
import ReportPage from './pages/ReportPage';

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="protocol" element={<ProtocolPage />} />
        <Route path="measure-point" element={<MeasurePointPage />} />
        <Route path="monitor" element={<MonitorPage />} />
        <Route path="work-order" element={<WorkOrderPage />} />
        <Route path="alarm" element={<AlarmPage />} />
        <Route path="users" element={<UserManagePage />} />
        <Route path="reports" element={<ReportPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
