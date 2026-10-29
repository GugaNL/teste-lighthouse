import { useState } from 'react';
import { useToast } from '../context/toast';
import { useDeleteProduct, useRestoreProduct } from '../queries/productQueries';
import { toApiError } from '../services/api';
import type { Product } from '../types/product';

export interface ProductDeletion {
  target: Product | null;
  isDeleting: boolean;
  error: string;
  request: (produto: Product) => void;
  cancel: () => void;
  confirm: () => Promise<void>;
}

export function useProductDeletion(onDeleted: (produto: Product) => void): ProductDeletion {
  const toast = useToast();
  const exclusao = useDeleteProduct();
  const restauracao = useRestoreProduct();
  const [target, setTarget] = useState<Product | null>(null);
  const [error, setError] = useState('');

  const cancel = () => {
    setTarget(null);
    setError('');
  };

  const desfazer = (produto: Product) => {
    restauracao.mutate(produto.id, {
      onSuccess: () => toast.success(`“${produto.name}” foi restaurado.`),
      onError: (erro) => toast.error(`Não foi possível desfazer: ${erro.message}`),
    });
  };

  const confirm = async () => {
    if (!target) return;
    const produto = target;
    setError('');
    try {
      await exclusao.mutateAsync(produto.id);
      toast.success(`“${produto.name}” foi excluído.`, {
        action: { label: 'Desfazer', onClick: () => desfazer(produto) },
      });
      cancel();
      onDeleted(produto);
    } catch (falha) {
      const erro = toApiError(falha);
      if (erro.status === 404) {
        toast.info(`“${produto.name}” já tinha sido excluído.`);
        cancel();
        onDeleted(produto);
      } else {
        setError(erro.message);
      }
    }
  };

  return { target, isDeleting: exclusao.isPending, error, request: setTarget, cancel, confirm };
}
