import { useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ProductForm from '../components/ProductForm';
import { useToast } from '../context/toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useCategoriesQuery, useCreateProduct } from '../queries/productQueries';
import { readRouteState } from '../types/navigation';
import type { ProductRouteState } from '../types/navigation';
import type { ProductInput } from '../types/product';

export default function ProductCreate() {
  useDocumentTitle('Novo produto');
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const voltarPara = readRouteState(location.state).returnTo ?? '/';

  const categorias = useCategoriesQuery();
  const criacao = useCreateProduct();

  const salvar = async (payload: ProductInput) => {
    const criado = await criacao.mutateAsync(payload);
    toast.success(`“${criado.name}” cadastrado com sucesso.`);
    const destaque: ProductRouteState = { highlightId: criado.id };
    navigate(voltarPara, { state: destaque });
  };

  return (
    <>
      <PageHeader title="Novo produto" subtitle="Campos com * são obrigatórios." backTo={voltarPara} />
      <section className="painel painel--formulario">
        <ProductForm
          categories={categorias.data?.map((c) => c.name) ?? []}
          submitLabel="Cadastrar produto"
          submittingLabel="Cadastrando…"
          onSubmit={salvar}
          onCancel={() => navigate(voltarPara)}
        />
      </section>
    </>
  );
}
