import { formatNumber } from '../utils/format';
import { stockStatus } from '../utils/productRules';

export default function StockBadge({ stock }: { stock: number }) {
  const situacao = stockStatus(stock);
  return (
    <span className="estoque">
      <span className="estoque__numero">{formatNumber(stock)}</span>
      <span className={`selo selo--${situacao.key}`}>{situacao.label}</span>
    </span>
  );
}
