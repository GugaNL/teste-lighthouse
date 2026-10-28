import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { toApiError } from '../services/api';
import { listProducts } from '../services/productService';
import { downloadCsv, productsToCsv } from '../utils/csv';
import { plural } from '../utils/format';
import type { ProductFilters } from '../types/product';

export interface CsvExport {
  isExporting: boolean;
  exportCsv: () => Promise<void>;
}

export function useCsvExport(filtros: ProductFilters): CsvExport {
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportCsv = async () => {
    setIsExporting(true);
    try {
      // Sem page/limit a API devolve TODOS os produtos que atendem aos filtros.
      const { items } = await listProducts(filtros);
      const hoje = new Date().toISOString().slice(0, 10);
      downloadCsv(productsToCsv(items), `catalogo-${hoje}.csv`);
      toast.success(`${plural(items.length, 'produto')} exportado${items.length === 1 ? '' : 's'}.`);
    } catch (erro) {
      toast.error(`Não foi possível exportar: ${toApiError(erro).message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return { isExporting, exportCsv };
}
