import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ChatPage from '../pages/ChatPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProtectedRoute from '../components/ProtectedRoute';

const LandingPage = lazy(() => import('../landing/LandingPage'));

const PageLoader = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-app-bg">
    <span className="text-app-text-muted text-sm font-medium animate-pulse">Loading TalkEasy...</span>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <Suspense fallback={<PageLoader />}>
            <LandingPage />
          </Suspense>
        }
      />

      {/* Chat workstation (moved from "/") */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout>
              <ChatPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback redirect to main */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
