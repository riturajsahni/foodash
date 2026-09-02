import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { SocketProvider } from './contexts/SocketContext';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import GoogleAuthSuccess from './pages/auth/GoogleAuthSuccess';


import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from './pages/auth/ResetPasswordPage';
import VerifyEmailPage    from './pages/auth/VerifyEmailPage';
import ProfilePage        from './pages/customer/ProfilePage';
import AdminReports       from './pages/admin/AdminReports';

// Customer Pages
import CustomerHome from './pages/customer/CustomerHome';
import RestaurantDetail from './pages/customer/RestaurantDetail';
import CartPage from './pages/customer/CartPage';
import OrdersPage from './pages/customer/OrdersPage';
import OrderTracking from './pages/customer/OrderTracking';
import CustomerProfile from './pages/customer/CustomerProfile';
import WalletPage from './pages/customer/WalletPage';

// Restaurant Pages
import RestaurantDashboard from './pages/restaurant/RestaurantDashboard';
import MenuManagement from './pages/restaurant/MenuManagement';
import RestaurantOrders from './pages/restaurant/RestaurantOrders';
import RestaurantSetup from './pages/restaurant/RestaurantSetup';
import RestaurantProfile from './pages/restaurant/RestaurantProfile';

// Delivery Pages
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DeliveryOrders from './pages/delivery/DeliveryOrders';
import EarningsDashboard from './pages/delivery/EarningsDashboard';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminOrders from './pages/admin/AdminOrders';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import AdminCoupons from './pages/admin/AdminCoupons';



// Protected Route
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent"/></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={`/${user.role}`} /> : <RegisterPage />} />
      {/* Public auth routes */}
      
        <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/verify-email"    element={<VerifyEmailPage />} />
      <Route path="/" element={<Navigate to={user ? `/${user.role}` : '/login'} />} />

      {/* Customer */}
      <Route path="/customer" element={<ProtectedRoute roles={['customer']}><CustomerHome /></ProtectedRoute>} />
      <Route path="/customer/restaurant/:id" element={<ProtectedRoute roles={['customer']}><RestaurantDetail /></ProtectedRoute>} />
      <Route path="/customer/cart" element={<ProtectedRoute roles={['customer']}><CartPage /></ProtectedRoute>} />
      <Route path="/customer/orders" element={<ProtectedRoute roles={['customer']}><OrdersPage /></ProtectedRoute>} />
      <Route path="/customer/orders/:id" element={<ProtectedRoute roles={['customer']}><OrderTracking /></ProtectedRoute>} />
      <Route path="/customer/profile" element={<ProtectedRoute roles={['customer']}><ProfilePage /></ProtectedRoute>} />      {/* Customer new routes */}
      <Route
        path="/customer/wallet"
        element={
          <ProtectedRoute roles={['customer']}>
            <WalletPage />
          </ProtectedRoute>
        }
      />

      {/* Restaurant */}
      <Route path="/restaurant" element={<ProtectedRoute roles={['restaurant']}><RestaurantDashboard /></ProtectedRoute>} />
      <Route path="/restaurant/setup" element={<ProtectedRoute roles={['restaurant']}><RestaurantSetup /></ProtectedRoute>} />
      <Route path="/restaurant/menu" element={<ProtectedRoute roles={['restaurant']}><MenuManagement /></ProtectedRoute>} />
      <Route path="/restaurant/orders" element={<ProtectedRoute roles={['restaurant']}><RestaurantOrders /></ProtectedRoute>} />
      <Route path="/restaurant/profile" element={<ProtectedRoute roles={['restaurant']}><RestaurantProfile /></ProtectedRoute>} />

      {/* Delivery */}
      <Route path="/delivery" element={<ProtectedRoute roles={['delivery']}><DeliveryDashboard /></ProtectedRoute>} />
      <Route path="/delivery/orders" element={<ProtectedRoute roles={['delivery']}><DeliveryOrders /></ProtectedRoute>} />
      <Route path="/delivery/earnings" element={<ProtectedRoute roles={['delivery']}><EarningsDashboard /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/restaurants" element={<ProtectedRoute roles={['admin']}><AdminRestaurants /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><AdminReports /></ProtectedRoute>} />
      {/* Admin new routes */}
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute roles={['admin']}>
              <AnalyticsDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/coupons"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminCoupons />
            </ProtectedRoute>
          }
        />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <SocketProvider>
            <AppRoutes />
            <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px' } }} />
          </SocketProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

