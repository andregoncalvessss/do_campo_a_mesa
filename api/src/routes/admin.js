// Administração: validar produtores, moderar avaliações e painel global
const router = require('express').Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Auction = require('../models/Auction');
const Review = require('../models/Review');
const auth = require('../middleware/auth');
const a = require('../utils/async');
const erro = require('../utils/erro');

router.use(auth('admin')); // todas as rotas abaixo exigem o papel admin

// GET /api/admin/resumo -> 200 : indicadores do painel
router.get('/resumo', a(async (req, res) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const haUmaSemana = new Date(Date.now() - 7 * 24 * 3600e3);

  const [utilizadores, novosSemana, produtoresAtivos, produtoresPorValidar, encomendasHoje, leiloesAtivos, denunciadas] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: haUmaSemana } }),
    User.countDocuments({ papel: 'produtor', 'produtor.validado': true }),
    User.countDocuments({ papel: 'produtor', 'produtor.validado': { $ne: true } }),
    Order.find({ createdAt: { $gte: hoje } }),
    Auction.countDocuments({ estado: 'ativo' }),
    Review.countDocuments({ denuncias: { $gt: 0 }, visivel: true })
  ]);

  const io = req.app.get('io');
  res.json({
    utilizadores,
    novosSemana,
    produtoresAtivos,
    produtoresPorValidar,
    encomendasHoje: encomendasHoje.length,
    vendasHoje: Math.round(encomendasHoje.reduce((s, o) => s + o.total, 0) * 100) / 100,
    leiloesAtivos,
    avaliacoesDenunciadas: denunciadas,
    socketsLigados: io ? io.engine.clientsCount : 0
  });
}));

// GET /api/admin/utilizadores?papel -> 200
router.get('/utilizadores', a(async (req, res) => {
  const filtro = {};
  if (req.query.papel) filtro.papel = req.query.papel;
  res.json(await User.find(filtro).sort({ createdAt: -1 }).limit(200));
}));

// GET /api/admin/produtores?validado=false -> 200 : pedidos de registo de produtores
router.get('/produtores', a(async (req, res) => {
  const filtro = { papel: 'produtor' };
  if (req.query.validado === 'false') filtro['produtor.validado'] = { $ne: true };
  if (req.query.validado === 'true') filtro['produtor.validado'] = true;
  res.json(await User.find(filtro).sort({ createdAt: 1 }));
}));

// PATCH /api/admin/produtores/:id { aprovado } -> 200 (aprovado) | 204 (rejeitado e removido) | 404 | 409
router.patch('/produtores/:id', a(async (req, res) => {
  if (typeof req.body.aprovado !== 'boolean') throw erro(400, 'Indique "aprovado": true ou false');

  if (req.body.aprovado) {
    const u = await User.findOneAndUpdate(
      { _id: req.params.id, papel: 'produtor' },
      { $set: { 'produtor.validado': true } },
      { new: true }
    );
    if (!u) throw erro(404, 'Produtor não encontrado');
    req.app.get('io')?.to(`user:${u._id}`).emit('conta-validada');
    return res.json(u.publico());
  }

  // Rejeitar: só se remove um pedido que ainda não foi validado
  const r = await User.deleteOne({ _id: req.params.id, papel: 'produtor', 'produtor.validado': { $ne: true } });
  if (!r.deletedCount) {
    const existe = await User.exists({ _id: req.params.id, papel: 'produtor' });
    throw erro(existe ? 409 : 404, existe ? 'O produtor já foi validado' : 'Produtor não encontrado');
  }
  res.status(204).end();
}));

// GET /api/admin/avaliacoes?denunciadas=true -> 200
router.get('/avaliacoes', a(async (req, res) => {
  const filtro = {};
  if (req.query.denunciadas === 'true') Object.assign(filtro, { denuncias: { $gt: 0 }, visivel: true });
  const lista = await Review.find(filtro).sort({ denuncias: -1, createdAt: -1 }).limit(100)
    .populate('autor', 'nome')
    .populate('produtor', 'nome produtor.nomeExploracao');
  res.json(lista);
}));

// PATCH /api/admin/avaliacoes/:id { visivel } -> 200 | 400 | 404
// visivel: false oculta a avaliação; visivel: true mantém-na e limpa as denúncias
router.patch('/avaliacoes/:id', a(async (req, res) => {
  if (typeof req.body.visivel !== 'boolean') throw erro(400, 'Indique "visivel": true ou false');
  const r = await Review.findByIdAndUpdate(
    req.params.id,
    req.body.visivel ? { visivel: true, denuncias: 0, denunciadoPor: [] } : { visivel: false },
    { new: true }
  );
  if (!r) throw erro(404, 'Avaliação não encontrada');
  res.json(r);
}));

module.exports = router;
