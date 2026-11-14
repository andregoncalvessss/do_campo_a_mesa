// Sala de leilão em direto: contagem sincronizada, presença, licitação e histórico
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLeilao } from '../hooks/useLeilao.js';
import { useContagem, formatarTempo } from '../hooks/useContagem.js';
import Icone from '../components/Icone.jsx';
import { dataHora, euro, hora, iniciais } from '../utils/formato.js';

const ROTULO = { ativo: 'Em direto', agendado: 'Agendado', terminado: 'Terminado' };

export default function SalaLeilao() {
  const { id } = useParams();
  const { utilizador } = useAuth();
  const { leilao, licitacoes, participantes, offset, erro, resultado, licitar } = useLeilao(id);
  const [valor, setValor] = useState('');

  const ativo = leilao?.estado === 'ativo';
  const restante = useContagem(ativo ? leilao.terminaEm : null, offset);
  const ateAbrir = useContagem(leilao?.estado === 'agendado' ? leilao.iniciaEm : null, offset);

  const atual = leilao?.licitacaoAtual?.valor ?? leilao?.precoBase ?? 0;
  const minimo = Math.round((atual + (leilao?.incremento ?? 0)) * 100) / 100;
  const souComprador = utilizador?.papel === 'comprador';
  const vouAGanhar = leilao?.licitacaoAtual?.comprador === utilizador?.id;

  // Sugere sempre o valor mínimo quando a licitação atual muda
  useEffect(() => { setValor(minimo ? minimo.toFixed(2) : ''); }, [minimo]);

  if (!leilao) {
    return erro
      ? <div className="alert alert-danger" role="alert">{erro} · <Link to="/leiloes">Voltar aos leilões</Link></div>
      : <p className="texto-secundario" role="status">A entrar na sala…</p>;
  }

  const duracao = new Date(leilao.terminaEm) - new Date(leilao.iniciaEm);
  const progresso = ativo ? Math.min(100, Math.max(0, 100 - (restante / duracao) * 100)) : 100;
  const produtor = leilao.produtor;

  return (
    <>
      <nav aria-label="Caminho" className="small mb-2">
        <Link to="/leiloes">Leilões</Link> <span className="texto-secundario">/ {leilao.lote}</span>
      </nav>

      <div className="sala">
        <article>
          <header className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h1 className="h3 mb-1">{leilao.lote}</h1>
              {produtor?._id && (
                <Link to={`/produtores/${produtor._id}`} className="texto-secundario small">
                  {produtor.nome} · {produtor.produtor?.localidade}
                </Link>
              )}
            </div>
            <span className={`em-direto em-direto--${leilao.estado} flex-shrink-0`}>{ROTULO[leilao.estado]}</span>
          </header>

          <div className="sala__imagem mb-3" aria-hidden="true"><Icone nome="martelo" tamanho={56} /></div>

          <div className="sala__factos mb-3">
            <div><span className="rotulo">Preço base</span><strong>{euro(leilao.precoBase)}</strong></div>
            <div><span className="rotulo">Incremento mínimo</span><strong>{euro(leilao.incremento)}</strong></div>
            <div><span className="rotulo">Licitações</span><strong>{leilao.numLicitacoes}</strong></div>
            <div><span className="rotulo">Termina</span><strong>{dataHora(leilao.terminaEm)}</strong></div>
          </div>
          {leilao.quantidade && <p className="mb-1"><strong>Quantidade:</strong> {leilao.quantidade}</p>}
          <p className="mb-1">{leilao.descricao}</p>
          <p className="small texto-secundario">
            <Icone nome="camiao" tamanho={15} /> {leilao.permitirEntrega
              ? 'O vencedor pode levantar na quinta ou pedir entrega.'
              : 'Levantamento na quinta pelo vencedor.'}
          </p>
        </article>

        <aside className="sala__painel" aria-label="Licitação">
          <div className="cartao d-grid gap-3">
            <div className="d-flex justify-content-between align-items-center">
              <span className="contagem" role="timer" aria-label="Tempo restante">
                <Icone nome="relogio" tamanho={20} />
                {ativo ? formatarTempo(restante) : leilao.estado === 'agendado' ? formatarTempo(ateAbrir) : '00:00'}
              </span>
              <span className="small texto-secundario"><Icone nome="pessoas" tamanho={15} /> {participantes} a assistir</span>
            </div>
            <div className="contagem__barra" aria-hidden="true"><div style={{ width: `${progresso}%` }} /></div>

            <div className="licitacao-atual">
              <span className="small texto-secundario">
                {leilao.licitacaoAtual?.comprador ? 'Licitação atual' : 'Preço base (ainda sem licitações)'}
              </span>
              <strong aria-live="polite">{euro(atual)}</strong>
              {leilao.licitacaoAtual?.nome && <span className="small texto-secundario">por {leilao.licitacaoAtual.nome}</span>}
              {vouAGanhar && ativo && <span className="small text-success fw-semibold d-block"><Icone nome="certo" tamanho={14} /> É a licitação mais alta</span>}
            </div>

            {leilao.estado === 'agendado' && (
              <div className="alert alert-warning mb-0 small" role="status">O leilão abre em {dataHora(leilao.iniciaEm)}. A sala atualiza sozinha.</div>
            )}

            {resultado && (
              <div className="alert alert-success mb-0" role="status">
                {resultado.vencedor
                  ? <>Leilão terminado. <strong>{resultado.vencedor.id === utilizador?.id ? 'Ganhou' : `${resultado.vencedor.nome} venceu`}</strong> com {euro(resultado.valor)}.</>
                  : 'Leilão terminado sem licitações.'}
                {resultado.vencedor?.id === utilizador?.id && <> <Link to="/encomendas">Ver a encomenda</Link></>}
              </div>
            )}

            {ativo && souComprador && (
              <form className="d-grid gap-2" onSubmit={(e) => { e.preventDefault(); licitar(Number(valor)); }}>
                <div className="d-flex gap-2">
                  {[1, 2, 5].map((k) => {
                    const v = Math.round((atual + k * leilao.incremento) * 100) / 100;
                    return (
                      <button key={k} type="button" className="btn btn-outline-secondary flex-fill"
                        onClick={() => setValor(v.toFixed(2))}>+{euro(k * leilao.incremento)}</button>
                    );
                  })}
                </div>
                <label htmlFor="valor" className="form-label small mb-0">O seu valor (mínimo {euro(minimo)})</label>
                <input id="valor" type="number" step="0.01" min={minimo} className="form-control form-control-lg"
                  value={valor} onChange={(e) => setValor(e.target.value)} required />
                <button type="submit" className="btn btn-success btn-lg"><Icone nome="martelo" /> Licitar {euro(Number(valor) || minimo)}</button>
              </form>
            )}
            {ativo && !souComprador && (
              <p className="small texto-secundario mb-0">Está a assistir. Só as contas de comprador podem licitar.</p>
            )}

            {/* Licitação recusada pelo servidor */}
            {erro && <div className="alert alert-warning mb-0 small" role="alert">{erro}</div>}
          </div>

          <section className="cartao" aria-labelledby="titulo-licitacoes">
            <div className="d-flex justify-content-between align-items-baseline mb-2">
              <h2 id="titulo-licitacoes" className="h6 mb-0">Licitações</h2>
              <span className="small texto-secundario">atualizado em tempo real</span>
            </div>
            {licitacoes.length === 0 && <p className="small texto-secundario mb-0">Ainda ninguém licitou.</p>}
            <ol className="licitacoes">
              {licitacoes.map((b) => (
                <li key={b._id}>
                  <span className="avatar avatar--pequeno" aria-hidden="true">{iniciais(b.nome)}</span>
                  <span>{b.nome}{b.comprador === utilizador?.id ? ' (você)' : ''}</span>
                  <span className="small texto-secundario">{hora(b.createdAt)}</span>
                  <span>{euro(b.valor)}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
