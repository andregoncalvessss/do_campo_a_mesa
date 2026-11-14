// Componente reutilizável: destaque de um leilão (catálogo, lista de leilões e painéis)
import { Link } from 'react-router-dom';
import { useContagem, formatarTempo } from '../hooks/useContagem.js';
import { dataHora, euro } from '../utils/formato.js';

const ROTULO = { ativo: 'Em direto', agendado: 'Agendado', terminado: 'Terminado' };

export default function CartaoLeilao({ leilao }) {
  const restante = useContagem(leilao.estado === 'ativo' ? leilao.terminaEm : null);
  const produtor = leilao.produtor;
  return (
    <article className="cartao-leilao">
      <div className="d-flex justify-content-between align-items-center gap-2">
        <span className={`em-direto em-direto--${leilao.estado}`}>{ROTULO[leilao.estado]}</span>
        <span className="small texto-secundario">{leilao.numLicitacoes} licitações</span>
      </div>
      <div>
        <h3>{leilao.lote}</h3>
        {produtor?.nome && <p className="small texto-secundario mb-0">{produtor.nome} · {produtor.produtor?.localidade}</p>}
      </div>
      <div className="cartao-leilao__numeros">
        <div className="cartao-leilao__numero">
          <small>{leilao.numLicitacoes ? 'Licitação atual' : 'Preço base'}</small>
          <strong>{euro(leilao.licitacaoAtual?.valor ?? leilao.precoBase)}</strong>
        </div>
        <div className="cartao-leilao__numero">
          <small>{leilao.estado === 'agendado' ? 'Começa em' : 'Termina em'}</small>
          <strong>{leilao.estado === 'ativo' ? formatarTempo(restante) : dataHora(leilao.estado === 'agendado' ? leilao.iniciaEm : leilao.terminaEm)}</strong>
        </div>
      </div>
      <Link to={`/leiloes/${leilao._id}`} className="btn w-100 mt-auto">
        {leilao.estado === 'ativo' ? 'Entrar na sala' : 'Ver leilão'}
      </Link>
    </article>
  );
}
