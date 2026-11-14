// Passo 7: salas de leilão, presença e licitações validadas de forma atómica
const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');

const sala = (leilaoId) => `leilao:${leilaoId}`;
const cent = (v) => Math.round(v * 100) / 100; // arredonda aos cêntimos (evita 216,99999)

// Camada extra: dentro desta instância, as licitações do mesmo leilão são tratadas por
// ordem de chegada. A garantia de consistência é a operação atómica na base de dados.
const filas = new Map();
function emFila(leilaoId, tarefa) {
  const anterior = filas.get(leilaoId) || Promise.resolve();
  const seguinte = anterior.then(tarefa, tarefa);
  filas.set(leilaoId, seguinte);
  seguinte.finally(() => { if (filas.get(leilaoId) === seguinte) filas.delete(leilaoId); }).catch(() => {});
  return seguinte;
}

function emitirPresenca(io, leilaoId) {
  const n = io.sockets.adapter.rooms.get(sala(leilaoId))?.size ?? 0;
  io.to(sala(leilaoId)).emit('presenca', n);
}

module.exports = (io, socket) => {
  socket.on('entrar', async (leilaoId) => {
    try {
      if (!mongoose.isValidObjectId(leilaoId)) return socket.emit('recusada', 'Leilão inválido');
      socket.join(sala(leilaoId));
      emitirPresenca(io, leilaoId);
      const leilao = await Auction.findById(leilaoId).populate('produtor', 'nome produtor.localidade produtor.nomeExploracao');
      if (!leilao) return socket.emit('recusada', 'Leilão não encontrado');
      const licitacoes = await Bid.find({ leilao: leilaoId }).sort({ createdAt: -1 }).limit(20);
      // "agora" permite ao cliente acertar o relógio com o do servidor
      socket.emit('estado', { agora: new Date(), leilao, licitacoes });
    } catch (err) {
      console.error(err);
      socket.emit('recusada', 'Erro ao entrar na sala');
    }
  });

  socket.on('sair', (leilaoId) => {
    socket.leave(sala(leilaoId));
    emitirPresenca(io, leilaoId);
  });

  // Ao desligar: guarda as salas onde estava e atualiza a presença depois de sair
  socket.on('disconnecting', () => {
    const ids = [...socket.rooms].filter((r) => r.startsWith('leilao:')).map((r) => r.slice(7));
    socket.once('disconnect', () => ids.forEach((id) => emitirPresenca(io, id)));
  });

  socket.on('licitar', (dados, ack) => {
    const responder = typeof ack === 'function' ? ack : () => {};
    const recusar = (mensagem) => {
      socket.emit('recusada', mensagem);
      responder({ ok: false, erro: mensagem });
    };
    const leilaoId = dados?.leilaoId;
    const valor = cent(Number(dados?.valor));

    if (socket.user.papel !== 'comprador') return recusar('Só os compradores podem licitar');
    if (!mongoose.isValidObjectId(leilaoId)) return recusar('Leilão inválido');
    if (!Number.isFinite(valor) || valor <= 0) return recusar('Valor inválido');

    emFila(String(leilaoId), async () => {
      try {
        const base = await Auction.findById(leilaoId).select('incremento');
        if (!base) return recusar('Leilão não encontrado');

        // Atualização ATÓMICA: só grava se a licitação ainda for válida.
        // "valor >= atual + incremento" escrito sobre o campo guardado: atual <= valor - incremento
        const agora = new Date();
        const leilao = await Auction.findOneAndUpdate(
          {
            _id: leilaoId,
            estado: 'ativo',
            terminaEm: { $gt: agora },
            'licitacaoAtual.valor': { $lte: cent(valor - base.incremento) }
          },
          {
            $set: { licitacaoAtual: { valor, comprador: socket.user.id, nome: socket.user.nome, em: agora } },
            $inc: { numLicitacoes: 1 }
          },
          { new: true }
        );

        if (!leilao) {
          // A condição falhou: o leilão fechou ou alguém licitou antes. Relê para explicar o motivo.
          const atual = await Auction.findById(leilaoId).select('estado terminaEm licitacaoAtual incremento');
          if (!atual || atual.estado !== 'ativo' || atual.terminaEm <= agora) return recusar('O leilão não está ativo');
          return recusar(`Licitação mínima: ${cent(atual.licitacaoAtual.valor + atual.incremento).toFixed(2).replace('.', ',')} €`);
        }

        // Só depois de aceite é que se regista no histórico e se faz o broadcast à sala
        const bid = await Bid.create({ leilao: leilaoId, comprador: socket.user.id, nome: socket.user.nome, valor });
        io.to(sala(leilaoId)).emit('nova-licitacao', {
          _id: bid._id, valor, comprador: socket.user.id, nome: socket.user.nome,
          createdAt: bid.createdAt, numLicitacoes: leilao.numLicitacoes
        });
        responder({ ok: true, valor });
      } catch (err) {
        console.error(err);
        recusar('Erro ao registar a licitação');
      }
    });
  });
};
