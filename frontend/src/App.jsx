import AppRoutes from './routes/AppRoutes.jsx';
import Layout from './layouts/Layout.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Layout>
          <AppRoutes />
        </Layout>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
