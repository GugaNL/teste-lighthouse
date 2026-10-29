import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { readRouteState } from '../types/navigation';
import type { ProductRouteState } from '../types/navigation';

const API_URL = import.meta.env.VITE_API_URL || '';

function useFocusOnNavigation() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const anterior = useRef(pathname);

  useEffect(() => {
    if (anterior.current === pathname) return;
    anterior.current = pathname;
    const alvo = mainRef.current?.querySelector<HTMLElement>('h1') ?? mainRef.current;
    if (!alvo) return;
    if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1');
    alvo.focus({ preventScroll: true });
  }, [pathname]);

  return mainRef;
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useFocusOnNavigation();
  const novoProduto: ProductRouteState = {
    returnTo:
      location.pathname === '/'
        ? `${location.pathname}${location.search}`
        : (readRouteState(location.state).returnTo ?? '/'),
  };

  useKeyboardShortcut(
    'n',
    () => void navigate('/produtos/novo', { state: novoProduto }),
    location.pathname !== '/produtos/novo'
  );

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
              <strong>Catálogo de Produtos</strong>
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
            <ThemeToggle />
            <Link
              to="/produtos/novo"
              state={novoProduto}
              className="botao botao--primario botao--pequeno"
              aria-keyshortcuts="n"
            >
              + Novo produto
            </Link>
          </nav>
        </div>
      </header>

      <main id="conteudo" ref={mainRef} className="conteudo" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="rodape">
        Catálogo de Produtos · React + Node.js + MongoDB ·{' '}
        <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer">
          Documentação da API
        </a>
        <span className="rodape__atalhos">
          Atalhos: <kbd>/</kbd> buscar · <kbd>N</kbd> novo produto
        </span>
      </footer>

      <ScrollRestoration />
    </div>
  );
}
