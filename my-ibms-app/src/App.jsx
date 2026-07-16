import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import HomePage from './pages/HomePage';
import ProtocolPage from './pages/ProtocolPage';
import MeasurePointPage from './pages/MeasurePointPage';
import MonitorPage from './pages/MonitorPage';
import WorkOrderPage from './pages/WorkOrderPage';
import AlarmPage from './pages/AlarmPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="protocol" element={<ProtocolPage />} />
          <Route path="measure-point" element={<MeasurePointPage />} />
          <Route path="monitor" element={<MonitorPage />} />
          <Route path="work-order" element={<WorkOrderPage />} />
          <Route path="alarm" element={<AlarmPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
