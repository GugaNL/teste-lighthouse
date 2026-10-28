/**
 * Regras do produto no frontend — espelho de backend/src/app/rules/product.js
 * e do Joi da API.
 *
 * A API continua sendo a autoridade (ela valida de novo e responde 400); estas
 * regras existem para o usuário ver o erro ao sair do campo, sem esperar a ida
 * ao servidor. Se uma regra mudar lá, muda aqui — os testes dos dois lados
 * usam os mesmos casos-limite e as mesmas mensagens.
 */

export const LIMITS = Object.freeze({
  name: { min: 3, max: 120 },
  description: { max: 1000 },
  category: { max: 60 },
  price: { max: 999_999_999.99 },
  stock: { max: 999_999_999 },
});

export const LOW_STOCK_THRESHOLD = 5;

const temNoMaximoDuasCasas = (valor) => Math.abs(Math.round(valor * 100) - valor * 100) < 1e-6;
const normalizar = (texto) => (texto ?? '').trim().replace(/\s+/g, ' ');

/** Valida um campo. Devolve a mensagem de erro ou '' se estiver ok. */
export function validateField(campo, valores) {
  const valor = valores[campo];

  switch (campo) {
    case 'name': {
      const nome = normalizar(valor);
      if (!nome) return 'Nome é obrigatório';
      if (nome.length < LIMITS.name.min) return `Nome deve ter pelo menos ${LIMITS.name.min} caracteres`;
      if (nome.length > LIMITS.name.max) return `Nome deve ter no máximo ${LIMITS.name.max} caracteres`;
      return '';
    }
    case 'description':
      return (valor ?? '').trim().length > LIMITS.description.max
        ? `Descrição deve ter no máximo ${LIMITS.description.max} caracteres`
        : '';
    case 'price':
      if (valor === null || valor === undefined || valor === '') return 'Preço é obrigatório';
      if (!Number.isFinite(valor)) return 'Preço deve ser um número';
      if (valor <= 0) return 'Preço deve ser maior que zero';
      if (valor > LIMITS.price.max) return 'Preço acima do limite permitido';
      if (!temNoMaximoDuasCasas(valor)) return 'Preço deve ter no máximo 2 casas decimais';
      return '';
    case 'stock': {
      if (valor === null || valor === undefined || String(valor).trim() === '') {
        return 'Estoque é obrigatório';
      }
      const numero = Number(valor);
      if (!Number.isFinite(numero)) return 'Estoque deve ser um número';
      if (!Number.isInteger(numero)) return 'Estoque deve ser um número inteiro';
      if (numero < 0) return 'Estoque não pode ser negativo';
      if (numero > LIMITS.stock.max) return 'Estoque acima do limite permitido';
      return '';
    }
    case 'category': {
      const categoria = normalizar(valor);
      if (!categoria) return 'Categoria é obrigatória';
      if (categoria.length > LIMITS.category.max) {
        return `Categoria deve ter no máximo ${LIMITS.category.max} caracteres`;
      }
      return '';
    }
    default:
      return '';
  }
}

export const PRODUCT_FIELDS = ['name', 'description', 'price', 'stock', 'category'];

/** Valida o formulário inteiro: { campo: mensagem } só com os campos inválidos. */
export function validateProduct(valores) {
  return Object.fromEntries(
    PRODUCT_FIELDS.map((campo) => [campo, validateField(campo, valores)]).filter(([, erro]) => erro)
  );
}

/** Valores do formulário → corpo da requisição (tipos certos, texto normalizado). */
export function toPayload(valores) {
  return {
    name: normalizar(valores.name),
    description: (valores.description ?? '').trim(),
    price: valores.price,
    stock: Number(valores.stock),
    category: normalizar(valores.category),
  };
}

/** Produto da API → valores iniciais do formulário (vazio quando é criação). */
export function toFormValues(produto) {
  return {
    name: produto?.name ?? '',
    description: produto?.description ?? '',
    price: produto?.price ?? null,
    stock: produto?.stock === undefined || produto?.stock === null ? '' : String(produto.stock),
    category: produto?.category ?? '',
  };
}

/** Situação do estoque para o selo da listagem. */
export function stockStatus(stock) {
  if (stock <= 0) return { key: 'esgotado', label: 'Esgotado' };
  if (stock <= LOW_STOCK_THRESHOLD) return { key: 'baixo', label: 'Estoque baixo' };
  return { key: 'ok', label: 'Em estoque' };
}
