import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProductList from '../pages/ProductList';
import { ToastProvider } from '../context/ToastContext';
import { ApiError } from '../services/api';
import * as productService from '../services/productService';

vi.mock('../services/productService', () => ({
  listProducts: vi.fn(),
  listCategories: vi.fn(),
  deleteProduct: vi.fn(),
}));

const produtos = [
  { id: 'a1', name: 'Notebook Vortex', description: '', price: 4899.9, stock: 12, category: 'Informática', updatedAt: '2026-10-28T12:00:00Z' },
  { id: 'b2', name: 'Mouse sem fio', description: 'Sensor óptico', price: 249.9, stock: 0, category: 'Informática', updatedAt: '2026-10-28T12:00:00Z' },
];
const categorias = [{ name: 'Informática', products: 2, stock: 12, inventoryValue: 58798.8, outOfStock: 1 }];

const renderizar = () => {
  render(
    <MemoryRouter>
      <ToastProvider>
        <ProductList />
      </ToastProvider>
    </MemoryRouter>
  );
  return userEvent.setup();
};

beforeEach(() => {
  vi.clearAllMocks();
  productService.listProducts.mockResolvedValue({ items: produtos, total: 2 });
  productService.listCategories.mockResolvedValue(categorias);
  productService.deleteProduct.mockResolvedValue(undefined);
});

describe('ProductList', () => {
  it('lista os produtos consumindo a API, com selo de estoque e indicadores', async () => {
    renderizar();

    expect(await screen.findByText('Notebook Vortex')).toBeInTheDocument();
    expect(screen.getByText('Mouse sem fio')).toBeInTheDocument();
    expect(screen.getByText('Esgotado')).toBeInTheDocument();
    expect(screen.getByText('R$ 4.899,90')).toBeInTheDocument();
    expect(productService.listProducts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10, sort: '-createdAt' }),
      expect.anything()
    );
    const indicadores = screen.getByRole('region', { name: 'Indicadores do catálogo' });
    expect(within(indicadores).getByText('R$ 58.798,80')).toBeInTheDocument();
  });

  it('mostra carregando enquanto a API não responde', () => {
    productService.listProducts.mockReturnValue(new Promise(() => {}));
    renderizar();
    expect(screen.getByText('Carregando produtos…')).toBeInTheDocument();
  });

  it('mostra o erro e tenta de novo quando o usuário pede', async () => {
    productService.listProducts
      .mockRejectedValueOnce(new ApiError({ message: 'Não foi possível conectar à API.' }))
      .mockResolvedValueOnce({ items: produtos, total: 2 });
    const user = renderizar();

    expect(await screen.findByText('Não foi possível carregar os produtos')).toBeInTheDocument();
    expect(screen.getByText('Não foi possível conectar à API.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Notebook Vortex')).toBeInTheDocument();
  });

  it('catálogo vazio convida a cadastrar', async () => {
    productService.listProducts.mockResolvedValue({ items: [], total: 0 });
    renderizar();
    expect(await screen.findByText('Nenhum produto cadastrado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cadastrar produto' })).toHaveAttribute('href', '/produtos/novo');
  });

  it('exclui só depois de confirmar, e recarrega lista e indicadores', async () => {
    const user = renderizar();
    await screen.findByText('Notebook Vortex');

    await user.click(screen.getByRole('button', { name: 'Excluir Mouse sem fio' }));
    const dialogo = screen.getByRole('alertdialog', { name: 'Excluir produto?' });
    expect(dialogo).toHaveTextContent('Mouse sem fio');
    expect(productService.deleteProduct).not.toHaveBeenCalled();

    productService.listProducts.mockResolvedValue({ items: [produtos[0]], total: 1 });
    await user.click(within(dialogo).getByRole('button', { name: 'Excluir' }));

    expect(productService.deleteProduct).toHaveBeenCalledWith('b2');
    expect(await screen.findByText('“Mouse sem fio” foi excluído.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Mouse sem fio')).not.toBeInTheDocument());
    expect(productService.listCategories).toHaveBeenCalledTimes(2);
  });

  it('cancelar a confirmação não exclui nada', async () => {
    const user = renderizar();
    await screen.findByText('Notebook Vortex');

    await user.click(screen.getByRole('button', { name: 'Excluir Notebook Vortex' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(productService.deleteProduct).not.toHaveBeenCalled();
  });

  it('se a exclusão falhar, o erro aparece no diálogo e o produto continua', async () => {
    productService.deleteProduct.mockRejectedValue(new ApiError({ status: 500, message: 'O servidor encontrou um erro.' }));
    const user = renderizar();
    await screen.findByText('Notebook Vortex');

    await user.click(screen.getByRole('button', { name: 'Excluir Notebook Vortex' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Excluir' }));

    expect(await within(screen.getByRole('alertdialog')).findByRole('alert')).toHaveTextContent(
      'O servidor encontrou um erro.'
    );
    expect(screen.getAllByText('Notebook Vortex').length).toBeGreaterThan(0);
  });

  it('busca com debounce e envia o termo para a API', async () => {
    const user = renderizar();
    await screen.findByText('Notebook Vortex');

    await user.type(screen.getByRole('searchbox', { name: 'Buscar produtos' }), 'mouse');

    await waitFor(() =>
      expect(productService.listProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'mouse', page: 1 }),
        expect.anything()
      )
    );
  });
});
