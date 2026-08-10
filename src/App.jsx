import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import ModuleTrackerPage from './pages/ModuleTrackerPage';
import ModulePage from './pages/ModulePage';
import TimetablePage from './pages/TimetablePage';
import DailyLogPage from './pages/DailyLogPage';
import AuditLogPage from './pages/AuditLogPage';
import LabTrackerPage from './pages/LabTrackerPage';
import CancelledLecturesPage from './pages/CancelledLecturesPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Dashboard Routes wrapped in layout */}
        <Route path="/" element={<DashboardLayout><StudentDashboard /></DashboardLayout>} />
        <Route path="/timetable" element={<DashboardLayout><TimetablePage /></DashboardLayout>} />
        <Route path="/modules" element={<DashboardLayout><ModuleTrackerPage /></DashboardLayout>} />
        <Route path="/modules/:moduleId" element={<DashboardLayout><ModulePage /></DashboardLayout>} />
        <Route path="/module/:moduleId" element={<DashboardLayout><ModulePage /></DashboardLayout>} />
        <Route path="/lab-tracker" element={<DashboardLayout><LabTrackerPage /></DashboardLayout>} />
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
  </ErrorBoundary>
  );
}

export default App;
