import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { api } from './api/client';

import { DashboardPage } from './pages/DashboardPage';
import { VarietiesPage } from './pages/VarietiesPage';
import { DiseasePage } from './pages/DiseasePage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ObservationsPage } from './pages/ObservationsPage';
import { FarmersPage } from './pages/FarmersPage';
import { AdvisoryPage } from './pages/AdvisoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { LoginPage } from './pages/LoginPage';
import { DiseaseReportDetailPage } from './pages/DiseaseReportDetailPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        color: 'var(--text-main)',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--brand-emerald)',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading AgriBioTech Security Gateway...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user.role || '').toLowerCase();
  const normalizedAllowed = allowedRoles?.map(r => r.toLowerCase());

  if (normalizedAllowed && !normalizedAllowed.includes(userRole)) {
    // Record security event
    api.security.logAccessAttempt({
      attemptedResource: location.pathname,
      targetRole: allowedRoles?.join(', '),
      requestedRoute: location.pathname,
      outcome: 'denied',
      details: `User ${user.name} (${user.role}) denied access to route ${location.pathname}. Required roles: [${allowedRoles?.join(', ')}]`,
    }).catch(err => {
      console.error('Failed to log client-side access denial:', err);
    });

    const properDashboard = userRole === 'admin' ? '/dashboard/admin'
      : userRole === 'agronomist' ? '/dashboard/agronomist'
      : userRole === 'biotech_expert' ? '/dashboard/biotech'
      : '/dashboard/farmer';

    return (
      <Navigate
        to={properDashboard}
        replace
        state={{
          accessDenied: true,
          attempted: location.pathname,
          targetRole: allowedRoles?.join(', '),
        }}
      />
    );
  }

  return <>{children}</>;
};

const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user?.role || '').toLowerCase();

  const dest = userRole === 'admin' ? '/dashboard/admin'
    : userRole === 'agronomist' ? '/dashboard/agronomist'
    : userRole === 'biotech_expert' ? '/dashboard/biotech'
    : '/dashboard/farmer';

  return <Navigate to={dest} replace />;
};

const PublicLoginRoute: React.FC = () => {
  return <LoginPage />;
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-container">
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Navbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar isOpen={sidebarOpen} />
          <main className="main-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicLoginRoute />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MainLayout>
                    <DashboardPage role="admin" />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/agronomist"
              element={
                <ProtectedRoute allowedRoles={['agronomist']}>
                  <MainLayout>
                    <DashboardPage role="agronomist" />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/biotech"
              element={
                <ProtectedRoute allowedRoles={['biotech_expert']}>
                  <MainLayout>
                    <DashboardPage role="biotech_expert" />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/farmer"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <MainLayout>
                    <DashboardPage role="farmer" />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/varieties"
              element={
                <ProtectedRoute allowedRoles={['admin', 'agronomist', 'biotech_expert']}>
                  <MainLayout>
                    <VarietiesPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/diseases"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DiseasePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/disease-surveillance/:id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DiseaseReportDetailPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/diseases/:id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DiseaseReportDetailPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommendations"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <RecommendationsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/observations"
              element={
                <ProtectedRoute allowedRoles={['admin', 'agronomist']}>
                  <MainLayout>
                    <ObservationsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmers"
              element={
                <ProtectedRoute allowedRoles={['admin', 'agronomist']}>
                  <MainLayout>
                    <FarmersPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/advisories"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdvisoryPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'agronomist', 'biotech_expert']}>
                  <MainLayout>
                    <ReportsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
