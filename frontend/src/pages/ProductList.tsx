import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ProductFilters from '../components/ProductFilters';
import ProductTable from '../components/ProductTable';
import Pagination from '../components/Pagination';
import SummaryCards from '../components/SummaryCards';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState } from '../components/Feedback';
import { useCsvExport } from '../hooks/useCsvExport';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useProductDeletion } from '../hooks/useProductDeletion';
import { useProductFilters } from '../hooks/useProductFilters';
import { useCategoriesQuery, useProductsQuery } from '../queries/productQueries';
import { readRouteState } from '../types/navigation';
import type { ProductRouteState } from '../types/navigation';
import { formatCurrency, plural } from '../utils/format';

const PAGE_SIZE = 10;
const DURACAO_DO_DESTAQUE_MS = 4000;

export default function ProductList() {
  useDocumentTitle('Produtos');
  const location = useLocation();
  const navigate = useNavigate();
  const filtros = useProductFilters();
  const { page } = filtros;

  const produtos = useProductsQuery({ ...filtros.apiFilters, page, limit: PAGE_SIZE });
  const categorias = useCategoriesQuery();
  const itens = produtos.data?.items;
  const total = produtos.data?.total ?? 0;

  const { setPage } = filtros;
  useEffect(() => {
    if (itens && itens.length === 0 && total > 0 && page > 1) setPage(Math.ceil(total / PAGE_SIZE));
  }, [itens, total, page, setPage]);

  const destaque = readRouteState(location.state).highlightId;
  useEffect(() => {
    if (!destaque) return undefined;
    const timer = setTimeout(() => {
      void navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
    }, DURACAO_DO_DESTAQUE_MS);
    return () => clearTimeout(timer);
  }, [destaque, location.pathname, location.search, navigate]);

  const exclusao = useProductDeletion(() => {
    if (itens?.length === 1 && page > 1) setPage(page - 1);
  });
  const exportacao = useCsvExport(filtros.apiFilters);

  const voltarPara: ProductRouteState = { returnTo: `${location.pathname}${location.search}` };
  const carregando = produtos.isFetching;

  let corpo;
  if (produtos.isError) {
    corpo = (
      <ErrorState
        title="Não foi possível carregar os produtos"
        text={produtos.error.message}
        onRetry={() => void produtos.refetch()}
      />
    );
  } else if (itens && itens.length === 0 && !carregando) {
    corpo = filtros.hasFilters ? (
      <EmptyState
        title="Nenhum produto encontrado"
        description="Nenhum produto atende à busca e aos filtros atuais."
        action={
          <button type="button" className="botao botao--fantasma" onClick={filtros.clearFilters}>
            Limpar filtros
          </button>
        }
      />
    ) : (
      <EmptyState
        title="Nenhum produto cadastrado"
        description="Cadastre o primeiro produto para começar o catálogo."
        action={
          <Link to="/produtos/novo" className="botao botao--primario">
            Cadastrar produto
          </Link>
        }
      />
    );
  } else {
    corpo = (
      <>
        <ProductTable
          products={itens}
          loading={carregando}
          deletingId={exclusao.isDeleting ? exclusao.target?.id : null}
          highlightId={destaque}
          onDelete={exclusao.request}
          linkState={voltarPara}
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </>
    );
  }

  const alvo = exclusao.target;

  return (
    <>
      <div className="pagina__cabecalho">
        <div>
          <h1>Produtos</h1>
          <p className="pagina__subtitulo">Cadastre, edite e acompanhe o estoque do catálogo.</p>
        </div>
        <div className="pagina__acoes">
          <button
            type="button"
            className="botao botao--fantasma"
            onClick={exportacao.exportCsv}
            disabled={exportacao.isExporting || total === 0}
          >
            {exportacao.isExporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
          <Link to="/produtos/novo" state={voltarPara} className="botao botao--primario">
            + Novo produto
          </Link>
        </div>
      </div>

      <SummaryCards
        categories={categorias.data}
        loading={categorias.isPending}
        error={categorias.error}
        outOfStockActive={filtros.onlyOutOfStock}
        onShowOutOfStock={() => filtros.setOnlyOutOfStock(!filtros.onlyOutOfStock)}
      />

      <section className="painel" aria-labelledby="titulo-lista">
        <h2 id="titulo-lista" className="sr-only">
          Lista de produtos
        </h2>
        <ProductFilters
          search={filtros.searchText}
          onSearchChange={filtros.setSearchText}
          category={filtros.category}
          onCategoryChange={filtros.setCategory}
          categories={categorias.data}
          sort={filtros.sort}
          onSortChange={filtros.setSort}
          onlyOutOfStock={filtros.onlyOutOfStock}
          onOnlyOutOfStockChange={filtros.setOnlyOutOfStock}
          hasFilters={filtros.hasFilters}
          onClear={filtros.clearFilters}
        />
        <p className="sr-only" aria-live="polite">
          {produtos.isError
            ? 'Erro ao carregar os produtos.'
            : carregando
              ? 'Carregando produtos…'
              : `${plural(total, 'produto encontrado', 'produtos encontrados')}.`}
        </p>
        {corpo}
      </section>

      <ConfirmDialog
        open={Boolean(alvo)}
        title="Excluir produto?"
        confirmLabel="Excluir"
        busyLabel="Excluindo…"
        busy={exclusao.isDeleting}
        error={exclusao.error}
        onConfirm={exclusao.confirm}
        onCancel={exclusao.cancel}
      >
        {alvo ? (
          <p>
            <strong>{alvo.name}</strong> ({alvo.category} · {formatCurrency(alvo.price)}) será removido do
            catálogo. Esta ação não pode ser desfeita.
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
