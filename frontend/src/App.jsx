import Layout from './components/Layout';
import { RouteError } from './components/ErrorBoundary';
import ProductList from './pages/ProductList';
import ProductCreate from './pages/ProductCreate';
import ProductEdit from './pages/ProductEdit';
import NotFound from './pages/NotFound';

// Rotas do site em português e fora de /products, que é o caminho da API —
// assim o mesmo servidor entrega API e SPA sem colisão.
//
// Em objeto (e não <Routes>) porque o roteador de dados é o que habilita o
// useBlocker do aviso de alterações não salvas.
export const routes = [
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <ProductList /> },
      { path: 'produtos/novo', element: <ProductCreate /> },
      { path: 'produtos/:id/editar', element: <ProductEdit /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];
