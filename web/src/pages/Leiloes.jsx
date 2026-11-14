// Lista de leilões: em direto, agendados e terminados
import { useCallback } from 'react';
import { useApi } from '../hooks/useApi.js';
import CartaoLeilao from '../components/CartaoLeilao.jsx';
import { Carregar } from '../components/Estado.jsx';

function Grupo({ titulo, lista, vazio }) {
  return (
    <section className="mb-4" aria-label={titulo}>
      <h2 className="h5">{titulo} ({lista.length})</h2>
      {lista.length === 0 && <p className="texto-secundario small">{vazio}</p>}
      <div className="grelha-leiloes">
        {lista.map((l) => <CartaoLeilao key={l._id} leilao={l} />)}
      </div>
    </section>
  );
}

export default function Leiloes() {
  const { dados, erro, aCarregar } = useApi('/auctions');
  const doEstado = useCallback((e) => (dados || []).filter((l) => l.estado === e), [dados]);

  return (
    <>
      <h1 className="h2 mb-1">Leilões</h1>
      <p className="texto-secundario">Lotes sazonais e excedentes, licitados em direto. Entre numa sala para acompanhar.</p>
      <Carregar aCarregar={aCarregar} erro={erro}>
        <Grupo titulo="Em direto" lista={doEstado('ativo')} vazio="Não há leilões a decorrer neste momento." />
        <Grupo titulo="Agendados" lista={doEstado('agendado')} vazio="Não há leilões agendados." />
        <Grupo titulo="Terminados" lista={doEstado('terminado').reverse().slice(0, 6)} vazio="Ainda não terminou nenhum leilão." />
      </Carregar>
    </>
  );
}
