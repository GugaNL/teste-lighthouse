import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import Layout from '../components/Layout';
import { THEME_STORAGE_KEY } from '../hooks/useTheme';
import { renderWithProviders } from '../test/renderWithProviders';

const renderizar = () =>
  renderWithProviders(<Layout />, {
    path: '/',
    children: [
      { index: true, element: <h1>Lista</h1> },
      { path: 'produtos/novo', element: <h1>Formulário novo</h1> },
    ],
  }).user;

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('Layout', () => {
  it('a tecla N abre o formulário de novo produto', async () => {
    const user = renderizar();
    await screen.findByRole('heading', { name: 'Lista' });

    await user.keyboard('n');
    expect(await screen.findByRole('heading', { name: 'Formulário novo' })).toBeInTheDocument();
  });

  it('atalhos não disparam enquanto se digita num campo', async () => {
    const user = renderizar();
    await screen.findByRole('heading', { name: 'Lista' });
    const campo = document.createElement('input');
    document.body.appendChild(campo);
    campo.focus();

    await user.keyboard('n');
    expect(screen.getByRole('heading', { name: 'Lista' })).toBeInTheDocument();
    campo.remove();
  });

  it('alterna o tema e lembra a escolha', async () => {
    const user = renderizar();
    const botao = await screen.findByRole('button', { name: 'Tema escuro' });
    expect(botao).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.dataset.theme).toBe('light');

    await user.click(botao);
    expect(botao).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('abre com o tema salvo', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    renderizar();
    expect(await screen.findByRole('button', { name: 'Tema escuro' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
