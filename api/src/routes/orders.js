// Passo 3: encomendas (reserva atómica de stock e estados que só avançam)
const router = require('express').Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const auth = require('../middleware/auth');
const a = require('../utils/async');
const erro = require('../utils/erro');

// Devolve ao stock o que já tinha sido reservado
const reporStock = (reservas) => Promise.all(
  reservas.map((r) => Product.updateOne({ _id: r.id }, { $inc: { stock: r.q } }))
);

// POST /api/orders (comprador) -> 201 [encomendas] | 400 | 409 stock insuficiente
router.post('/', auth('comprador'), a(async (req, res) => {
  const { linhas, entrega = {} } = req.body;
  if (!Array.isArray(linhas) || !linhas.length) throw erro(400, 'A encomenda tem de ter pelo menos uma linha');
  if (entrega.tipo === 'entrega' && !String(entrega.morada || '').trim()) throw erro(400, 'Indique a morada de entrega');

  const reservas = [];
  const porProdutor = new Map(); // id do produtor -> linhas
  try {
    for (const l of linhas) {
      const q = Number(l.quantidade);
      if (!Number.isInteger(q) || q < 1) throw erro(400, 'Quantidade inválida');
      // Condição e atualização numa só operação: nunca se vende o que não existe
      const p = await Product.findOneAndUpdate(
        { _id: l.produto, stock: { $gte: q } },
        { $inc: { stock: -q } },
        { new: true }
      );
      if (!p) {
        const existe = await Product.findById(l.produto).select('nome');
        throw erro(existe ? 409 : 404, existe ? `Stock insuficiente: ${existe.nome}` : 'Produto não encontrado');
      }
      reservas.push({ id: p._id, q });
      const chave = p.produtor.toString();
      if (!porProdutor.has(chave)) porProdutor.set(chave, []);
      porProdutor.get(chave).push({ produto: p._id, nome: p.nome, precoUnit: p.preco, unidade: p.unidade, quantidade: q });
    }

    // Uma encomenda por produtor
    const criadas = await Order.create([...porProdutor].map(([produtor, ls]) => ({
      comprador: req.user.id,
      produtor,
      linhas: ls,
      entrega: { tipo: entrega.tipo || 'levantamento', morada: entrega.morada }
    })));

    // Avisa cada produtor em tempo real
    const io = req.app.get('io');
    criadas.forEach((o) => io?.to(`user:${o.produtor}`).emit('nova-encomenda', { id: o._id, total: o.total, comprador: req.user.nome }));

    res.status(201).json(criadas);
  } catch (err) {
    await reporStock(reservas);
    throw err;
  }
}));

// GET /api/orders (autenticado) -> 200 : as do comprador, as do produtor ou todas (admin)
router.get('/', auth(), a(async (req, res) => {
  const filtro = {};
  if (req.user.papel === 'comprador') filtro.comprador = req.user.id;
  if (req.user.papel === 'produtor') filtro.produtor = req.user.id;
  if (req.query.estado) filtro.estado = req.query.estado;

  const lista = await Order.find(filtro)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('comprador', 'nome')
    .populate('produtor', 'nome produtor.nomeExploracao produtor.localidade');

  // O comprador fica a saber quais as encomendas que já avaliou
  let avaliadas = new Set();
  if (req.user.papel === 'comprador') {
    const ids = await Review.find({ autor: req.user.id }).distinct('encomenda');
    avaliadas = new Set(ids.map(String));
  }
  res.json(lista.map((o) => ({ ...o.toJSON(), avaliada: avaliadas.has(o._id.toString()) })));
}));

// GET /api/orders/:id (comprador ou produtor da encomenda, ou admin) -> 200 | 404
router.get('/:id', auth(), a(async (req, res) => {
  const filtro = { _id: req.params.id };
  if (req.user.papel === 'comprador') filtro.comprador = req.user.id;
  if (req.user.papel === 'produtor') filtro.produtor = req.user.id;
  const o = await Order.findOne(filtro)
    .populate('comprador', 'nome')
    .populate('produtor', 'nome produtor.nomeExploracao produtor.localidade');
  if (!o) throw erro(404, 'Encomenda não encontrada');
  res.json(o);
}));

// PATCH /api/orders/:id/estado (produtor) -> 200 | 400 | 404 | 409
router.patch('/:id/estado', auth('produtor'), a(async (req, res) => {
  const { estado } = req.body;
  const ESTADOS = Order.ESTADOS;
  const novo = ESTADOS.indexOf(estado);
  if (novo < 0) throw erro(400, 'Estado inválido');

  // A verificação está dentro do filtro: dois pedidos simultâneos não saltam estados
  const o = await Order.findOneAndUpdate(
    { _id: req.params.id, produtor: req.user.id, estado: { $in: ESTADOS.slice(0, novo) } },
    { estado },
    { new: true, runValidators: true }
  );
  if (!o) {
    const existe = await Order.exists({ _id: req.params.id, produtor: req.user.id });
    throw erro(existe ? 409 : 404, existe ? 'O estado só pode avançar' : 'Encomenda não encontrada');
  }

  // Notificação em tempo real para a sala pessoal do comprador
  req.app.get('io')?.to(`user:${o.comprador}`).emit('encomenda-atualizada', {
    id: o._id, estado: o.estado, produtor: req.user.nome
  });
  res.json(o);
}));

module.exports = router;
