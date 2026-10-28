/** Blocos de estado reaproveitados em todas as telas: carregando, erro e vazio. */

export function Carregando({ texto = 'Carregando…' }) {
  return (
    <div className="estado estado--carregando" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {texto}
    </div>
  );
}

export function Erro({ titulo = 'Algo deu errado', texto, aoTentar }) {
  return (
    <div className="estado estado--erro" role="alert">
      <strong>{titulo}</strong>
      {texto ? <p>{texto}</p> : null}
      {aoTentar ? (
        <button type="button" className="botao botao--fantasma" onClick={aoTentar}>
          Tentar de novo
        </button>
      ) : null}
    </div>
  );
}

export function Vazio({ titulo, descricao, acao }) {
  return (
    <div className="estado estado--vazio">
      <strong>{titulo}</strong>
      {descricao ? <p>{descricao}</p> : null}
      {acao}
    </div>
  );
}
