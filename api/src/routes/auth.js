// Passo 6: registo, login e sessão atual
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const a = require('../utils/async');
const erro = require('../utils/erro');

function emitirToken(u) {
  return jwt.sign({ id: u._id.toString(), papel: u.papel, nome: u.nome },
    process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '2h' });
}

// POST /api/auth/registo -> 201 { token, utilizador } | 400 | 409
router.post('/registo', a(async (req, res) => {
  const { nome, email, password, papel, produtor = {} } = req.body;
  if (typeof password !== 'string' || password.length < 8) {
    throw erro(400, 'A password tem de ter pelo menos 8 caracteres');
  }
  // O papel admin nunca pode ser escolhido no registo
  const papelFinal = papel === 'produtor' ? 'produtor' : 'comprador';
  if (papelFinal === 'produtor' && !(produtor.nomeExploracao && produtor.localidade)) {
    throw erro(400, 'Indique o nome da exploração e a localidade');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const u = await User.create({
    nome,
    email,
    passwordHash,
    papel: papelFinal,
    ...(papelFinal === 'produtor' ? {
      produtor: {
        nomeExploracao: produtor.nomeExploracao,
        descricao: produtor.descricao,
        localidade: produtor.localidade,
        localizacao: produtor.localizacao,
        validado: false // fica a aguardar o administrador
      }
    } : {})
  });
  req.app.get('io')?.to('admins').emit('novo-produtor', { nome: u.nome });
  res.status(201).json({ token: emitirToken(u), utilizador: u.publico() });
}));

// POST /api/auth/login -> 200 { token, utilizador } | 401
router.post('/login', a(async (req, res) => {
  const { email, password } = req.body;
  const u = await User.findOne({ email: String(email || '').toLowerCase() }).select('+passwordHash');
  if (!u || !(await bcrypt.compare(String(password || ''), u.passwordHash))) {
    throw erro(401, 'Credenciais inválidas');
  }
  res.json({ token: emitirToken(u), utilizador: u.publico() });
}));

// GET /api/auth/eu -> 200 utilizador | 401
router.get('/eu', auth(), a(async (req, res) => {
  const u = await User.findById(req.user.id);
  if (!u) throw erro(401, 'Token inválido ou em falta');
  res.json(u.publico());
}));

module.exports = router;
