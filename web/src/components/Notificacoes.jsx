// Passo 7: notificações em tempo real (toasts) a partir dos eventos da sala pessoal user:ID
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useEventoSocket } from '../context/SocketContext.jsx';
import { euro } from '../utils/formato.js';
import Icone from './Icone.jsx';

export default function Notificacoes() {
  const { atualizar } = useAuth();
  const [lista, setLista] = useState([]);

  const fechar = useCallback((id) => setLista((l) => l.filter((n) => n.id !== id)), []);
  const mostrar = useCallback((texto, para) => {
    const id = `${Date.now()}-${Math.random()}`;
    setLista((l) => [...l.slice(-3), { id, texto, para }]);
    setTimeout(() => fechar(id), 8000);
  }, [fechar]);

  useEventoSocket('encomenda-atualizada', useCallback((e) =>
    mostrar(`${e.produtor} marcou a sua encomenda como "${e.estado}".`, '/encomendas'), [mostrar]));
  useEventoSocket('nova-encomenda', useCallback((e) =>
    mostrar(`Nova encomenda de ${e.comprador || 'um comprador'}: ${euro(e.total)}.`, '/produtor'), [mostrar]));
  useEventoSocket('leilao-ganho', useCallback((e) =>
    mostrar(`Ganhou o leilão "${e.lote}" por ${euro(e.valor)}. A encomenda já está confirmada.`, '/encomendas'), [mostrar]));
  useEventoSocket('leilao-terminado', useCallback((e) =>
    mostrar(e.vencedor ? `O leilão "${e.lote}" terminou: ${e.vencedor} venceu com ${euro(e.valor)}.` : `O leilão "${e.lote}" terminou sem licitações.`, '/produtor'), [mostrar]));
  useEventoSocket('leilao-aberto', useCallback((e) =>
    mostrar(`O leilão "${e.lote}" abriu agora.`, `/leiloes/${e.id}`), [mostrar]));
  useEventoSocket('nova-avaliacao', useCallback((e) =>
    mostrar(`${e.autor} avaliou-o com ${e.classificacao} estrelas.`, '/produtor'), [mostrar]));
  useEventoSocket('conta-validada', useCallback(() => {
    atualizar(); // vai buscar os dados novos do utilizador (validado: true)
    mostrar('A sua conta de produtor foi validada. Já pode publicar produtos e leilões.', '/produtor/produtos');
  }, [mostrar, atualizar]));
  useEventoSocket('novo-produtor', useCallback((e) =>
    mostrar(`Novo produtor por validar: ${e.nome}.`, '/admin'), [mostrar]));

  return (
    <div className="notificacoes" aria-live="polite" aria-atomic="false">
      {lista.map((n) => (
        <div key={n.id} className="notificacao" role="status">
          <Icone nome="sino" tamanho={20} />
          <div className="small">
            {n.texto} {n.para && <Link to={n.para} onClick={() => fechar(n.id)}>Ver</Link>}
          </div>
          <button type="button" className="btn-close btn-sm" aria-label="Fechar notificação" onClick={() => fechar(n.id)} />
        </div>
      ))}
    </div>
  );
}
