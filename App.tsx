import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NewDashboardPage from './pages/NewDashboardPage';
import NewChallengeDetailPage from './pages/NewChallengeDetailPage';
import EnhancedChallengesPage from './pages/EnhancedChallengesPage';
import CompetitionPage from './pages/CompetitionPage';
import CompetitionDashboardPage from './pages/CompetitionDashboardPage';
import CompetitionChallengeDetailPage from './pages/CompetitionChallengeDetailPage';
import CompetitionLeaderboardPage from './pages/CompetitionLeaderboardPage';
import GeneralLeaderboardPage from './pages/GeneralLeaderboardPage.tsx';
import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import AppLayout from './components/AppLayout';
import ManagementLayout, { ManagementGate } from './components/ManagementLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminChallengesPage from './pages/admin/AdminChallengesPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCompetitionsPage from './pages/admin/AdminCompetitionsPage';
import AdminUniversityPage from './pages/admin/AdminUniversityPage';
import CompetitionMonitoringPage from './pages/admin/CompetitionMonitoringPage';
import SuperAdminPage from './pages/admin/SuperAdminPage';
import Loader from './components/ui/Loader';
import { ConfirmationProvider } from './src/contexts/ConfirmationContext';
import { SocketProvider } from './src/contexts/SocketContext';
import { SocketToast } from './src/components/SocketToast';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    }

    setTimeout(() => setIsLoading(false), 1000);

    // Listen for user updates to sync across components
    const handleUserUpdate = (e: CustomEvent) => {
      setUser(e.detail);
    };

    window.addEventListener('userUpdate', handleUserUpdate as EventListener);

    return () => {
      window.removeEventListener('userUpdate', handleUserUpdate as EventListener);
    };
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onRegister={handleLogin} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    );
  }

  const isSuperAdmin = user.role === 'super-admin';

  return (
    <ConfirmationProvider>
      <SocketProvider user={user}>
        <SocketToast />
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Navigate to="/dashboard" />} />

            {/* One shell for every role — learner experience for all, plus a
                role-gated Management area nested in the same layout. */}
            <Route path="/" element={<AppLayout onLogout={handleLogout} />}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<NewDashboardPage />} />
              <Route path="challenges" element={<EnhancedChallengesPage />} />
              <Route path="challenges/:id" element={<NewChallengeDetailPage />} />
              <Route path="competition" element={<CompetitionPage />} />
              <Route path="competition/:id" element={<CompetitionDashboardPage />} />
              <Route path="competition/:id/challenge/:challengeId" element={<CompetitionChallengeDetailPage />} />
              <Route path="competition/:id/leaderboard" element={<CompetitionLeaderboardPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="leaderboard" element={<GeneralLeaderboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="profile/:userId" element={<PublicProfilePage />} />

              {/* Management — admins & super-admins only */}
              <Route
                path="admin"
                element={
                  <ManagementGate>
                    <ManagementLayout />
                  </ManagementGate>
                }
              >
                <Route index element={isSuperAdmin ? <SuperAdminPage /> : <AdminDashboardPage />} />
                <Route
                  path="super"
                  element={isSuperAdmin ? <SuperAdminPage /> : <Navigate to="/admin" replace />}
                />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="challenges" element={<AdminChallengesPage />} />
                <Route path="competitions" element={<AdminCompetitionsPage />} />
                <Route path="competitions/:id/monitor" element={<CompetitionMonitoringPage />} />
                <Route path="announcements" element={<AdminAnnouncementsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route
                  path="university"
                  element={!isSuperAdmin ? <AdminUniversityPage /> : <Navigate to="/admin" replace />}
                />
                <Route path="*" element={<Navigate to="/admin" />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Route>
          </Routes>
        </HashRouter>
      </SocketProvider>
    </ConfirmationProvider>
  );
};

export default App;
