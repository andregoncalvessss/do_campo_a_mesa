// Produtores: lista, página pública, perfil e estatísticas de vendas
const router = require('express').Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const auth = require('../middleware/auth');
const { mediaProdutor } = require('../services/avaliacoes');
const a = require('../utils/async');
const erro = require('../utils/erro');

const escaparRegex = (t) => String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const STOCK_BAIXO = 10;

// GET /api/producers?q&localidade -> 200 (só produtores validados)
router.get('/', a(async (req, res) => {
  const { q, localidade } = req.query;
  const filtro = { papel: 'produtor', 'produtor.validado': true };
  if (q) filtro['produtor.nomeExploracao'] = { $regex: escaparRegex(q), $options: 'i' };
  if (localidade) filtro['produtor.localidade'] = { $regex: escaparRegex(localidade), $options: 'i' };
  const lista = await User.find(filtro).select('nome produtor').sort({ 'produtor.nomeExploracao': 1 });
  res.json(lista);
}));

// GET /api/producers/eu/estatisticas (produtor) -> 200
router.get('/eu/estatisticas', auth('produtor'), a(async (req, res) => {
  const id = req.user.id;
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [doMes, porTratar, produtos, stockBaixo, avaliacao] = await Promise.all([
    Order.find({ produtor: id, createdAt: { $gte: inicioMes } }),
    Order.countDocuments({ produtor: id, estado: { $in: ['pendente', 'confirmada'] } }),
    Product.countDocuments({ produtor: id }),
    Product.find({ produtor: id, stock: { $lt: STOCK_BAIXO } }).select('nome stock unidade').sort({ stock: 1 }),
    mediaProdutor(id)
  ]);

  res.json({
    vendasMes: Math.round(doMes.reduce((s, o) => s + o.total, 0) * 100) / 100,
    encomendasMes: doMes.length,
    encomendasPorTratar: porTratar,
    produtosAtivos: produtos,
    stockBaixo,
    avaliacaoMedia: avaliacao.media,
    numAvaliacoes: avaliacao.total
  });
}));

// PUT /api/producers/eu (produtor) -> 200 | 400 : dados da página pública
router.put('/eu', auth('produtor'), a(async (req, res) => {
  const { nomeExploracao, descricao, localidade, localizacao } = req.body;
  const alteracoes = {};
  if (nomeExploracao !== undefined) alteracoes['produtor.nomeExploracao'] = nomeExploracao;
  if (descricao !== undefined) alteracoes['produtor.descricao'] = descricao;
  if (localidade !== undefined) alteracoes['produtor.localidade'] = localidade;
  if (localizacao !== undefined) {
    const lat = Number(localizacao?.lat);
    const lng = Number(localizacao?.lng);
    if (!(lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)) throw erro(400, 'Localização inválida');
    alteracoes['produtor.localizacao'] = { lat, lng };
  }
  const u = await User.findByIdAndUpdate(req.user.id, { $set: alteracoes }, { new: true, runValidators: true });
  if (!u) throw erro(404, 'Produtor não encontrado');
  res.json(u.publico());
}));

// GET /api/producers/:id -> 200 { produtor, produtos, avaliacoes, avaliacao } | 404
router.get('/:id', a(async (req, res) => {
  const u = await User.findOne({ _id: req.params.id, papel: 'produtor', 'produtor.validado': true }).select('nome produtor createdAt');
  if (!u) throw erro(404, 'Produtor não encontrado');
  const [produtos, avaliacoes, avaliacao] = await Promise.all([
    Product.find({ produtor: u._id }).sort({ nome: 1 }),
    Review.find({ produtor: u._id, visivel: true }).sort({ createdAt: -1 }).limit(20).populate('autor', 'nome'),
    mediaProdutor(u._id)
  ]);
  res.json({ produtor: u, produtos, avaliacoes, avaliacao });
}));

module.exports = router;
