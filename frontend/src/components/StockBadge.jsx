import { formatNumber } from '../utils/format';
import { stockStatus } from '../utils/productRules';

/** Quantidade em estoque + selo de situação (texto, não só cor). */
export default function StockBadge({ stock }) {
  const situacao = stockStatus(stock);
  return (
    <span className="estoque">
      <span className="estoque__numero">{formatNumber(stock)}</span>
      <span className={`selo selo--${situacao.key}`}>{situacao.label}</span>
    </span>
  );
}
