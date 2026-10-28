import type { Product } from '../types/product';

/**
 * Exportação CSV no formato que o Excel em português abre direto:
 * separador ";" (a vírgula é o decimal), BOM UTF-8 (acentos) e aspas quando
 * o texto tem separador, aspas ou quebra de linha.
 */
const COLUNAS: ReadonlyArray<readonly [keyof Product, string]> = [
  ['name', 'Nome'],
  ['category', 'Categoria'],
  ['price', 'Preço'],
  ['stock', 'Estoque'],
  ['description', 'Descrição'],
  ['updatedAt', 'Atualizado em'],
];

const celula = (valor: Product[keyof Product] | null | undefined): string => {
  if (valor === null || valor === undefined) return '';
  const texto = typeof valor === 'number' ? String(valor).replace('.', ',') : String(valor);
  return /[;"\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

export function productsToCsv(produtos: Product[]): string {
  const cabecalho = COLUNAS.map(([, titulo]) => titulo).join(';');
  const linhas = produtos.map((p) => COLUNAS.map(([campo]) => celula(p[campo])).join(';'));
  return `\uFEFF${[cabecalho, ...linhas].join('\r\n')}`;
}

export function downloadCsv(conteudo: string, nomeArquivo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
