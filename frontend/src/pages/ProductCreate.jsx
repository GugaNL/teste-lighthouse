import { useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ProductForm from '../components/ProductForm';
import { useRequest } from '../hooks/useRequest';
import { useToast } from '../context/ToastContext';
import { createProduct, listCategories } from '../services/productService';

export default function ProductCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const voltarPara = location.state?.voltarPara ?? '/';

  // Só alimenta as sugestões do campo categoria; se falhar, o campo continua livre.
  const categorias = useRequest((signal) => listCategories({ signal }), []);

  // Se a API recusar, o erro sobe para o ProductForm, que o mostra no campo certo.
  const salvar = async (payload) => {
    const criado = await createProduct(payload);
    toast.success(`“${criado.name}” cadastrado com sucesso.`);
    navigate(voltarPara, { state: { destaque: criado.id } });
  };

  return (
    <>
      <PageHeader
        title="Novo produto"
        subtitle="Campos com * são obrigatórios."
        backTo={voltarPara}
      />
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
