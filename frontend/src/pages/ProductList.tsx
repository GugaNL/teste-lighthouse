import { useEffect, useId, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BulkActionsBar from '../components/BulkActionsBar';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState } from '../components/Feedback';
import Pagination from '../components/Pagination';
import ProductFilters from '../components/ProductFilters';
import ProductTable from '../components/ProductTable';
import SummaryCards from '../components/SummaryCards';
import { useBulkActions } from '../hooks/useBulkActions';
import { useCsvExport } from '../hooks/useCsvExport';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { useProductDeletion } from '../hooks/useProductDeletion';
import { PAGE_SIZE_OPTIONS, useProductFilters } from '../hooks/useProductFilters';
import { useProductSelection } from '../hooks/useProductSelection';
import { useCategoriesQuery, useProductsQuery } from '../queries/productQueries';
import { readRouteState } from '../types/navigation';
import type { ProductRouteState } from '../types/navigation';
import { formatCurrency, plural } from '../utils/format';
import { LIMITS } from '../utils/productRules';

const DURACAO_DO_DESTAQUE_MS = 4000;

export default function ProductList() {
  useDocumentTitle('Produtos');
  const location = useLocation();
  const navigate = useNavigate();
  const filtros = useProductFilters();
  const { page, pageSize, setPage } = filtros;
  const buscaRef = useRef<HTMLInputElement>(null);
  const categoriaEmLoteRef = useRef<HTMLInputElement>(null);
  const categoriasEmLoteId = useId();

  const produtos = useProductsQuery({ ...filtros.apiFilters, page, limit: pageSize });
  const categorias = useCategoriesQuery();
  const itens = produtos.data?.items;
  const total = produtos.data?.total ?? 0;

  useEffect(() => {
    if (itens && itens.length === 0 && total > 0 && page > 1) setPage(Math.ceil(total / pageSize));
  }, [itens, total, page, pageSize, setPage]);

  const destaque = readRouteState(location.state).highlightId;
  useEffect(() => {
    if (!destaque) return undefined;
    const timer = setTimeout(() => {
      void navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
    }, DURACAO_DO_DESTAQUE_MS);
    return () => clearTimeout(timer);
  }, [destaque, location.pathname, location.search, navigate]);

  useKeyboardShortcut('/', () => buscaRef.current?.focus());

  const selecao = useProductSelection();
  const lote = useBulkActions(selecao);
  const exclusao = useProductDeletion((produto) => {
    selecao.remove([produto.id]);
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
          isSelected={selecao.isSelected}
          onToggleSelected={selecao.toggle}
          onToggleAll={selecao.toggleAll}
        />
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onChange={setPage}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={filtros.setPageSize}
        />
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
        stockStatus={filtros.stockStatus}
        onToggleStockStatus={(faixa) => filtros.setStockStatus(filtros.stockStatus === faixa ? null : faixa)}
      />

      <section className="painel" aria-labelledby="titulo-lista">
        <h2 id="titulo-lista" className="sr-only">
          Lista de produtos
        </h2>
        <ProductFilters
          search={filtros.searchText}
          onSearchChange={filtros.setSearchText}
          searchInputRef={buscaRef}
          category={filtros.category}
          onCategoryChange={filtros.setCategory}
          categories={categorias.data}
          sort={filtros.sort}
          onSortChange={filtros.setSort}
          stockStatus={filtros.stockStatus}
          onStockStatusChange={filtros.setStockStatus}
          minPrice={filtros.minPriceInput}
          onMinPriceChange={filtros.setMinPriceInput}
          maxPrice={filtros.maxPriceInput}
          onMaxPriceChange={filtros.setMaxPriceInput}
          priceRangeError={filtros.priceRangeError}
          hasFilters={filtros.hasFilters}
          onClear={filtros.clearFilters}
        />
        <BulkActionsBar
          count={selecao.count}
          busy={lote.isBusy}
          onExport={lote.exportSelected}
          onChangeCategory={lote.openCategory}
          onDelete={lote.openDelete}
          onClear={selecao.clear}
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
            catálogo. Você poderá desfazer logo em seguida.
          </p>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={lote.dialog === 'delete'}
        title={`Excluir ${plural(selecao.count, 'produto')}?`}
        confirmLabel="Excluir"
        busyLabel="Excluindo…"
        busy={lote.isBusy}
        error={lote.error}
        onConfirm={lote.confirmDelete}
        onCancel={lote.closeDialog}
      >
        <p>
          {plural(
            selecao.count,
            'produto selecionado será removido',
            'produtos selecionados serão removidos'
          )}{' '}
          do catálogo. Você poderá desfazer logo em seguida.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={lote.dialog === 'category'}
        title="Mudar categoria"
        confirmLabel="Aplicar"
        busyLabel="Aplicando…"
        variant="primario"
        busy={lote.isBusy}
        error={lote.error}
        initialFocusRef={categoriaEmLoteRef}
        onConfirm={lote.confirmCategory}
        onCancel={lote.closeDialog}
      >
        <div className="campo">
          <label htmlFor={`${categoriasEmLoteId}-campo`} className="campo__rotulo">
            Nova categoria para {plural(selecao.count, 'produto selecionado', 'produtos selecionados')}
          </label>
          <input
            id={`${categoriasEmLoteId}-campo`}
            ref={categoriaEmLoteRef}
            type="text"
            list={`${categoriasEmLoteId}-lista`}
            value={lote.category}
            maxLength={LIMITS.category.max * 2}
            onChange={(e) => lote.setCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void lote.confirmCategory();
              }
            }}
            disabled={lote.isBusy}
            autoComplete="off"
          />
          <datalist id={`${categoriasEmLoteId}-lista`}>
            {categorias.data?.map((c) => (
              <option key={c.name} value={c.name} />
            ))}
          </datalist>
        </div>
      </ConfirmDialog>
    </>
  );
}
