import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'codex-catalogo:tema';
const CONSULTA_ESCURO = '(prefers-color-scheme: dark)';
const COR_DO_TOPO: Record<Theme, string> = { light: '#0b2b40', dark: '#0a1f2e' };

const ehTema = (valor: unknown): valor is Theme => valor === 'light' || valor === 'dark';

function lerPreferencia(): Theme | null {
  try {
    const valor = window.localStorage.getItem(THEME_STORAGE_KEY);
    return ehTema(valor) ? valor : null;
  } catch {
    return null;
  }
}

function gravarPreferencia(tema: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, tema);
  } catch {
    return;
  }
}

const temaDoSistema = (): Theme =>
  typeof window.matchMedia === 'function' && window.matchMedia(CONSULTA_ESCURO).matches ? 'dark' : 'light';

export interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

export function useTheme(): ThemeState {
  const [preferencia, setPreferencia] = useState<Theme | null>(lerPreferencia);
  const [sistema, setSistema] = useState<Theme>(temaDoSistema);
  const theme = preferencia ?? sistema;

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const consulta = window.matchMedia(CONSULTA_ESCURO);
    const ouvir = (evento: MediaQueryListEvent) => setSistema(evento.matches ? 'dark' : 'light');
    consulta.addEventListener('change', ouvir);
    return () => consulta.removeEventListener('change', ouvir);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute('content', COR_DO_TOPO[theme]));
  }, [theme]);

  const toggleTheme = () => {
    const proximo: Theme = theme === 'dark' ? 'light' : 'dark';
    setPreferencia(proximo);
    gravarPreferencia(proximo);
  };

  return { theme, toggleTheme };
}
