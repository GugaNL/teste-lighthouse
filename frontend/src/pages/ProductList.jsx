import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ProductFilters from '../components/ProductFilters';
import ProductTable from '../components/ProductTable';
import Pagination from '../components/Pagination';
import SummaryCards from '../components/SummaryCards';
import ConfirmDialog from '../components/ConfirmDialog';
import { Erro, Vazio } from '../components/Estado';
import { useRequest } from '../hooks/useRequest';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useToast } from '../context/ToastContext';
import { deleteProduct, listCategories, listProducts } from '../services/productService';
import { downloadCsv, productsToCsv } from '../utils/csv';
import { formatCurrency, plural } from '../utils/format';

export const PAGE_SIZE = 10;
const ORDEM_PADRAO = '-createdAt';

/**
 * Listagem do catálogo.
 *
 * Busca, filtros, ordenação e página moram na URL (?busca=&categoria=...):
 * recarregar a página, voltar no navegador ou mandar o link para alguém
 * mostra exatamente a mesma lista.
 */
export default function ProductList() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const busca = params.get('busca') ?? '';
  const categoria = params.get('categoria') ?? '';
  const ordem = params.get('ordem') ?? ORDEM_PADRAO;
  const soEsgotados = params.get('esgotados') === '1';
  const pagina = Math.max(1, Number.parseInt(params.get('pagina'), 10) || 1);
  const temFiltros = Boolean(busca || categoria || soEsgotados);

  const atualizarUrl = (mudancas) => {
    setParams(
      (atual) => {
        const proximo = new URLSearchParams(atual);
        Object.entries(mudancas).forEach(([chave, valor]) => {
          if (valor === '' || valor === null || valor === undefined || valor === false) proximo.delete(chave);
          else proximo.set(chave, String(valor));
        });
        // Mudou filtro ou ordem → volta para a primeira página.
        if (!('pagina' in mudancas)) proximo.delete('pagina');
        if (proximo.get('ordem') === ORDEM_PADRAO) proximo.delete('ordem');
        if (proximo.get('pagina') === '1') proximo.delete('pagina');
        return proximo;
      },
      { replace: true }
    );
  };

  // A busca digitada só vai para a URL (e para a API) depois de uma pausa.
  const [textoBusca, setTextoBusca] = useState(busca);
  const buscaAtrasada = useDebouncedValue(textoBusca, 350);
  useEffect(() => {
    if (buscaAtrasada.trim() !== busca) atualizarUrl({ busca: buscaAtrasada.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaAtrasada]);
  // E o caminho inverso: "Limpar filtros" ou o botão voltar mudam a URL.
  useEffect(() => {
    if (busca !== textoBusca.trim()) setTextoBusca(busca);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const filtrosApi = {
    search: busca,
    category: categoria,
    inStock: soEsgotados ? false : undefined,
    sort: ordem,
  };

  const produtos = useRequest(
    (signal) => listProducts({ ...filtrosApi, page: pagina, limit: PAGE_SIZE }, { signal }),
    [busca, categoria, ordem, soEsgotados, pagina]
  );
  const categorias = useRequest((signal) => listCategories({ signal }), []);

  const itens = produtos.data?.items;
  const total = produtos.data?.total ?? 0;

  // Página que deixou de existir (ex.: link antigo, ou exclusões em outra aba).
  useEffect(() => {
    if (itens && itens.length === 0 && total > 0 && pagina > 1) {
      atualizarUrl({ pagina: Math.ceil(total / PAGE_SIZE) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itens, total, pagina]);

  // Destaque do produto recém-salvo, vindo da tela de formulário.
  const destaque = location.state?.destaque;
  useEffect(() => {
    if (!destaque) return undefined;
    const timer = setTimeout(() => {
      navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
    }, 4000);
    return () => clearTimeout(timer);
  }, [destaque, location.pathname, location.search, navigate]);

  // ── Exclusão ────────────────────────────────────────────────────────────
  const [paraExcluir, setParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState('');

  const fecharExclusao = () => {
    setParaExcluir(null);
    setErroExclusao('');
  };

  /** Depois de excluir: lista e indicadores voltam a refletir o banco. */
  const sincronizar = () => {
    if (itens?.length === 1 && pagina > 1) atualizarUrl({ pagina: pagina - 1 });
    else produtos.reload();
    categorias.reload();
  };

  const confirmarExclusao = async () => {
    const produto = paraExcluir;
    setExcluindo(true);
    setErroExclusao('');
    try {
      await deleteProduct(produto.id);
      toast.success(`“${produto.name}” foi excluído.`);
      fecharExclusao();
      sincronizar();
    } catch (erro) {
      if (erro.status === 404) {
        // Alguém excluiu antes: o objetivo do usuário já foi atingido.
        toast.info(`“${produto.name}” já tinha sido excluído.`);
        fecharExclusao();
        sincronizar();
      } else {
        setErroExclusao(erro.message);
      }
    } finally {
      setExcluindo(false);
    }
  };

  // ── Exportação ──────────────────────────────────────────────────────────
  const [exportando, setExportando] = useState(false);

  const exportar = async () => {
    setExportando(true);
    try {
      // Sem page/limit a API devolve TODOS os produtos que atendem aos filtros.
      const { items } = await listProducts(filtrosApi);
      const hoje = new Date().toISOString().slice(0, 10);
      downloadCsv(productsToCsv(items), `catalogo-${hoje}.csv`);
      toast.success(`${plural(items.length, 'produto')} exportado${items.length === 1 ? '' : 's'}.`);
    } catch (erro) {
      toast.error(`Não foi possível exportar: ${erro.message}`);
    } finally {
      setExportando(false);
    }
  };

  const voltarPara = { voltarPara: `${location.pathname}${location.search}` };
  const limparFiltros = () => {
    setTextoBusca('');
    atualizarUrl({ busca: '', categoria: '', esgotados: '' });
  };

  let corpo;
  if (produtos.error) {
    corpo = (
      <Erro
        titulo="Não foi possível carregar os produtos"
        texto={produtos.error.message}
        aoTentar={produtos.reload}
      />
    );
  } else if (itens && itens.length === 0 && !produtos.loading) {
    corpo = temFiltros ? (
      <Vazio
        titulo="Nenhum produto encontrado"
        descricao="Nenhum produto atende à busca e aos filtros atuais."
        acao={
          <button type="button" className="botao botao--fantasma" onClick={limparFiltros}>
            Limpar filtros
          </button>
        }
      />
    ) : (
      <Vazio
        titulo="Nenhum produto cadastrado"
        descricao="Cadastre o primeiro produto para começar o catálogo."
        acao={
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
          loading={produtos.loading}
          deletingId={excluindo ? paraExcluir?.id : null}
          highlightId={destaque}
          onDelete={setParaExcluir}
          linkState={voltarPara}
        />
        <Pagination
          page={pagina}
          pageSize={PAGE_SIZE}
          total={total}
          onChange={(p) => atualizarUrl({ pagina: p })}
        />
      </>
    );
  }

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
            onClick={exportar}
            disabled={exportando || total === 0}
          >
            {exportando ? 'Exportando…' : 'Exportar CSV'}
          </button>
          <Link to="/produtos/novo" state={voltarPara} className="botao botao--primario">
            + Novo produto
          </Link>
        </div>
      </div>

      <SummaryCards
        categories={categorias.data}
        loading={categorias.loading}
        error={categorias.error}
        outOfStockActive={soEsgotados}
        onShowOutOfStock={() => atualizarUrl({ esgotados: soEsgotados ? '' : '1' })}
      />

      <section className="painel" aria-labelledby="titulo-lista">
        <h2 id="titulo-lista" className="sr-only">
          Lista de produtos
        </h2>
        <ProductFilters
          search={textoBusca}
          onSearchChange={setTextoBusca}
          category={categoria}
          onCategoryChange={(valor) => atualizarUrl({ categoria: valor })}
          categories={categorias.data}
          sort={ordem}
          onSortChange={(valor) => atualizarUrl({ ordem: valor })}
          onlyOutOfStock={soEsgotados}
          onOnlyOutOfStockChange={(marcado) => atualizarUrl({ esgotados: marcado ? '1' : '' })}
          hasFilters={temFiltros}
          onClear={limparFiltros}
        />
        <p className="sr-only" aria-live="polite">
          {produtos.error
            ? 'Erro ao carregar os produtos.'
            : produtos.loading
              ? 'Carregando produtos…'
              : `${plural(total, 'produto encontrado', 'produtos encontrados')}.`}
        </p>
        {corpo}
      </section>

      <ConfirmDialog
        open={Boolean(paraExcluir)}
        title="Excluir produto?"
        confirmLabel="Excluir"
        busyLabel="Excluindo…"
        busy={excluindo}
        error={erroExclusao}
        onConfirm={confirmarExclusao}
        onCancel={fecharExclusao}
      >
        {paraExcluir ? (
          <p>
            <strong>{paraExcluir.name}</strong> ({paraExcluir.category} · {formatCurrency(paraExcluir.price)})
            será removido do catálogo. Esta ação não pode ser desfeita.
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
