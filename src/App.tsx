import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { AppLayout } from './components/layout/AppLayout';
import { AuthProvider } from './contexts/AuthContext';
import { ServiceRecordsPage } from './pages/ServiceRecordsPage';
import { ServiceRecordFormPage } from './pages/ServiceRecordFormPage';
import { ServiceRecordDetailPage } from './pages/ServiceRecordDetailPage';
import { ReportsPage } from './pages/ReportsPage';
import { AttachmentsPage } from './pages/AttachmentsPage';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="service-records" element={<ServiceRecordsPage />} />
            <Route path="service-records/new" element={<ServiceRecordFormPage />} />
            <Route path="service-records/:id" element={<ServiceRecordDetailPage />} />
            <Route path="service-records/:id/edit" element={<ServiceRecordFormPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="attachments" element={<AttachmentsPage />} />
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;