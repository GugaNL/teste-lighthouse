import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const escuro = theme === 'dark';

  return (
    <button
      type="button"
      className="topo__tema"
      onClick={toggleTheme}
      aria-pressed={escuro}
      aria-label="Tema escuro"
      title={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
    >
      <span aria-hidden="true">{escuro ? '☀' : '☾'}</span>
    </button>
  );
}
