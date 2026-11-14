// Painel do produtor: indicadores, encomendas (mudança de estado), leilão ativo e stock baixo
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useEventoSocket } from '../../context/SocketContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import CartaoLeilao from '../../components/CartaoLeilao.jsx';
import { Carregar } from '../../components/Estado.jsx';
import { ESTADOS, data, euro, refEncomenda } from '../../utils/formato.js';

function PaginaPublica() {
  const { utilizador, token, atualizar } = useAuth();
  const p = utilizador.produtor || {};
  const [dados, setDados] = useState({
    nomeExploracao: p.nomeExploracao || '', localidade: p.localidade || '', descricao: p.descricao || '',
    lat: p.localizacao?.lat ?? '', lng: p.localizacao?.lng ?? ''
  });
  const [mensagem, setMensagem] = useState(null);
  const mudar = (campo) => (e) => setDados((d) => ({ ...d, [campo]: e.target.value }));

  async function guardar(e) {
    e.preventDefault();
    try {
      const { lat, lng, ...resto } = dados;
      await api('/producers/eu', {
        metodo: 'PUT', token,
        corpo: { ...resto, ...(lat !== '' && lng !== '' ? { localizacao: { lat: Number(lat), lng: Number(lng) } } : {}) }
      });
      await atualizar();
      setMensagem({ tipo: 'success', texto: 'Página pública atualizada.' });
    } catch (err) {
      setMensagem({ tipo: 'danger', texto: err.message });
    }
  }

  return (
    <form className="cartao d-grid gap-2" onSubmit={guardar} aria-labelledby="titulo-pagina-publica">
      <div className="d-flex justify-content-between align-items-baseline">
        <h2 id="titulo-pagina-publica" className="h6 mb-0">Página pública</h2>
        <Link to={`/produtores/${utilizador.id}`} className="small">Ver página</Link>
      </div>
      {mensagem && <div className={`alert alert-${mensagem.tipo} py-2 mb-0 small`} role="status">{mensagem.texto}</div>}
      <div>
        <label htmlFor="pp-nome" className="form-label small mb-1">Nome da exploração</label>
        <input id="pp-nome" className="form-control form-control-sm" value={dados.nomeExploracao} onChange={mudar('nomeExploracao')} required maxLength={100} />
      </div>
      <div>
        <label htmlFor="pp-localidade" className="form-label small mb-1">Localidade</label>
        <input id="pp-localidade" className="form-control form-control-sm" value={dados.localidade} onChange={mudar('localidade')} required maxLength={100} />
      </div>
      <div>
        <label htmlFor="pp-descricao" className="form-label small mb-1">Descrição</label>
        <textarea id="pp-descricao" className="form-control form-control-sm" rows="3" maxLength={1000} value={dados.descricao} onChange={mudar('descricao')} />
      </div>
      <div className="row g-2">
        <div className="col">
          <label htmlFor="pp-lat" className="form-label small mb-1">Latitude (mapa)</label>
          <input id="pp-lat" type="number" step="any" min="-90" max="90" className="form-control form-control-sm" value={dados.lat} onChange={mudar('lat')} />
        </div>
        <div className="col">
          <label htmlFor="pp-lng" className="form-label small mb-1">Longitude (mapa)</label>
          <input id="pp-lng" type="number" step="any" min="-180" max="180" className="form-control form-control-sm" value={dados.lng} onChange={mudar('lng')} />
        </div>
      </div>
      <button type="submit" className="btn btn-outline-success btn-sm">Guardar</button>
    </form>
  );
}

export default function PainelProdutor() {
  const { utilizador, token } = useAuth();
  const stats = useApi('/producers/eu/estatisticas');
  const encomendas = useApi('/orders');
  const leiloes = useApi(`/auctions?estado=ativo,agendado&produtor=${utilizador.id}`);
  const [erro, setErro] = useState('');
  const validado = utilizador.produtor?.validado;

  // Tempo real: nova encomenda ou leilão terminado -> recarrega os dados do painel
  const recarregarTudo = useCallback(() => { stats.recarregar(); encomendas.recarregar(); leiloes.recarregar(); },
    [stats.recarregar, encomendas.recarregar, leiloes.recarregar]); // eslint-disable-line react-hooks/exhaustive-deps
  useEventoSocket('nova-encomenda', recarregarTudo);
  useEventoSocket('leilao-terminado', recarregarTudo);
  useEventoSocket('leilao-aberto', recarregarTudo);

  async function mudarEstado(encomenda, estado) {
    try {
      const o = await api(`/orders/${encomenda._id}/estado`, { metodo: 'PATCH', token, corpo: { estado } });
      encomendas.setDados((lista) => lista.map((x) => (x._id === o._id ? { ...x, estado: o.estado } : x)));
      stats.recarregar();
      setErro('');
    } catch (err) {
      setErro(err.message); // ex.: 409 "O estado só pode avançar"
    }
  }

  const s = stats.dados;
  const hoje = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <header className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
        <div>
          <p className="small texto-secundario mb-0">{hoje}</p>
          <h1 className="h2 mb-0">Olá, {utilizador.produtor?.nomeExploracao || utilizador.nome}</h1>
        </div>
        <div className="d-flex gap-2">
          <Link to="/produtor/produtos" className="btn btn-outline-success btn-sm">Gerir produtos</Link>
          <Link to="/produtor/leiloes/novo" className="btn btn-success btn-sm">Criar leilão</Link>
        </div>
      </header>

      {!validado && (
        <div className="alert alert-warning" role="status">
          A sua conta está a aguardar validação do administrador. Até lá não pode publicar produtos nem leilões.
        </div>
      )}

      <Carregar aCarregar={stats.aCarregar} erro={stats.erro}>
        {s && (
          <section className="indicadores mb-3" aria-label="Indicadores">
            <div className="indicador"><small>Vendas este mês</small><strong>{euro(s.vendasMes)}</strong><span className="nota nota--ok">{s.encomendasMes} encomendas</span></div>
            <div className="indicador"><small>Encomendas por tratar</small><strong>{s.encomendasPorTratar}</strong></div>
            <div className="indicador"><small>Produtos</small><strong>{s.produtosAtivos}</strong>{s.stockBaixo.length > 0 && <span className="nota">{s.stockBaixo.length} com stock baixo</span>}</div>
            <div className="indicador"><small>Avaliação média</small><strong>{s.avaliacaoMedia ? String(s.avaliacaoMedia).replace('.', ',') : '—'}</strong><span className="nota nota--ok">{s.numAvaliacoes} {s.numAvaliacoes === 1 ? "avaliação" : "avaliações"}</span></div>
          </section>
        )}
      </Carregar>

      <div className="painel-colunas">
        <section className="cartao" aria-labelledby="titulo-encomendas">
          <h2 id="titulo-encomendas" className="h6">Encomendas</h2>
          {erro && <div className="alert alert-danger py-2 small" role="alert">{erro}</div>}
          <Carregar aCarregar={encomendas.aCarregar} erro={encomendas.erro}>
            {encomendas.dados?.length === 0 && <p className="small texto-secundario mb-0">Ainda não recebeu encomendas.</p>}
            <table className="tabela-encomendas">
              <thead>
                <tr><th scope="col">N.º</th><th scope="col">Cliente e artigos</th><th scope="col">Entrega</th><th scope="col">Total</th><th scope="col">Estado</th></tr>
              </thead>
              <tbody>
                {encomendas.dados?.map((o) => {
                  const atual = ESTADOS.indexOf(o.estado);
                  return (
                    <tr key={o._id}>
                      <td><strong>{refEncomenda(o._id)}</strong></td>
                      <td>
                        <strong>{o.comprador?.nome}</strong>
                        <div className="small texto-secundario">{o.linhas.map((l) => `${l.quantidade} × ${l.nome}`).join(', ')} · {data(o.createdAt)}</div>
                      </td>
                      <td data-rotulo="Entrega">{o.entrega?.tipo === 'entrega' ? `Entrega · ${o.entrega.morada}` : 'Levantamento'}</td>
                      <td data-rotulo="Total"><strong>{euro(o.total)}</strong></td>
                      <td>
                        <label htmlFor={`estado-${o._id}`} className="visually-hidden">Estado da encomenda {refEncomenda(o._id)}</label>
                        {/* Só se oferecem os estados seguintes: o estado nunca recua */}
                        <select id={`estado-${o._id}`} className={`estado estado--${o.estado}`} value={o.estado}
                          disabled={atual === ESTADOS.length - 1} onChange={(e) => mudarEstado(o, e.target.value)}>
                          {ESTADOS.map((e, i) => <option key={e} value={e} disabled={i < atual}>{e}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Carregar>
        </section>

        <div className="d-grid gap-3">
          {leiloes.dados?.map((l) => <CartaoLeilao key={l._id} leilao={l} />)}
          {leiloes.dados?.length === 0 && (
            <div className="cartao small texto-secundario">Sem leilões ativos. <Link to="/produtor/leiloes/novo">Criar leilão</Link></div>
          )}

          <section className="cartao" aria-labelledby="titulo-stock">
            <h2 id="titulo-stock" className="h6">Stock baixo</h2>
            {s?.stockBaixo.length === 0 && <p className="small texto-secundario mb-0">Todos os produtos têm stock suficiente.</p>}
            <ul className="stock-baixo">
              {s?.stockBaixo.map((p) => <li key={p._id}><span>{p.nome}</span><strong>{p.stock} {p.unidade}</strong></li>)}
            </ul>
            <Link to="/produtor/produtos" className="small">Repor stock</Link>
          </section>

          <PaginaPublica />
        </div>
      </div>
    </>
  );
}
