import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/login/LoginPage';
import VerifyOtpPage from './pages/verify-otp/VerifyOtpPage';
import SetPasswordPage from './pages/set-password/SetPasswordPage';
import ForgotPasswordPage from './pages/forgot-password/ForgotPasswordPage';
import ResetPasswordPage from './pages/reset-password/ResetPasswordPage';

import AdminLayout from './layouts/AdminLayout';
import AdminUsersPage from './pages/admin/users/AdminUsersPage';
import AdminConfigPage from './pages/admin/config/AdminConfigPage';
import AdminPackageManagementPage from './pages/admin/packages/AdminPackageManagementPage';
import AdminFilesPage from './pages/files/FileStoragePage';
import PointStatsPage from './pages/admin/points/PointStatsPage';
import LicensePlateResultsPage from './pages/license-plate/LicensePlateResultsPage';
import VideoRepairPage from './pages/video-repair/VideoRepairPage';



import OfficerLayout from './layouts/OfficerLayout';
import ProfilePage from './pages/profile/ProfilePage';
import OfficerFilesPage from './pages/files/FileStoragePage';

import DashboardPage from './pages/dashboard/DashboardPage';
import TransactionHistoryPage from './pages/transactions/TransactionHistoryPage';
import LicensePlatePage from './pages/license-plate/LicensePlatePage';
import PricingPage from './pages/PricingPage';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={viVN}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/verify-otp" element={<VerifyOtpPage />} />
              <Route path="/set-password" element={<SetPasswordPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="config" element={<AdminConfigPage />} />
              <Route path="packages" element={<AdminPackageManagementPage />} />
              <Route path="transactions" element={<TransactionHistoryPage />} />
              <Route path="files" element={<AdminFilesPage />} />
              <Route path="points/stats" element={<PointStatsPage />} />
              <Route path="license-plate" element={<LicensePlatePage />} />
              <Route path="license-plate/results" element={<LicensePlateResultsPage />} />
              <Route path="video-repair" element={<VideoRepairPage />} />
              <Route path="pricing" element={<PricingPage />} />
            </Route>

            <Route
              path="/can-bo"
              element={
                <ProtectedRoute requiredRole="can_bo">
                  <OfficerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="license-plate" element={<LicensePlatePage />} />
              <Route path="license-plate/results" element={<LicensePlateResultsPage />} />
              <Route path="video-repair" element={<VideoRepairPage />} />
              <Route path="transactions" element={<TransactionHistoryPage />} />
              <Route path="files" element={<OfficerFilesPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
