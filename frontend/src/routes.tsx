import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';
import Layout from './components/Layout';
import { RouteError } from './components/ErrorBoundary';
import ProductList from './pages/ProductList';
import NotFound from './pages/NotFound';

const sobDemanda =
  (carregar: () => Promise<{ default: ComponentType }>): RouteObject['lazy'] =>
  async () => ({ Component: (await carregar()).default });

export const ROUTER_FUTURE = { v7_startTransition: true } as const;

// Rotas do site em português e fora de /products, que é o caminho da API —
// assim o mesmo servidor entrega API e SPA sem colisão.
export const routes: RouteObject[] = [
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <ProductList /> },
      { path: 'produtos/novo', lazy: sobDemanda(() => import('./pages/ProductCreate')) },
      { path: 'produtos/:id/editar', lazy: sobDemanda(() => import('./pages/ProductEdit')) },
      { path: '*', element: <NotFound /> },
    ],
  },
];
