// Painel do administrador: indicadores globais, validação de produtores, moderação e estado dos serviços
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, API_URL } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useEventoSocket, useSocket } from '../../context/SocketContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useContagem, formatarTempo } from '../../hooks/useContagem.js';
import { Carregar } from '../../components/Estado.jsx';
import Icone from '../../components/Icone.jsx';
import { data, dataHora, euro, iniciais, refEncomenda } from '../../utils/formato.js';

function LinhaLeilao({ leilao }) {
  const restante = useContagem(leilao.terminaEm);
  return (
    <li className="aviso-recolha d-block mb-2">
      <div className="d-flex justify-content-between gap-2">
        <Link to={`/leiloes/${leilao._id}`} className="fw-bold text-reset">{leilao.lote}</Link>
        <strong className="text-danger">{formatarTempo(restante)}</strong>
      </div>
      <div className="d-flex justify-content-between gap-2 texto-secundario">
        <span>{leilao.produtor?.nome}</span>
        <span>{euro(leilao.licitacaoAtual?.valor)} · {leilao.numLicitacoes} licitações</span>
      </div>
    </li>
  );
}

// Estado dos serviços: mede o tempo de resposta de /api/health e de /api-docs
function EstadoServicos({ resumo }) {
  const socket = useSocket();
  const [medidas, setMedidas] = useState({});

  useEffect(() => {
    let cancelado = false;
    async function medir(chave, url) {
      const inicio = performance.now();
      try {
        const r = await fetch(url);
        if (!cancelado) setMedidas((m) => ({ ...m, [chave]: { ok: r.ok, ms: Math.round(performance.now() - inicio) } }));
      } catch {
        if (!cancelado) setMedidas((m) => ({ ...m, [chave]: { ok: false } }));
      }
    }
    medir('api', `${API_URL}/api/health`);
    medir('docs', `${API_URL}/api-docs/`);
    return () => { cancelado = true; };
  }, []);

  const estado = (m) => (!m ? ['ponto--lento', 'A verificar…'] : !m.ok ? ['ponto--erro', 'Indisponível'] : m.ms > 800 ? ['ponto--lento', 'Resposta lenta'] : ['ponto--ok', 'Operacional']);
  const linhas = [
    ['API REST', medidas.api ? `${medidas.api.ms ?? '—'} ms` : '', estado(medidas.api)],
    ['Servidor de sockets', `Socket.io · ${resumo?.socketsLigados ?? 0} ligações`, socket?.connected ? ['ponto--ok', 'Operacional'] : ['ponto--erro', 'Desligado']],
    ['MongoDB', 'Base de dados', resumo ? ['ponto--ok', 'Operacional'] : ['ponto--lento', 'A verificar…']],
    ['Documentação da API', 'Swagger UI · /api-docs', estado(medidas.docs)]
  ];

  return (
    <section className="cartao" aria-labelledby="titulo-servicos">
      <h2 id="titulo-servicos" className="h6">Estado dos serviços</h2>
      <ul className="servicos">
        {linhas.map(([nome, detalhe, [classe, texto]]) => (
          <li key={nome}>
            <span className={classe} aria-hidden="true" />
            <span>{nome}<span className="d-block small texto-secundario">{detalhe}</span></span>
            <span>{texto}</span>
          </li>
        ))}
      </ul>
      <a href={`${API_URL}/api-docs`} target="_blank" rel="noreferrer" className="small">Abrir Swagger UI</a>
    </section>
  );
}

export default function PainelAdmin() {
  const { token } = useAuth();
  const resumo = useApi('/admin/resumo');
  const pendentes = useApi('/admin/produtores?validado=false');
  const denunciadas = useApi('/admin/avaliacoes?denunciadas=true');
  const leiloes = useApi('/auctions?estado=ativo');
  const utilizadores = useApi('/admin/utilizadores');
  const encomendas = useApi('/orders');
  const [erro, setErro] = useState('');

  const recarregar = useCallback(() => { resumo.recarregar(); pendentes.recarregar(); denunciadas.recarregar(); utilizadores.recarregar(); },
    [resumo.recarregar, pendentes.recarregar, denunciadas.recarregar, utilizadores.recarregar]); // eslint-disable-line react-hooks/exhaustive-deps
  useEventoSocket('novo-produtor', recarregar);
  useEventoSocket('avaliacao-denunciada', recarregar);

  async function acao(caminho, corpo) {
    try {
      await api(caminho, { metodo: 'PATCH', token, corpo });
      setErro('');
      recarregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  const r = resumo.dados;

  return (
    <>
      <h1 className="h2 mb-3">Administração</h1>
      {erro && <div className="alert alert-danger" role="alert">{erro}</div>}

      <Carregar aCarregar={resumo.aCarregar} erro={resumo.erro}>
        {r && (
          <section className="indicadores mb-3" aria-label="Indicadores globais">
            <div className="indicador"><small>Utilizadores registados</small><strong>{r.utilizadores}</strong><span className="nota nota--ok">+{r.novosSemana} esta semana</span></div>
            <div className="indicador"><small>Produtores ativos</small><strong>{r.produtoresAtivos}</strong><span className="nota">{r.produtoresPorValidar} por validar</span></div>
            <div className="indicador"><small>Encomendas hoje</small><strong>{r.encomendasHoje}</strong><span className="nota nota--ok">{euro(r.vendasHoje)} em vendas</span></div>
            <div className="indicador"><small>Leilões em direto</small><strong>{r.leiloesAtivos}</strong><span className="nota">{r.avaliacoesDenunciadas} avaliações denunciadas</span></div>
          </section>
        )}
      </Carregar>

      <div className="painel-colunas mb-3">
        <div className="d-grid gap-3">
          <section className="cartao" aria-labelledby="titulo-validar">
            <div className="d-flex justify-content-between align-items-baseline">
              <h2 id="titulo-validar" className="h6">Produtores por validar</h2>
              <span className="small texto-secundario">{pendentes.dados?.length ?? 0} pedidos</span>
            </div>
            <Carregar aCarregar={pendentes.aCarregar} erro={pendentes.erro}>
              {pendentes.dados?.length === 0 && <p className="small texto-secundario mb-0">Não há pedidos pendentes.</p>}
              {pendentes.dados?.map((u) => (
                <div key={u._id} className="linha-carrinho">
                  <div className="d-flex gap-2 align-items-center">
                    <span className="avatar" aria-hidden="true">{iniciais(u.produtor?.nomeExploracao || u.nome)}</span>
                    <div>
                      <strong>{u.produtor?.nomeExploracao || u.nome}</strong>
                      <div className="small texto-secundario">{u.nome} · {u.email} · {u.produtor?.localidade} · pedido a {data(u.createdAt)}</div>
                      {u.produtor?.descricao && <div className="small">{u.produtor.descricao}</div>}
                    </div>
                  </div>
                  <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => acao(`/admin/produtores/${u._id}`, { aprovado: false })}>Rejeitar</button>
                  <button type="button" className="btn btn-success btn-sm" onClick={() => acao(`/admin/produtores/${u._id}`, { aprovado: true })}>Aprovar</button>
                </div>
              ))}
            </Carregar>
          </section>

          <section className="cartao" aria-labelledby="titulo-denunciadas">
            <div className="d-flex justify-content-between align-items-baseline">
              <h2 id="titulo-denunciadas" className="h6">Avaliações denunciadas</h2>
              <span className="small texto-secundario">{denunciadas.dados?.length ?? 0} por moderar</span>
            </div>
            <Carregar aCarregar={denunciadas.aCarregar} erro={denunciadas.erro}>
              {denunciadas.dados?.length === 0 && <p className="small texto-secundario mb-0">Não há avaliações por moderar.</p>}
              {denunciadas.dados?.map((a) => (
                <div key={a._id} className="linha-carrinho">
                  <div className="d-flex gap-2">
                    <Icone nome="bandeira" className="text-danger flex-shrink-0 mt-1" />
                    <div>
                      <p className="mb-1">“{a.comentario}”</p>
                      <div className="small texto-secundario">
                        {a.classificacao}★ sobre {a.produtor?.nome} · por {a.autor?.nome} · {a.denuncias} {a.denuncias === 1 ? 'denúncia' : 'denúncias'}
                      </div>
                    </div>
                  </div>
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => acao(`/admin/avaliacoes/${a._id}`, { visivel: true })}>Manter</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => acao(`/admin/avaliacoes/${a._id}`, { visivel: false })}>Ocultar</button>
                </div>
              ))}
            </Carregar>
          </section>
        </div>

        <div className="d-grid gap-3">
          <section className="cartao" aria-labelledby="titulo-leiloes-ativos">
            <h2 id="titulo-leiloes-ativos" className="h6"><span className="text-danger" aria-hidden="true">●</span> Leilões ativos</h2>
            <Carregar aCarregar={leiloes.aCarregar} erro={leiloes.erro}>
              {leiloes.dados?.length === 0 && <p className="small texto-secundario mb-0">Não há leilões a decorrer.</p>}
              <ul className="list-unstyled mb-0">
                {leiloes.dados?.map((l) => <LinhaLeilao key={l._id} leilao={l} />)}
              </ul>
            </Carregar>
          </section>
          <EstadoServicos resumo={r} />
        </div>
      </div>

      <div className="painel-colunas">
        <section className="cartao" aria-labelledby="titulo-enc-admin">
          <h2 id="titulo-enc-admin" className="h6">Encomendas recentes</h2>
          <Carregar aCarregar={encomendas.aCarregar} erro={encomendas.erro}>
            <table className="tabela-encomendas">
              <thead>
                <tr><th scope="col">N.º</th><th scope="col">Comprador</th><th scope="col">Produtor</th><th scope="col">Total</th><th scope="col">Estado</th></tr>
              </thead>
              <tbody>
                {encomendas.dados?.slice(0, 12).map((o) => (
                  <tr key={o._id}>
                    <td><strong>{refEncomenda(o._id)}</strong> <span className="small texto-secundario">{dataHora(o.createdAt)}</span></td>
                    <td data-rotulo="Comprador">{o.comprador?.nome}</td>
                    <td data-rotulo="Produtor">{o.produtor?.nome}</td>
                    <td data-rotulo="Total"><strong>{euro(o.total)}</strong></td>
                    <td><span className={`estado estado--${o.estado}`}>{o.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Carregar>
        </section>

        <section className="cartao" aria-labelledby="titulo-utilizadores">
          <h2 id="titulo-utilizadores" className="h6">Utilizadores</h2>
          <Carregar aCarregar={utilizadores.aCarregar} erro={utilizadores.erro}>
            <ul className="servicos">
              {utilizadores.dados?.slice(0, 15).map((u) => (
                <li key={u._id}>
                  <span className="avatar avatar--pequeno" aria-hidden="true">{iniciais(u.nome)}</span>
                  <span>{u.nome}<span className="d-block small texto-secundario">{u.email}</span></span>
                  <span className="text-capitalize">{u.papel}{u.papel === 'produtor' && !u.produtor?.validado ? ' (por validar)' : ''}</span>
                </li>
              ))}
            </ul>
          </Carregar>
        </section>
      </div>
    </>
  );
}
