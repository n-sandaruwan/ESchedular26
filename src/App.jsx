import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import ModulePage from './pages/ModulePage';
import TimetablePage from './pages/TimetablePage';
import DailyLogPage from './pages/DailyLogPage';
import StudentLookupPage from './pages/StudentLookupPage';
import AuditLogPage from './pages/AuditLogPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Dashboard Routes wrapped in layout */}
        <Route path="/" element={<DashboardLayout><StudentDashboard /></DashboardLayout>} />
        <Route path="/timetable" element={<DashboardLayout><TimetablePage /></DashboardLayout>} />
        <Route path="/logs" element={<DashboardLayout><DailyLogPage /></DashboardLayout>} />
        <Route path="/student-lookup" element={<DashboardLayout><StudentLookupPage /></DashboardLayout>} />
        <Route path="/audit" element={<DashboardLayout><AuditLogPage /></DashboardLayout>} />
        <Route path="/modules/:moduleId" element={<DashboardLayout><ModulePage /></DashboardLayout>} />
        
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
