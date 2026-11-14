// Componente reutilizável: usado no catálogo e na página do produtor
import { Link } from 'react-router-dom';
import { euro, semAcentos } from '../utils/formato.js';

export default function CartaoProduto({ produto, onAdicionar }) {
  const produtor = produto.produtor;
  return (
    <article className="card cartao-produto h-100">
      {produto.imagemUrl ? (
        <img src={produto.imagemUrl} className="cartao-produto__foto" alt={produto.nome} loading="lazy" />
      ) : (
        <div className={`cartao-produto__imagem cat-${semAcentos(produto.categoria || 'Outros')}`} aria-hidden="true">
          <span>{produto.nome.charAt(0)}</span>
        </div>
      )}
      <div className="card-body d-flex flex-column">
        <div className="d-flex gap-1 mb-2">
          {produto.biologico && <span className="etiqueta">BIO</span>}
          {produto.stock === 0 && <span className="etiqueta etiqueta--esgotado">ESGOTADO</span>}
        </div>
        <h3 className="h6 mb-1">{produto.nome}</h3>
        {produtor?._id && (
          <Link to={`/produtores/${produtor._id}`} className="small texto-secundario mb-2">
            {produtor.nome} · {produtor.produtor?.localidade}
          </Link>
        )}
        <p className="preco mt-auto mb-2">{euro(produto.preco)} <span className="texto-secundario small">/ {produto.unidade}</span></p>
        {onAdicionar && (
          <button type="button" className="btn btn-success w-100" onClick={onAdicionar} disabled={produto.stock === 0}>
            Adicionar ao carrinho
          </button>
        )}
      </div>
    </article>
  );
}
