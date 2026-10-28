import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import { ROUTER_FUTURE, routes } from './routes';
import ErrorBoundary from './components/ErrorBoundary';
import { Loading } from './components/Feedback';
import { ToastProvider } from './context/ToastContext';
import { createQueryClient } from './queries/queryClient';
import './styles/main.scss';

const router = createBrowserRouter(routes);
const queryClient = createQueryClient();

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Elemento #root não encontrado no index.html');

ReactDOM.createRoot(raiz).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} fallbackElement={<Loading />} future={ROUTER_FUTURE} />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
