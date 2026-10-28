import { Link } from 'react-router-dom';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
}

/** Cabeçalho das telas de formulário: voltar, título e subtítulo. */
export default function PageHeader({ title, subtitle, backTo = '/' }: PageHeaderProps) {
  return (
    <div className="pagina__cabecalho">
      <div>
        <Link to={backTo} className="pagina__voltar">
          ← Voltar para produtos
        </Link>
        <h1>{title}</h1>
        {subtitle ? <p className="pagina__subtitulo">{subtitle}</p> : null}
      </div>
    </div>
  );
}
