// Ciclo de vida dos leilões: agendado -> ativo -> terminado.
// Cada mudança é condicionada ao estado anterior, por isso com várias instâncias da API
// só uma consegue abrir ou fechar cada leilão.
const Auction = require('../models/Auction');
const Order = require('../models/Order');

const sala = (id) => `leilao:${id}`;

async function abrirAgendados(io) {
  const agora = new Date();
  const lista = await Auction.find({ estado: 'agendado', iniciaEm: { $lte: agora } }).select('_id');
  for (const { _id } of lista) {
    const l = await Auction.findOneAndUpdate({ _id, estado: 'agendado' }, { estado: 'ativo' }, { new: true });
    if (!l) continue; // outra instância já o abriu
    io.to(sala(l._id)).emit('aberto', { id: l._id });
    io.to(`user:${l.produtor}`).emit('leilao-aberto', { id: l._id, lote: l.lote });
  }
}

async function fecharExpirados(io) {
  const agora = new Date();
  const lista = await Auction.find({ estado: 'ativo', terminaEm: { $lte: agora } }).select('_id');
  for (const { _id } of lista) {
    const l = await Auction.findOneAndUpdate({ _id, estado: 'ativo' }, { estado: 'terminado' }, { new: true });
    if (!l) continue; // outra instância já o fechou

    const vencedor = l.licitacaoAtual?.comprador;
    let encomenda = null;
    if (vencedor) {
      // O vencedor recebe uma encomenda confirmada com o lote
      encomenda = await Order.create({
        comprador: vencedor,
        produtor: l.produtor,
        linhas: [{
          produto: l.produto, nome: `Lote: ${l.lote}`, precoUnit: l.licitacaoAtual.valor, unidade: 'lote', quantidade: 1
        }],
        estado: 'confirmada',
        origem: 'leilao',
        leilao: l._id
      });
      await Auction.updateOne({ _id: l._id }, { encomenda: encomenda._id });
      io.to(`user:${vencedor}`).emit('leilao-ganho', { id: l._id, lote: l.lote, valor: l.licitacaoAtual.valor, encomenda: encomenda._id });
    }

    io.to(sala(l._id)).emit('terminado', {
      id: l._id,
      vencedor: vencedor ? { id: vencedor, nome: l.licitacaoAtual.nome } : null,
      valor: vencedor ? l.licitacaoAtual.valor : null
    });
    io.to(`user:${l.produtor}`).emit('leilao-terminado', {
      id: l._id, lote: l.lote, valor: vencedor ? l.licitacaoAtual.valor : null,
      vencedor: vencedor ? l.licitacaoAtual.nome : null, encomenda: encomenda?._id
    });
  }
}

function iniciarCicloLeiloes(io, intervaloMs = 2000) {
  let aCorrer = false;
  const t = setInterval(async () => {
    if (aCorrer) return; // não sobrepõe duas passagens
    aCorrer = true;
    try {
      await abrirAgendados(io);
      await fecharExpirados(io);
    } catch (err) {
      console.error('Ciclo dos leilões:', err.message);
    } finally {
      aCorrer = false;
    }
  }, intervaloMs);
  return () => clearInterval(t);
}

module.exports = { iniciarCicloLeiloes, abrirAgendados, fecharExpirados };
