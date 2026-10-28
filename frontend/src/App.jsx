import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProductList from './pages/ProductList';
import ProductCreate from './pages/ProductCreate';
import ProductEdit from './pages/ProductEdit';
import NotFound from './pages/NotFound';

// Rotas do site em português e fora de /products, que é o caminho da API —
// assim o mesmo servidor entrega API e SPA sem colisão.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ProductList />} />
        <Route path="produtos/novo" element={<ProductCreate />} />
        <Route path="produtos/:id/editar" element={<ProductEdit />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
