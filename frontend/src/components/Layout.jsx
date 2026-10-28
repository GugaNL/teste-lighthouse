import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Layout() {
  const location = useLocation();
  // Da listagem, volta para ela com os mesmos filtros; de um formulário,
  // herda o destino de volta que ele já tinha.
  const voltarPara =
    location.pathname === '/' ? `${location.pathname}${location.search}` : (location.state?.voltarPara ?? '/');

  return (
    <div className="app">
      <a href="#conteudo" className="pular-para-conteudo">
        Pular para o conteúdo
      </a>
      <header className="topo">
        <div className="topo__interno">
          <Link to="/" className="topo__marca">
            <img src="/favicon.svg" alt="" width="32" height="32" />
            <span>
              <strong>Codex Catálogo</strong>
              <small>Gestão de produtos</small>
            </span>
          </Link>
          <nav className="topo__nav" aria-label="Principal">
            <NavLink to="/" end className={({ isActive }) => `topo__link ${isActive ? 'is-ativo' : ''}`}>
              Produtos
            </NavLink>
            <a href={`${API_URL}/docs`} className="topo__link" target="_blank" rel="noreferrer">
              API
            </a>
            <Link to="/produtos/novo" state={{ voltarPara }} className="botao botao--primario botao--pequeno">
              + Novo produto
            </Link>
          </nav>
        </div>
      </header>

      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="rodape">
        Codex Catálogo · React + Node.js + MongoDB ·{' '}
        <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer">
          Documentação da API
        </a>
      </footer>
    </div>
  );
}
