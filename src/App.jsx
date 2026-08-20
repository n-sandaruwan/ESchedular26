import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { wipeLegacyEE3304FromCloud } from './data/firebaseSync';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import ModuleTrackerPage from './pages/ModuleTrackerPage';
import ModulePage from './pages/ModulePage';
import TimetablePage from './pages/TimetablePage';
import DailyLogPage from './pages/DailyLogPage';
import AuditLogPage from './pages/AuditLogPage';
import LabTrackerPage from './pages/LabTrackerPage';
import LabAdminPortal from './pages/LabAdminPortal';
import CancelledLecturesPage from './pages/CancelledLecturesPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import './index.css';

function App() {
  useEffect(() => {
    if (!localStorage.getItem('mis_ee3304_cloud_clean_final')) {
      wipeLegacyEE3304FromCloud().then(() => {
        // Also surgically remove from local storage
        try {
          let daily = JSON.parse(localStorage.getItem('mis_daily_logs') || '[]');
          daily = daily.filter(l => l.module !== 'EE3304');
          localStorage.setItem('mis_daily_logs', JSON.stringify(daily));

          let hours = JSON.parse(localStorage.getItem('mis_module_hours') || '[]');
          hours = hours.map(h => h.code === 'EE3304' ? { ...h, conductedHours: 0 } : h);
          localStorage.setItem('mis_module_hours', JSON.stringify(hours));
        } catch (e) {}
        localStorage.setItem('mis_ee3304_cloud_clean_final', 'true');
        setTimeout(() => window.dispatchEvent(new Event('module_hours_updated')), 100);
      });
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout><StudentDashboard /></DashboardLayout>} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<DashboardLayout><StudentDashboard /></DashboardLayout>} />
        <Route path="/timetable" element={<DashboardLayout><TimetablePage /></DashboardLayout>} />
        <Route path="/modules" element={<DashboardLayout><ModuleTrackerPage /></DashboardLayout>} />
        <Route path="/modules/:moduleId" element={<DashboardLayout><ModulePage /></DashboardLayout>} />
        <Route path="/module/:moduleId" element={<DashboardLayout><ModulePage /></DashboardLayout>} />
        <Route path="/lab-tracker" element={<DashboardLayout><LabTrackerPage /></DashboardLayout>} />
        <Route path="/lab-admin-portal" element={<DashboardLayout><LabAdminPortal /></DashboardLayout>} />
        <Route path="/cancellations" element={<DashboardLayout><CancelledLecturesPage /></DashboardLayout>} />
        <Route path="/logs" element={<DashboardLayout><DailyLogPage /></DashboardLayout>} />
        <Route path="/audit" element={<DashboardLayout><AuditLogPage /></DashboardLayout>} />
        
        {/* Protected Admin Portal */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <DashboardLayout><AdminDashboard /></DashboardLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
