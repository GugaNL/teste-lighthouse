import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ProductForm from '../components/ProductForm';
import { EmptyState, ErrorState, Loading } from '../components/Feedback';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useCategoriesQuery, useProductQuery, useUpdateProduct } from '../queries/productQueries';
import { toApiError } from '../services/api';
import type { ApiError } from '../services/api';
import { readRouteState } from '../types/navigation';
import type { ProductRouteState } from '../types/navigation';
import type { Product, ProductInput } from '../types/product';
import { formatDateTime } from '../utils/format';

export default function ProductEdit() {
  useDocumentTitle('Editar produto');
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const voltarPara = readRouteState(location.state).returnTo ?? '/';

  const produto = useProductQuery(id);
  const categorias = useCategoriesQuery();
  const atualizacao = useUpdateProduct();

  // Conflito de edição (412): outra pessoa salvou este produto depois que o
  // formulário foi aberto. O usuário decide: recarregar ou sobrescrever.
  const [conflito, setConflito] = useState<ApiError | null>(null);
  const [sobrescrevendo, setSobrescrevendo] = useState(false);
  const ultimoEnvio = useRef<ProductInput | null>(null);

  const concluir = (atualizado: Product) => {
    toast.success(`“${atualizado.name}” atualizado com sucesso.`);
    const destaque: ProductRouteState = { highlightId: atualizado.id };
    navigate(voltarPara, { state: destaque });
  };

  const salvar = async (payload: ProductInput) => {
    ultimoEnvio.current = payload;
    try {
      concluir(await atualizacao.mutateAsync({ id, input: payload, version: produto.data?.version }));
    } catch (falha) {
      const erro = toApiError(falha);
      if (erro.status === 412) {
        setConflito(erro);
        return;
      }
      throw erro;
    }
  };

  const sobrescrever = async () => {
    if (!ultimoEnvio.current || !conflito) return;
    setSobrescrevendo(true);
    try {
      concluir(
        await atualizacao.mutateAsync({ id, input: ultimoEnvio.current, version: conflito.currentVersion })
      );
    } catch (falha) {
      const erro = toApiError(falha);
      if (erro.status === 412) setConflito(erro);
      else toast.error(erro.message);
    } finally {
      setSobrescrevendo(false);
    }
  };

  const recarregar = () => {
    setConflito(null);
    void produto.refetch();
  };

  if (produto.isError) {
    return (
      <>
        <PageHeader title="Editar produto" backTo={voltarPara} />
        <section className="painel painel--formulario">
          {produto.error.status === 404 ? (
            <EmptyState
              title="Produto não encontrado"
              description="Ele pode ter sido excluído por outra pessoa."
              action={
                <Link to="/" className="botao botao--primario">
                  Voltar para produtos
                </Link>
              }
            />
          ) : (
            <ErrorState
              title="Não foi possível carregar o produto"
              text={produto.error.message}
              onRetry={() => void produto.refetch()}
            />
          )}
        </section>
      </>
    );
  }

  if (!produto.data || !produto.isFetchedAfterMount) {
    return (
      <>
        <PageHeader title="Editar produto" backTo={voltarPara} />
        <section className="painel painel--formulario">
          <Loading text="Carregando produto…" />
        </section>
      </>
    );
  }

  const atual = produto.data;
  // Se a versão nova já chegou (recarregou), o formulário mostra o estado atual
  // e não há mais conflito para avisar.
  const emConflito = conflito && conflito.currentVersion !== atual.version;
  const avisoConflito = emConflito ? (
    <div className="alerta alerta--aviso" role="alert">
      <p>
        <strong>Conflito de edição.</strong> {conflito.message} Recarregar descarta o que você digitou aqui.
      </p>
      <div className="alerta__acoes">
        <button
          type="button"
          className="botao botao--fantasma botao--pequeno"
          onClick={recarregar}
          disabled={sobrescrevendo}
        >
          Recarregar versão atual
        </button>
        <button
          type="button"
          className="botao botao--perigo botao--pequeno"
          onClick={sobrescrever}
          disabled={sobrescrevendo}
        >
          {sobrescrevendo ? 'Salvando…' : 'Salvar minha versão mesmo assim'}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <PageHeader
        title="Editar produto"
        subtitle={`Última atualização em ${formatDateTime(atual.updatedAt)}.`}
        backTo={voltarPara}
      />
      <section className="painel painel--formulario">
        {/* A chave remonta o formulário quando chega uma versão nova do produto. */}
        <ProductForm
          key={`${atual.id}-${atual.version}`}
          initialProduct={atual}
          categories={categorias.data?.map((c) => c.name) ?? []}
          submitLabel="Salvar alterações"
          onSubmit={salvar}
          onCancel={() => navigate(voltarPara)}
          alert={avisoConflito}
        />
      </section>
    </>
  );
}
