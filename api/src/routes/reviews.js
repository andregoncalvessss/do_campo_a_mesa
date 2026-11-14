// Avaliações de produtores e produtos (depois da entrega) e denúncias
const router = require('express').Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const a = require('../utils/async');
const erro = require('../utils/erro');

// GET /api/reviews?produtor -> 200 (só as visíveis)
router.get('/', a(async (req, res) => {
  const filtro = { visivel: true };
  if (req.query.produtor) filtro.produtor = req.query.produtor;
  const lista = await Review.find(filtro).sort({ createdAt: -1 }).limit(100).populate('autor', 'nome');
  res.json(lista);
}));

// POST /api/reviews (comprador) -> 201 | 400 | 404 | 409
router.post('/', auth('comprador'), a(async (req, res) => {
  const { encomenda, classificacao, comentario, produto } = req.body;
  const o = await Order.findOne({ _id: encomenda, comprador: req.user.id });
  if (!o) throw erro(404, 'Encomenda não encontrada');
  if (o.estado !== 'entregue') throw erro(409, 'Só pode avaliar encomendas entregues');
  if (await Review.exists({ encomenda: o._id, autor: req.user.id })) throw erro(409, 'Esta encomenda já foi avaliada');

  // Opcionalmente, a avaliação refere um produto dessa encomenda
  const linha = produto ? o.linhas.find((l) => String(l.produto) === String(produto)) : null;
  if (produto && !linha) throw erro(400, 'O produto não faz parte da encomenda');

  const r = await Review.create({
    autor: req.user.id,
    produtor: o.produtor,
    encomenda: o._id,
    produto: linha?.produto,
    nomeProduto: linha?.nome,
    classificacao,
    comentario
  });
  req.app.get('io')?.to(`user:${o.produtor}`).emit('nova-avaliacao', { classificacao: r.classificacao, autor: req.user.nome });
  res.status(201).location(`/api/reviews/${r._id}`).json(r);
}));

// POST /api/reviews/:id/denunciar (autenticado) -> 200 { denuncias } | 404
router.post('/:id/denunciar', auth(), a(async (req, res) => {
  // Cada utilizador só conta uma vez: a condição e o incremento vão na mesma operação
  const r = await Review.findOneAndUpdate(
    { _id: req.params.id, visivel: true, denunciadoPor: { $ne: req.user.id } },
    { $addToSet: { denunciadoPor: req.user.id }, $inc: { denuncias: 1 } },
    { new: true }
  );
  if (r) req.app.get('io')?.to('admins').emit('avaliacao-denunciada', { id: r._id });
  const atual = r || await Review.findOne({ _id: req.params.id, visivel: true });
  if (!atual) throw erro(404, 'Avaliação não encontrada');
  res.json({ denuncias: atual.denuncias });
}));

module.exports = router;
