import { useState } from 'react';
import { useToast } from '../context/toast';
import { useDeleteProduct } from '../queries/productQueries';
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

export function useProductDeletion(onDeleted: () => void): ProductDeletion {
  const toast = useToast();
  const exclusao = useDeleteProduct();
  const [target, setTarget] = useState<Product | null>(null);
  const [error, setError] = useState('');

  const cancel = () => {
    setTarget(null);
    setError('');
  };

  const confirm = async () => {
    if (!target) return;
    setError('');
    try {
      await exclusao.mutateAsync(target.id);
      toast.success(`“${target.name}” foi excluído.`);
      cancel();
      onDeleted();
    } catch (falha) {
      const erro = toApiError(falha);
      if (erro.status === 404) {
        toast.info(`“${target.name}” já tinha sido excluído.`);
        cancel();
        onDeleted();
      } else {
        setError(erro.message);
      }
    }
  };

  return { target, isDeleting: exclusao.isPending, error, request: setTarget, cancel, confirm };
}
