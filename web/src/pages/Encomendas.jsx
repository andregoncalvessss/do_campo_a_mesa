// Encomendas do comprador: linha temporal atualizada em tempo real e avaliação após a entrega
import { useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useEventoSocket } from '../context/SocketContext.jsx';
import { useApi } from '../hooks/useApi.js';
import EstadoEncomenda from '../components/EstadoEncomenda.jsx';
import { Carregar } from '../components/Estado.jsx';
import Icone from '../components/Icone.jsx';
import { data, euro, refEncomenda } from '../utils/formato.js';

function FormularioAvaliacao({ encomenda, onFeito }) {
  const { token } = useAuth();
  const [dados, setDados] = useState({ classificacao: 5, comentario: '', produto: '' });
  const [erro, setErro] = useState('');
  const idBase = `av-${encomenda._id}`;

  async function submeter(e) {
    e.preventDefault();
    try {
      await api('/reviews', {
        metodo: 'POST',
        token,
        corpo: { encomenda: encomenda._id, classificacao: Number(dados.classificacao), comentario: dados.comentario, produto: dados.produto || undefined }
      });
      onFeito();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <form className="d-grid gap-2 mt-3" onSubmit={submeter}>
      {erro && <div className="alert alert-danger py-2 mb-0 small" role="alert">{erro}</div>}
      <div className="row g-2">
        <div className="col-7">
          <label htmlFor={`${idBase}-sobre`} className="form-label small mb-1">Avaliar</label>
          <select id={`${idBase}-sobre`} className="form-select form-select-sm" value={dados.produto}
            onChange={(e) => setDados((d) => ({ ...d, produto: e.target.value }))}>
            <option value="">O produtor (geral)</option>
            {encomenda.linhas.filter((l) => l.produto).map((l) => <option key={l._id} value={l.produto}>{l.nome}</option>)}
          </select>
        </div>
        <div className="col-5">
          <label htmlFor={`${idBase}-nota`} className="form-label small mb-1">Classificação</label>
          <select id={`${idBase}-nota`} className="form-select form-select-sm" value={dados.classificacao}
            onChange={(e) => setDados((d) => ({ ...d, classificacao: e.target.value }))}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'estrela' : 'estrelas'}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor={`${idBase}-texto`} className="form-label small mb-1">Comentário</label>
        <textarea id={`${idBase}-texto`} className="form-control form-control-sm" rows="2" maxLength={500}
          value={dados.comentario} onChange={(e) => setDados((d) => ({ ...d, comentario: e.target.value }))} />
      </div>
      <button type="submit" className="btn btn-success btn-sm">Enviar avaliação</button>
    </form>
  );
}

export default function Encomendas() {
  const location = useLocation();
  const { dados, erro, aCarregar, setDados, recarregar } = useApi('/orders');
  const [aAvaliar, setAAvaliar] = useState(null);

  // Tempo real: o produtor muda o estado e a linha temporal atualiza sem refresh
  useEventoSocket('encomenda-atualizada', useCallback((e) => {
    setDados((lista) => lista?.map((o) => (o._id === e.id ? { ...o, estado: e.estado } : o)));
  }, [setDados]));
  // Um leilão ganho cria uma encomenda nova
  useEventoSocket('leilao-ganho', recarregar);

  return (
    <>
      <h1 className="h2 mb-3">Encomendas</h1>
      {location.state?.criadas && (
        <div className="alert alert-success" role="status">
          {location.state.criadas === 1 ? 'Encomenda registada.' : `${location.state.criadas} encomendas registadas (uma por produtor).`} O produtor já foi avisado.
        </div>
      )}
      <Carregar aCarregar={aCarregar} erro={erro}>
        {dados?.length === 0 && (
          <p className="texto-secundario">Ainda não fez encomendas. <Link to="/">Explorar produtos</Link></p>
        )}
        <div className="grelha-leiloes">
          {dados?.map((o) => (
            <article key={o._id} className="cartao">
              <header className="d-flex justify-content-between align-items-start gap-2 mb-3">
                <div>
                  <h2 className="h6 mb-0">{refEncomenda(o._id)}{o.origem === 'leilao' && <span className="etiqueta ms-2">Leilão</span>}</h2>
                  <span className="small texto-secundario">
                    <Link to={`/produtores/${o.produtor?._id}`} className="texto-secundario">{o.produtor?.nome}</Link> · {data(o.createdAt)}
                  </span>
                </div>
                <span className={`estado estado--${o.estado}`}>{o.estado}</span>
              </header>

              <EstadoEncomenda estado={o.estado} />

              <ul className="list-unstyled small mt-3 mb-2">
                {o.linhas.map((l) => (
                  <li key={l._id} className="d-flex justify-content-between gap-2">
                    <span>{l.quantidade} × {l.nome}</span><strong>{euro(l.precoUnit * l.quantidade)}</strong>
                  </li>
                ))}
                <li className="d-flex justify-content-between border-top pt-2 mt-2 fs-6"><strong>Total</strong><strong>{euro(o.total)}</strong></li>
              </ul>

              <p className="aviso-recolha mb-0">
                <Icone nome={o.entrega?.tipo === 'entrega' ? 'camiao' : 'pin'} tamanho={16} />
                {o.entrega?.tipo === 'entrega'
                  ? `Entrega em: ${o.entrega.morada}`
                  : `Levantar na quinta · ${o.produtor?.produtor?.nomeExploracao || o.produtor?.nome}, ${o.produtor?.produtor?.localidade || ''}`}
              </p>

              {o.estado === 'entregue' && !o.avaliada && aAvaliar !== o._id && (
                <button type="button" className="btn btn-outline-success btn-sm mt-3" onClick={() => setAAvaliar(o._id)}>Avaliar</button>
              )}
              {aAvaliar === o._id && (
                <FormularioAvaliacao encomenda={o} onFeito={() => {
                  setAAvaliar(null);
                  setDados((lista) => lista.map((x) => (x._id === o._id ? { ...x, avaliada: true } : x)));
                }} />
              )}
              {o.avaliada && <p className="small text-success mt-3 mb-0"><Icone nome="certo" tamanho={14} /> Avaliação enviada</p>}
            </article>
          ))}
        </div>
      </Carregar>
    </>
  );
}
