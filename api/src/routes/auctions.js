// Leilões: consulta e criação. As licitações são feitas por Socket.io (sockets/leiloes.js).
const router = require('express').Router();
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const produtorValidado = require('../middleware/produtorValidado');
const a = require('../utils/async');
const erro = require('../utils/erro');

const MIN = 60 * 1000;
const POPULAR = ['produtor', 'nome produtor.localidade produtor.nomeExploracao'];

// GET /api/auctions?estado&produtor -> 200
router.get('/', a(async (req, res) => {
  const { estado, produtor } = req.query;
  const filtro = {};
  if (estado) filtro.estado = { $in: String(estado).split(',') };
  if (produtor) filtro.produtor = produtor;
  const lista = await Auction.find(filtro).sort({ terminaEm: 1 }).limit(100).populate(...POPULAR);
  res.json(lista);
}));

// GET /api/auctions/:id -> 200 | 404
router.get('/:id', a(async (req, res) => {
  const l = await Auction.findById(req.params.id).populate(...POPULAR);
  if (!l) throw erro(404, 'Leilão não encontrado');
  res.json(l);
}));

// GET /api/auctions/:id/licitacoes -> 200 | 404 (histórico, mais recentes primeiro)
router.get('/:id/licitacoes', a(async (req, res) => {
  if (!(await Auction.exists({ _id: req.params.id }))) throw erro(404, 'Leilão não encontrado');
  const lista = await Bid.find({ leilao: req.params.id }).sort({ createdAt: -1 }).limit(100);
  res.json(lista);
}));

// POST /api/auctions (produtor validado) -> 201 + Location | 400 | 403 | 404
router.post('/', auth('produtor'), produtorValidado, a(async (req, res) => {
  const { lote, descricao, quantidade, produto, precoBase, incremento, iniciaEm, duracaoMin, terminaEm, permitirEntrega } = req.body;

  const agora = Date.now();
  const inicio = iniciaEm ? new Date(iniciaEm) : new Date(agora);
  if (Number.isNaN(inicio.getTime())) throw erro(400, 'Data de início inválida');
  // O fim vem da duração em minutos ou de uma data explícita
  const fim = terminaEm ? new Date(terminaEm) : new Date(inicio.getTime() + Number(duracaoMin) * MIN);
  if (Number.isNaN(fim.getTime())) throw erro(400, 'Indique a duração (minutos) ou a data de fim');
  if (fim <= inicio || fim.getTime() <= agora) throw erro(400, 'O leilão tem de terminar depois de começar e no futuro');

  if (produto && !(await Product.exists({ _id: produto, produtor: req.user.id }))) {
    throw erro(404, 'Produto não encontrado');
  }

  const l = await Auction.create({
    produtor: req.user.id,
    produto: produto || undefined,
    lote,
    descricao,
    quantidade,
    precoBase,
    incremento,
    permitirEntrega: !!permitirEntrega,
    licitacaoAtual: { valor: precoBase }, // começa no preço base, sem comprador
    iniciaEm: inicio,
    terminaEm: fim,
    estado: inicio.getTime() <= agora ? 'ativo' : 'agendado'
  });
  res.status(201).location(`/api/auctions/${l._id}`).json(l);
}));

module.exports = router;
