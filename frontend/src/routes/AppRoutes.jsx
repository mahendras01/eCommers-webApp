import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import ProductPage from '../pages/ProductPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import CartPage from '../pages/CartPage.jsx';
import DeliveryAddressPage from '../pages/DeliveryAddressPage.jsx';
import PaymentPage from '../pages/PaymentPage.jsx';
import OrdersPage from '../pages/OrdersPage.jsx';
import OrderDetailsPage from '../pages/OrderDetailsPage.jsx';
import OrderTrackingPage from '../pages/OrderTrackingPage.jsx';
import OrderHelpPage from '../pages/OrderHelpPage.jsx';
import UnauthorizedPage from '../pages/UnauthorizedPage.jsx';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import ProductManagementPage from '../pages/admin/ProductManagementPage.jsx';
import CategoryManagementPage from '../pages/admin/CategoryManagementPage.jsx';
import OrderManagementPage from '../pages/admin/OrderManagementPage.jsx';
import UserManagementPage from '../pages/admin/UserManagementPage.jsx';
import UserDetailsPage from '../pages/admin/UserDetailsPage.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import AdminProtectedRoute from '../components/AdminProtectedRoute.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import { AddressProvider } from '../contexts/AddressContext.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="/cart" element={
        <ProtectedRoute>
          <CartPage />
        </ProtectedRoute>
      } />
      <Route
        path="/delivery"
        element={
          <ProtectedRoute>
            <AddressProvider>
              <DeliveryAddressPage />
            </AddressProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <AddressProvider>
              <PaymentPage />
            </AddressProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:orderId"
        element={
          <ProtectedRoute>
            <OrderDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:orderId/tracking"
        element={
          <ProtectedRoute>
            <OrderTrackingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:orderId/help"
        element={
          <ProtectedRoute>
            <OrderHelpPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminLayout title="Dashboard">
              <AdminDashboardPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <AdminProtectedRoute>
            <AdminLayout title="Product Management">
              <ProductManagementPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <AdminProtectedRoute>
            <AdminLayout title="Category Management">
              <CategoryManagementPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminProtectedRoute>
            <AdminLayout title="Order Management">
              <OrderManagementPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminProtectedRoute>
            <AdminLayout title="User Management">
              <UserManagementPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/users/:userId"
        element={
          <AdminProtectedRoute>
            <AdminLayout title="User Details">
              <UserDetailsPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
    </Routes>
  );
}
