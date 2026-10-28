import { Link } from 'react-router-dom';
import { Vazio } from '../components/Estado';

export default function NotFound() {
  return (
    <section className="painel painel--formulario">
      <Vazio
        titulo="Página não encontrada"
        descricao="O endereço acessado não existe neste catálogo."
        acao={
          <Link to="/" className="botao botao--primario">
            Ir para produtos
          </Link>
        }
      />
    </section>
  );
}
