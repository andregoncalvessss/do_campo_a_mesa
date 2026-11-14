// Carrinho (comprador): quantidades, modo de entrega e confirmação da encomenda
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import Icone from '../components/Icone.jsx';
import { euro } from '../utils/formato.js';

export default function Carrinho() {
  const { token } = useAuth();
  const { linhas, total, alterarQuantidade, remover, esvaziar } = useCarrinho();
  const navigate = useNavigate();
  const [entrega, setEntrega] = useState({ tipo: 'levantamento', morada: '' });
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  const numProdutores = new Set(linhas.map((l) => l.produto.produtor?._id || l.produto.produtor)).size;

  async function encomendar(e) {
    e.preventDefault();
    setAEnviar(true);
    try {
      const criadas = await api('/orders', {
        metodo: 'POST',
        token,
        corpo: { linhas: linhas.map((l) => ({ produto: l.produto._id, quantidade: l.quantidade })), entrega }
      });
      esvaziar();
      navigate('/encomendas', { state: { criadas: criadas.length } });
    } catch (err) {
      setErro(err.message); // ex.: 409 "Stock insuficiente: Kiwi Hayward"
      setAEnviar(false);
    }
  }

  if (!linhas.length) {
    return (
      <div className="text-center py-5">
        <h1 className="h2">O carrinho está vazio</h1>
        <p className="texto-secundario">Adicione produtos a partir do catálogo.</p>
        <Link to="/" className="btn btn-success">Explorar produtos</Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="h2 mb-3">Carrinho</h1>
      <div className="painel-colunas">
        <section className="cartao" aria-label="Artigos no carrinho">
          {linhas.map(({ produto, quantidade }) => (
            <div key={produto._id} className="linha-carrinho">
              <div>
                <strong>{produto.nome}</strong>
                <div className="small texto-secundario">{produto.produtor?.nome} · {euro(produto.preco)} / {produto.unidade}</div>
              </div>
              <div>
                <label htmlFor={`q-${produto._id}`} className="visually-hidden">Quantidade de {produto.nome}</label>
                <input id={`q-${produto._id}`} type="number" min="1" step="1" className="form-control form-control-sm"
                  value={quantidade} onChange={(e) => alterarQuantidade(produto._id, Math.max(1, Math.floor(Number(e.target.value)) || 1))} />
              </div>
              <strong>{euro(produto.preco * quantidade)}</strong>
              <button type="button" className="btn btn-outline-danger btn-sm" aria-label={`Remover ${produto.nome}`} onClick={() => remover(produto._id)}>
                <Icone nome="lixo" tamanho={16} />
              </button>
            </div>
          ))}
        </section>

        <form className="cartao d-grid gap-3" onSubmit={encomendar}>
          <h2 className="h5 mb-0">Entrega</h2>
          {erro && <div className="alert alert-danger mb-0" role="alert">{erro}</div>}
          <fieldset>
            <legend className="visually-hidden">Modo de entrega</legend>
            {[['levantamento', 'Levantar na quinta'], ['entrega', 'Entrega na morada']].map(([valor, texto]) => (
              <div className="form-check" key={valor}>
                <input type="radio" className="form-check-input" name="tipo" id={`tipo-${valor}`} value={valor}
                  checked={entrega.tipo === valor} onChange={(e) => setEntrega((t) => ({ ...t, tipo: e.target.value }))} />
                <label className="form-check-label" htmlFor={`tipo-${valor}`}>{texto}</label>
              </div>
            ))}
          </fieldset>
          {entrega.tipo === 'entrega' && (
            <div>
              <label htmlFor="morada" className="form-label">Morada</label>
              <input id="morada" className="form-control" autoComplete="street-address" maxLength={200} required
                value={entrega.morada} onChange={(e) => setEntrega((t) => ({ ...t, morada: e.target.value }))} />
            </div>
          )}
          <div className="d-flex justify-content-between fs-5">
            <span>Total</span><strong>{euro(total)}</strong>
          </div>
          {numProdutores > 1 && (
            <p className="small texto-secundario mb-0">Os artigos são de {numProdutores} produtores: será criada uma encomenda para cada um.</p>
          )}
          <button type="submit" className="btn btn-success btn-lg" disabled={aEnviar}>{aEnviar ? 'A enviar…' : 'Confirmar encomenda'}</button>
        </form>
      </div>
    </>
  );
}
