import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

import SplashScreen from './components/SplashScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth state changes to maintain session security
    let unsubscribe = () => {};
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
          // If the Firebase session is null, clear any local admin privileges
          const role = localStorage.getItem('mis_role');
          if (role === 'admin' || role === 'lab_admin') {
            localStorage.removeItem('mis_role');
            localStorage.removeItem('mis_user');
            window.location.reload();
          }
        }
      });
    }

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <>
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : (
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
            <Route path="/lab-admin-portal" element={
              <ProtectedRoute allowedRoles={['admin', 'lab_admin']}>
                <DashboardLayout><LabAdminPortal /></DashboardLayout>
              </ProtectedRoute>
            } />
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
      )}
    </>
  );
}

export default App;
