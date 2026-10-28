import { Link } from 'react-router-dom';
import { EmptyState } from '../components/Feedback';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Página não encontrada');
  return (
    <section className="painel painel--formulario">
      <h1 className="sr-only">Página não encontrada</h1>
      <EmptyState
        title="Página não encontrada"
        description="O endereço acessado não existe neste catálogo."
        action={
          <Link to="/" className="botao botao--primario">
            Ir para produtos
          </Link>
        }
      />
    </section>
  );
}
