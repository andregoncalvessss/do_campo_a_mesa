// Passo 3: catálogo de produtos
const router = require('express').Router();
const Product = require('../models/Product');
const User = require('../models/User');
const auth = require('../middleware/auth');
const produtorValidado = require('../middleware/produtorValidado');
const { receberImagem, guardarImagem } = require('../services/imagens');
const a = require('../utils/async');
const erro = require('../utils/erro');

// Só estes campos podem vir do cliente (proteção contra mass assignment)
const CAMPOS = ['nome', 'descricao', 'categoria', 'preco', 'unidade', 'stock', 'biologico', 'epocas'];
const escolher = (obj) => Object.fromEntries(CAMPOS.filter((c) => obj[c] !== undefined).map((c) => [c, obj[c]]));
const escaparRegex = (t) => String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ORDENACAO = {
  recentes: { createdAt: -1 },
  preco_asc: { preco: 1 },
  preco_desc: { preco: -1 },
  nome: { nome: 1 }
};
const POPULAR = ['produtor', 'nome produtor.localidade produtor.nomeExploracao'];

// GET /api/products?q&categoria&precoMax&bio&epoca&produtor&localidade&ordenar -> 200
router.get('/', a(async (req, res) => {
  const { q, categoria, precoMax, bio, epoca, produtor, localidade, ordenar } = req.query;
  const filtro = {};
  if (q) {
    // Pesquisa por nome do produto, descrição (ingredientes) ou nome do produtor
    const rx = { $regex: escaparRegex(q), $options: 'i' };
    const produtores = await User.find({ papel: 'produtor', $or: [{ nome: rx }, { 'produtor.nomeExploracao': rx }] }).distinct('_id');
    filtro.$or = [{ nome: rx }, { descricao: rx }, { produtor: { $in: produtores } }];
  }
  if (categoria && categoria !== 'Todos') filtro.categoria = categoria;
  if (precoMax) filtro.preco = { $lte: Number(precoMax) };
  if (bio === 'true') filtro.biologico = true;
  if (epoca) filtro.epocas = { $in: [epoca] };
  if (produtor) filtro.produtor = produtor;
  if (localidade) {
    const daLocalidade = await User.find({
      papel: 'produtor', 'produtor.localidade': { $regex: escaparRegex(localidade), $options: 'i' }
    }).distinct('_id');
    filtro.produtor = produtor ? { $in: daLocalidade.filter((id) => id.equals(produtor)) } : { $in: daLocalidade };
  }
  const lista = await Product.find(filtro)
    .sort(ORDENACAO[ordenar] || ORDENACAO.recentes)
    .populate(...POPULAR);
  res.json(lista);
}));

// GET /api/products/:id -> 200 | 404
router.get('/:id', a(async (req, res) => {
  const p = await Product.findById(req.params.id).populate(...POPULAR);
  if (!p) throw erro(404, 'Produto não encontrado');
  res.json(p);
}));

// POST /api/products (produtor validado) -> 201 + Location | 400 | 401 | 403
router.post('/', auth('produtor'), produtorValidado, a(async (req, res) => {
  const p = await Product.create({ ...escolher(req.body), produtor: req.user.id });
  res.status(201).location(`/api/products/${p._id}`).json(p);
}));

// PUT /api/products/:id (produtor dono) -> 200 | 400 | 404
router.put('/:id', auth('produtor'), a(async (req, res) => {
  const p = await Product.findOneAndUpdate(
    { _id: req.params.id, produtor: req.user.id },
    escolher(req.body),
    { new: true, runValidators: true }
  );
  if (!p) throw erro(404, 'Produto não encontrado');
  res.json(p);
}));

// DELETE /api/products/:id (produtor dono) -> 204 | 404
router.delete('/:id', auth('produtor'), a(async (req, res) => {
  const r = await Product.deleteOne({ _id: req.params.id, produtor: req.user.id });
  if (!r.deletedCount) throw erro(404, 'Produto não encontrado');
  res.status(204).end();
}));

// POST /api/products/:id/imagem (produtor dono, multipart "imagem") -> 200 | 400 | 404
router.post('/:id/imagem', auth('produtor'), receberImagem, a(async (req, res) => {
  if (!req.file) throw erro(400, 'Envie um ficheiro no campo "imagem"');
  const existe = await Product.exists({ _id: req.params.id, produtor: req.user.id });
  if (!existe) throw erro(404, 'Produto não encontrado');
  const imagemUrl = await guardarImagem(req.file, req);
  const p = await Product.findByIdAndUpdate(req.params.id, { imagemUrl }, { new: true });
  res.json(p);
}));

module.exports = router;
