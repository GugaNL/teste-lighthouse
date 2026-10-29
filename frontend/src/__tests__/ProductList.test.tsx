import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import ProductList from '../pages/ProductList';
import { ApiError } from '../services/api';
import * as productService from '../services/productService';
import * as csvModule from '../utils/csv';
import { renderWithProviders } from '../test/renderWithProviders';
import type { CategorySummary, Product } from '../types/product';

vi.mock('../services/productService', () => ({
  listProducts: vi.fn(),
  listCategories: vi.fn(),
  deleteProduct: vi.fn(),
  restoreProduct: vi.fn(),
  deleteProducts: vi.fn(),
  restoreProducts: vi.fn(),
  changeProductsCategory: vi.fn(),
}));
vi.mock('../utils/csv', async (original) => ({
  ...(await original<typeof csvModule>()),
  downloadCsv: vi.fn(),
}));
const csv = vi.mocked(csvModule);
const servico = vi.mocked(productService);

const produto = (
  dados: Pick<Product, 'id' | 'name' | 'description' | 'price' | 'stock' | 'category'>
): Product => ({
  ...dados,
  inStock: dados.stock > 0,
  version: 1,
  createdAt: '2026-10-28T12:00:00Z',
  updatedAt: '2026-10-28T12:00:00Z',
});

const produtos: [Product, Product] = [
  produto({
    id: 'a1',
    name: 'Notebook Vortex',
    description: '',
    price: 4899.9,
    stock: 12,
    category: 'Informática',
  }),
  produto({
    id: 'b2',
    name: 'Mouse sem fio',
    description: 'Sensor óptico',
    price: 249.9,
    stock: 0,
    category: 'Informática',
  }),
];
const categorias: CategorySummary[] = [
  { name: 'Informática', products: 2, stock: 12, inventoryValue: 58798.8, outOfStock: 1, lowStock: 0 },
];

const renderizar = () => renderWithProviders(<ProductList />).user;

beforeEach(() => {
  vi.clearAllMocks();
  servico.listProducts.mockResolvedValue({ items: produtos, total: 2 });
  servico.listCategories.mockResolvedValue(categorias);
  servico.deleteProduct.mockResolvedValue(undefined);
  servico.restoreProduct.mockResolvedValue(produtos[1]);
  servico.deleteProducts.mockResolvedValue({ deleted: 2 });
  servico.restoreProducts.mockResolvedValue({ restored: 2 });
  servico.changeProductsCategory.mockResolvedValue({ updated: 2, category: 'Casa' });
});

const ultimaListagem = () => servico.listProducts.mock.lastCall?.[0];

describe('ProductList', () => {
  it('lista os produtos consumindo a API, com selo de estoque e indicadores', async () => {
    renderizar();

    expect(await screen.findByText('Notebook Vortex')).toBeInTheDocument();
    expect(screen.getByText('Mouse sem fio')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Esgotado')).toBeInTheDocument();
    expect(screen.getByText('R$ 4.899,90')).toBeInTheDocument();
    expect(servico.listProducts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10, sort: '-createdAt' }),
      expect.anything()
    );
    const indicadores = screen.getByRole('region', { name: 'Indicadores do catálogo' });
    expect(within(indicadores).getByText('R$ 58.798,80')).toBeInTheDocument();
  });

  it('mostra carregando enquanto a API não responde', () => {
    servico.listProducts.mockReturnValue(new Promise(() => {}));
    renderizar();
    expect(screen.getByText('Carregando produtos…')).toBeInTheDocument();
  });

  it('mostra o erro e tenta de novo quando o usuário pede', async () => {
    servico.listProducts
      .mockRejectedValueOnce(new ApiError({ message: 'Não foi possível conectar à API.' }))
      .mockResolvedValueOnce({ items: produtos, total: 2 });
    const user = renderizar();

    expect(await screen.findByText('Não foi possível carregar os produtos')).toBeInTheDocument();
    expect(screen.getByText('Não foi possível conectar à API.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Notebook Vortex')).toBeInTheDocument();
  });

  it('catálogo vazio convida a cadastrar', async () => {
    servico.listProducts.mockResolvedValue({ items: [], total: 0 });
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
    expect(servico.deleteProduct).not.toHaveBeenCalled();

    servico.listProducts.mockResolvedValue({ items: [produtos[0]], total: 1 });
    await user.click(within(dialogo).getByRole('button', { name: 'Excluir' }));

    expect(servico.deleteProduct).toHaveBeenCalledWith('b2');
    expect(await screen.findByText('“Mouse sem fio” foi excluído.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Mouse sem fio')).not.toBeInTheDocument());
    await waitFor(() => expect(servico.listCategories).toHaveBeenCalledTimes(2));
  });

  it('cancelar a confirmação não exclui nada', async () => {
    const user = renderizar();
    await screen.findByText('Notebook Vortex');

    await user.click(screen.getByRole('button', { name: 'Excluir Notebook Vortex' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(servico.deleteProduct).not.toHaveBeenCalled();
  });

  it('se a exclusão falhar, o erro aparece no diálogo e o produto continua', async () => {
    servico.deleteProduct.mockRejectedValue(
      new ApiError({ status: 500, message: 'O servidor encontrou um erro.' })
    );
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
      expect(servico.listProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'mouse', page: 1 }),
        expect.anything()
      )
    );
  });

  it('desfazer no aviso restaura o produto excluído', async () => {
    const user = renderizar();
    await screen.findByText('Notebook Vortex');

    await user.click(screen.getByRole('button', { name: 'Excluir Mouse sem fio' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Excluir' }));
    await user.click(await screen.findByRole('button', { name: 'Desfazer' }));

    expect(servico.restoreProduct).toHaveBeenCalledWith('b2');
    expect(await screen.findByText('“Mouse sem fio” foi restaurado.')).toBeInTheDocument();
  });

  it('filtra por faixa de estoque e de preço', async () => {
    const user = renderizar();
    await screen.findByText('Notebook Vortex');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Estoque' }), 'Estoque baixo');
    await waitFor(() => expect(ultimaListagem()).toMatchObject({ stockStatus: 'low', page: 1 }));

    await user.type(screen.getByRole('textbox', { name: 'Preço mínimo' }), '10000');
    await waitFor(() => expect(ultimaListagem()).toMatchObject({ stockStatus: 'low', minPrice: 100 }));
  });

  it('avisa quando o preço máximo é menor que o mínimo e não o envia', async () => {
    const user = renderizar();
    await screen.findByText('Notebook Vortex');

    await user.type(screen.getByRole('textbox', { name: 'Preço mínimo' }), '10000');
    await user.type(screen.getByRole('textbox', { name: 'Preço máximo' }), '5000');

    expect(await screen.findByText('O preço máximo é menor que o mínimo.')).toBeInTheDocument();
    expect(ultimaListagem()).toMatchObject({ minPrice: 100, maxPrice: undefined });
  });

  it('o cartão "Estoque baixo" liga e desliga o filtro', async () => {
    const user = renderizar();
    await screen.findByText('Notebook Vortex');

    const cartao = screen.getByRole('button', { name: /Estoque baixo/ });
    await user.click(cartao);
    await waitFor(() => expect(ultimaListagem()).toMatchObject({ stockStatus: 'low' }));
    expect(cartao).toHaveAttribute('aria-pressed', 'true');

    await user.click(cartao);
    await waitFor(() => expect(ultimaListagem()?.stockStatus).toBeUndefined());
  });

  it('muda o tamanho da página', async () => {
    const user = renderizar();
    await screen.findByText('Notebook Vortex');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Por página' }), '50');
    await waitFor(() => expect(ultimaListagem()).toMatchObject({ limit: 50, page: 1 }));
  });

  it('a tecla / foca a busca', async () => {
    const user = renderizar();
    await screen.findByText('Notebook Vortex');

    await user.keyboard('/');
    expect(screen.getByRole('searchbox', { name: 'Buscar produtos' })).toHaveFocus();
  });

  describe('ações em lote', () => {
    const selecionarTodos = async (user: ReturnType<typeof renderizar>) => {
      await screen.findByText('Notebook Vortex');
      await user.click(screen.getByRole('checkbox', { name: 'Selecionar todos desta página' }));
      return within(screen.getByRole('region', { name: 'Ações em lote' }));
    };

    it('seleciona um a um ou a página inteira', async () => {
      const user = renderizar();
      await screen.findByText('Notebook Vortex');

      await user.click(screen.getByRole('checkbox', { name: 'Selecionar Mouse sem fio' }));
      expect(screen.getByText('1 produto selecionado')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Selecionar todos desta página' })).toHaveProperty(
        'indeterminate',
        true
      );

      await user.click(screen.getByRole('checkbox', { name: 'Selecionar todos desta página' }));
      expect(screen.getByText('2 produtos selecionados')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Limpar seleção' }));
      expect(screen.queryByRole('region', { name: 'Ações em lote' })).not.toBeInTheDocument();
    });

    it('exclui os selecionados depois de confirmar, com desfazer', async () => {
      const user = renderizar();
      const barra = await selecionarTodos(user);

      await user.click(barra.getByRole('button', { name: 'Excluir selecionados' }));
      const dialogo = screen.getByRole('alertdialog', { name: 'Excluir 2 produtos?' });
      await user.click(within(dialogo).getByRole('button', { name: 'Excluir' }));

      expect(servico.deleteProducts).toHaveBeenCalledWith(['a1', 'b2']);
      expect(await screen.findByText('2 produtos excluídos.')).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Ações em lote' })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Desfazer' }));
      expect(servico.restoreProducts).toHaveBeenCalledWith(['a1', 'b2']);
      expect(await screen.findByText('2 produtos restaurados.')).toBeInTheDocument();
    });

    it('muda a categoria dos selecionados', async () => {
      const user = renderizar();
      const barra = await selecionarTodos(user);

      await user.click(barra.getByRole('button', { name: 'Mudar categoria' }));
      const campo = screen.getByRole('combobox', { name: /Nova categoria/ });
      expect(campo).toHaveFocus();
      await user.type(campo, '  Casa {Enter}');

      expect(servico.changeProductsCategory).toHaveBeenCalledWith(['a1', 'b2'], 'Casa');
      expect(await screen.findByText('Categoria de 2 produtos alterada para “Casa”.')).toBeInTheDocument();
    });

    it('não envia categoria vazia', async () => {
      const user = renderizar();
      const barra = await selecionarTodos(user);

      await user.click(barra.getByRole('button', { name: 'Mudar categoria' }));
      await user.click(screen.getByRole('button', { name: 'Aplicar' }));

      expect(within(screen.getByRole('alertdialog')).getByRole('alert')).toHaveTextContent(
        'Categoria é obrigatória'
      );
      expect(servico.changeProductsCategory).not.toHaveBeenCalled();
    });

    it('exporta só os selecionados', async () => {
      const user = renderizar();
      await screen.findByText('Notebook Vortex');
      await user.click(screen.getByRole('checkbox', { name: 'Selecionar Mouse sem fio' }));

      await user.click(screen.getByRole('button', { name: 'Exportar selecionados' }));

      const [conteudo, nome] = csv.downloadCsv.mock.lastCall ?? [];
      expect(nome).toMatch(/^catalogo-selecionados-/);
      expect(conteudo).toContain('Mouse sem fio');
      expect(conteudo).not.toContain('Notebook Vortex');
    });
  });
});
