import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext';
import { ROUTER_FUTURE } from '../routes';

export interface RenderOptions {
  routes?: RouteObject[];
  path?: string;
  initialEntries?: string[];
  initialIndex?: number;
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
}

export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
  const { routes = [], path = '/', initialEntries = [path], initialIndex } = options;
  const queryClient = createTestQueryClient();
  const router = createMemoryRouter([...routes, { path, element: ui }], { initialEntries, initialIndex });

  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} future={ROUTER_FUTURE} />
      </ToastProvider>
    </QueryClientProvider>
  );
  return { router, queryClient, user: userEvent.setup() };
}
