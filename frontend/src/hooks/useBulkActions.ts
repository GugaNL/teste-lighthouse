import { useState } from 'react';
import { useToast } from '../context/toast';
import { useChangeProductsCategory, useDeleteProducts, useRestoreProducts } from '../queries/productQueries';
import { toApiError } from '../services/api';
import { downloadCsv, productsToCsv } from '../utils/csv';
import { plural } from '../utils/format';
import { LIMITS, normalizeText } from '../utils/productRules';
import type { ProductSelection } from './useProductSelection';

export type BulkDialog = 'delete' | 'category' | null;

export interface BulkActions {
  dialog: BulkDialog;
  error: string;
  isBusy: boolean;
  category: string;
  setCategory: (categoria: string) => void;
  openDelete: () => void;
  openCategory: () => void;
  closeDialog: () => void;
  confirmDelete: () => Promise<void>;
  confirmCategory: () => Promise<void>;
  exportSelected: () => void;
}

const excluidos = (n: number) => `${plural(n, 'produto excluído', 'produtos excluídos')}.`;

export function useBulkActions(selecao: ProductSelection): BulkActions {
  const toast = useToast();
  const exclusao = useDeleteProducts();
  const restauracao = useRestoreProducts();
  const mudancaDeCategoria = useChangeProductsCategory();
  const [dialog, setDialog] = useState<BulkDialog>(null);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');

  const closeDialog = () => {
    setDialog(null);
    setError('');
  };

  const desfazer = (ids: string[]) => {
    restauracao.mutate(ids, {
      onSuccess: ({ restored }) =>
        toast.success(`${plural(restored, 'produto restaurado', 'produtos restaurados')}.`),
      onError: (erro) => toast.error(`Não foi possível desfazer: ${erro.message}`),
    });
  };

  const confirmDelete = async () => {
    const ids = selecao.ids;
    setError('');
    try {
      const { deleted } = await exclusao.mutateAsync(ids);
      toast.success(excluidos(deleted), { action: { label: 'Desfazer', onClick: () => desfazer(ids) } });
      selecao.clear();
      closeDialog();
    } catch (falha) {
      setError(toApiError(falha).message);
    }
  };

  const confirmCategory = async () => {
    const categoria = normalizeText(category);
    if (!categoria) {
      setError('Categoria é obrigatória');
      return;
    }
    if (categoria.length > LIMITS.category.max) {
      setError(`Categoria deve ter no máximo ${LIMITS.category.max} caracteres`);
      return;
    }
    setError('');
    try {
      const resultado = await mudancaDeCategoria.mutateAsync({ ids: selecao.ids, category: categoria });
      toast.success(
        `Categoria de ${plural(resultado.updated, 'produto')} alterada para “${resultado.category}”.`
      );
      selecao.clear();
      closeDialog();
    } catch (falha) {
      setError(toApiError(falha).message);
    }
  };

  const exportSelected = () => {
    const hoje = new Date().toISOString().slice(0, 10);
    downloadCsv(productsToCsv(selecao.selected), `catalogo-selecionados-${hoje}.csv`);
    const n = selecao.count;
    toast.success(`${plural(n, 'produto')} exportado${n === 1 ? '' : 's'}.`);
  };

  return {
    dialog,
    error,
    isBusy: exclusao.isPending || mudancaDeCategoria.isPending,
    category,
    setCategory,
    openDelete: () => setDialog('delete'),
    openCategory: () => {
      setCategory('');
      setDialog('category');
    },
    closeDialog,
    confirmDelete,
    confirmCategory,
    exportSelected,
  };
}
