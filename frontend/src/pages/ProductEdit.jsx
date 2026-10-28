import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ProductForm from '../components/ProductForm';
import { Carregando, Erro, Vazio } from '../components/Estado';
import { useRequest } from '../hooks/useRequest';
import { useToast } from '../context/ToastContext';
import { getProduct, listCategories, updateProduct } from '../services/productService';
import { formatDateTime } from '../utils/format';

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const voltarPara = location.state?.voltarPara ?? '/';

  const produto = useRequest((signal) => getProduct(id, { signal }), [id]);
  const categorias = useRequest((signal) => listCategories({ signal }), []);

  // Conflito de edição (412): outra pessoa salvou este produto depois que o
  // formulário foi aberto. O usuário decide: recarregar ou sobrescrever.
  const [conflito, setConflito] = useState(null);
  const [sobrescrevendo, setSobrescrevendo] = useState(false);
  const ultimoEnvio = useRef(null);

  const concluir = (atualizado) => {
    toast.success(`“${atualizado.name}” atualizado com sucesso.`);
    navigate(voltarPara, { state: { destaque: atualizado.id } });
  };

  const salvar = async (payload) => {
    ultimoEnvio.current = payload;
    try {
      concluir(await updateProduct(id, payload, produto.data.version));
    } catch (erro) {
      if (erro.status === 412) {
        setConflito(erro);
        return;
      }
      throw erro;
    }
  };

  const sobrescrever = async () => {
    setSobrescrevendo(true);
    try {
      concluir(await updateProduct(id, ultimoEnvio.current, conflito.currentVersion));
    } catch (erro) {
      if (erro.status === 412) setConflito(erro);
      else toast.error(erro.message);
    } finally {
      setSobrescrevendo(false);
    }
  };

  const recarregar = () => {
    setConflito(null);
    produto.reload();
  };

  if (produto.loading && !produto.data) {
    return (
      <>
        <PageHeader title="Editar produto" backTo={voltarPara} />
        <section className="painel painel--formulario">
          <Carregando texto="Carregando produto…" />
        </section>
      </>
    );
  }

  if (produto.error) {
    return (
      <>
        <PageHeader title="Editar produto" backTo={voltarPara} />
        <section className="painel painel--formulario">
          {produto.error.status === 404 ? (
            <Vazio
              titulo="Produto não encontrado"
              descricao="Ele pode ter sido excluído por outra pessoa."
              acao={
                <Link to="/" className="botao botao--primario">
                  Voltar para produtos
                </Link>
              }
            />
          ) : (
            <Erro
              titulo="Não foi possível carregar o produto"
              texto={produto.error.message}
              aoTentar={produto.reload}
            />
          )}
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
        <strong>Conflito de edição.</strong> {conflito.message}
      </p>
      <div className="alerta__acoes">
        <button type="button" className="botao botao--fantasma botao--pequeno" onClick={recarregar} disabled={sobrescrevendo}>
          Recarregar versão atual
        </button>
        <button type="button" className="botao botao--perigo botao--pequeno" onClick={sobrescrever} disabled={sobrescrevendo}>
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
