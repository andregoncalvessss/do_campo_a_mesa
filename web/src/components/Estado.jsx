// Pequenos componentes partilhados: "a carregar", erro e estrelas
export function Carregar({ aCarregar, erro, children }) {
  if (erro) return <div className="alert alert-danger" role="alert">{erro}</div>;
  if (aCarregar) return <p className="texto-secundario" role="status">A carregar…</p>;
  return children;
}

export function Estrelas({ valor = 0 }) {
  const cheias = Math.round(valor);
  return (
    <span className="estrelas" role="img" aria-label={`${valor} em 5 estrelas`}>
      {'★'.repeat(cheias)}<span className="estrelas__vazia">{'★'.repeat(5 - cheias)}</span>
    </span>
  );
}
