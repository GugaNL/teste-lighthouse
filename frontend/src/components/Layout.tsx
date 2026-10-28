import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
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
  const mainRef = useFocusOnNavigation();
  const novoProduto: ProductRouteState = {
    returnTo:
      location.pathname === '/'
        ? `${location.pathname}${location.search}`
        : (readRouteState(location.state).returnTo ?? '/'),
  };

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
            <Link to="/produtos/novo" state={novoProduto} className="botao botao--primario botao--pequeno">
              + Novo produto
            </Link>
          </nav>
        </div>
      </header>

      <main id="conteudo" ref={mainRef} className="conteudo" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="rodape">
        Codex Catálogo · React + Node.js + MongoDB ·{' '}
        <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer">
          Documentação da API
        </a>
      </footer>

      <ScrollRestoration />
    </div>
  );
}
