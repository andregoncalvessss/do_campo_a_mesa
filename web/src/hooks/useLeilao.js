// Passo 7: liga a página da sala aos eventos do leilão (estado, licitações, presença, fim)
import { useCallback, useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext.jsx';

export function useLeilao(id) {
  const socket = useSocket();
  const [leilao, setLeilao] = useState(null);
  const [licitacoes, setLicitacoes] = useState([]);
  const [participantes, setParticipantes] = useState(0);
  const [offset, setOffset] = useState(0); // relógio do servidor - relógio local
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    if (!socket) return undefined;
    const entrar = () => socket.emit('entrar', id);
    const onEstado = ({ agora, leilao: l, licitacoes: ls }) => {
      setOffset(new Date(agora).getTime() - Date.now());
      setLeilao(l);
      setLicitacoes(ls);
      if (l.estado === 'terminado') {
        setResultado({ vencedor: l.licitacaoAtual?.comprador ? { id: l.licitacaoAtual.comprador, nome: l.licitacaoAtual.nome } : null, valor: l.licitacaoAtual?.valor });
      }
    };
    const onNova = (b) => {
      setLeilao((l) => l && ({ ...l, licitacaoAtual: { valor: b.valor, comprador: b.comprador, nome: b.nome, em: b.createdAt }, numLicitacoes: b.numLicitacoes }));
      setLicitacoes((ls) => [b, ...ls].slice(0, 20));
    };
    const onTerminado = (r) => {
      setResultado(r);
      setLeilao((l) => l && ({ ...l, estado: 'terminado' }));
    };

    socket.on('connect', entrar); // volta a entrar na sala se a ligação cair
    socket.on('estado', onEstado);
    socket.on('nova-licitacao', onNova);
    socket.on('presenca', setParticipantes);
    socket.on('recusada', setErro);
    socket.on('terminado', onTerminado);
    socket.on('aberto', entrar);
    if (socket.connected) entrar();

    // Cada socket.on tem o socket.off correspondente: sem isto os eventos ficam duplicados
    return () => {
      socket.emit('sair', id);
      socket.off('connect', entrar);
      socket.off('estado', onEstado);
      socket.off('nova-licitacao', onNova);
      socket.off('presenca', setParticipantes);
      socket.off('recusada', setErro);
      socket.off('terminado', onTerminado);
      socket.off('aberto', entrar);
    };
  }, [socket, id]);

  const licitar = useCallback((valor) => {
    setErro('');
    socket?.emit('licitar', { leilaoId: id, valor });
  }, [socket, id]);

  return { leilao, licitacoes, participantes, offset, erro, resultado, licitar, ligado: !!socket };
}
