import { z } from 'zod';
import { LIMITS, normalizeText } from '../utils/productRules';
import type { ProductField, ProductInput } from '../types/product';

export interface ProductFormValues {
  name: string;
  description: string;
  price: number | null;
  stock: string;
  category: string;
}

const temNoMaximoDuasCasas = (valor: number) => Math.abs(Math.round(valor * 100) - valor * 100) < 1e-6;

const numero = (obrigatorio: string, invalido: string) =>
  z.number({
    error: (problema) => (problema.input === null || problema.input === undefined ? obrigatorio : invalido),
  });

export const productFormSchema = z.object({
  name: z
    .string()
    .transform(normalizeText)
    .pipe(
      z
        .string()
        .min(1, 'Nome é obrigatório')
        .min(LIMITS.name.min, `Nome deve ter pelo menos ${LIMITS.name.min} caracteres`)
        .max(LIMITS.name.max, `Nome deve ter no máximo ${LIMITS.name.max} caracteres`)
    ),
  description: z
    .string()
    .trim()
    .max(LIMITS.description.max, `Descrição deve ter no máximo ${LIMITS.description.max} caracteres`),
  price: z
    .number({ error: 'Preço deve ser um número' })
    .nullable()
    .pipe(
      numero('Preço é obrigatório', 'Preço deve ser um número')
        .positive('Preço deve ser maior que zero')
        .max(LIMITS.price.max, 'Preço acima do limite permitido')
        .refine(temNoMaximoDuasCasas, 'Preço deve ter no máximo 2 casas decimais')
    ),
  stock: z
    .string()
    .trim()
    .min(1, 'Estoque é obrigatório')
    .transform(Number)
    .pipe(
      numero('Estoque é obrigatório', 'Estoque deve ser um número')
        .int('Estoque deve ser um número inteiro')
        .min(0, 'Estoque não pode ser negativo')
        .max(LIMITS.stock.max, 'Estoque acima do limite permitido')
    ),
  category: z
    .string()
    .transform(normalizeText)
    .pipe(
      z
        .string()
        .min(1, 'Categoria é obrigatória')
        .max(LIMITS.category.max, `Categoria deve ter no máximo ${LIMITS.category.max} caracteres`)
    ),
}) satisfies z.ZodType<ProductInput, ProductFormValues>;

export type ProductFormErrors = Partial<Record<ProductField, string>>;

export function validateProduct(valores: ProductFormValues): ProductFormErrors {
  const resultado = productFormSchema.safeParse(valores);
  if (resultado.success) return {};
  const erros: ProductFormErrors = {};
  for (const problema of resultado.error.issues) {
    const campo = problema.path[0] as ProductField;
    erros[campo] ??= problema.message;
  }
  return erros;
}
