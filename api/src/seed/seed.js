// Passo 4: apaga as coleções e insere dados de exemplo coerentes.
// Uso: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Review = require('../models/Review');

const MIN = 60 * 1000;
const DIA = 24 * 60 * MIN;

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([User, Product, Order, Auction, Bid, Review].map((M) => M.deleteMany()));
  await Promise.all([User, Review].map((M) => M.syncIndexes()));

  const passwordHash = await bcrypt.hash('password123', 12);
  const agora = Date.now();

  const [admin, tasca, ana, horta, mel, quinta, valeVerde] = await User.create([
    { nome: 'Sofia Carvalho', email: 'admin@exemplo.pt', passwordHash, papel: 'admin' },
    { nome: 'Tasca do Lima', email: 'tasca@exemplo.pt', passwordHash, papel: 'comprador' },
    { nome: 'Ana Ferreira', email: 'ana@exemplo.pt', passwordHash, papel: 'comprador' },
    { nome: 'Horta da Ribeira', email: 'horta@exemplo.pt', passwordHash, papel: 'produtor',
      produtor: { nomeExploracao: 'Horta da Ribeira', localidade: 'Ponte de Lima', validado: true,
        descricao: 'Hortícolas e fruta da época, em modo biológico, nas margens do rio Lima.',
        localizacao: { lat: 41.7672, lng: -8.5839 } } },
    { nome: 'Mel do Soajo', email: 'mel@exemplo.pt', passwordHash, papel: 'produtor',
      produtor: { nomeExploracao: 'Mel do Soajo', localidade: 'Arcos de Valdevez', validado: true,
        descricao: 'Apicultura familiar na serra da Peneda desde 1987. Mel de urze e de castanheiro, extraído a frio e sem aditivos.',
        localizacao: { lat: 41.8731, lng: -8.2634 } } },
    { nome: 'Quinta da Lameira', email: 'quinta@exemplo.pt', passwordHash, papel: 'produtor',
      produtor: { nomeExploracao: 'Quinta da Lameira', localidade: 'Monção', validado: true,
        descricao: 'Vinhos Verdes da casta Alvarinho, produzidos em Monção por três gerações.',
        localizacao: { lat: 42.0785, lng: -8.4807 } } },
    { nome: 'Casa do Vale Verde', email: 'valeverde@exemplo.pt', passwordHash, papel: 'produtor',
      produtor: { nomeExploracao: 'Casa do Vale Verde', localidade: 'Caminha', validado: false,
        descricao: 'Hortícolas biológicos.', localizacao: { lat: 41.8748, lng: -8.8382 } } }
  ]);

  const [kiwi, abobora, couve, castanha, broa, melUrze, melCastanheiro, polen, alvarinho, reserva, espumante, queijo] = await Product.create([
    { produtor: horta._id, nome: 'Kiwi Hayward', categoria: 'Fruta', preco: 2.4, unidade: 'kg', stock: 300, biologico: true,
      epocas: ['Outono', 'Inverno'], descricao: 'Kiwi de calibre A, colhido à mão.' },
    { produtor: horta._id, nome: 'Abóbora-menina', categoria: 'Hortícolas', preco: 1.2, unidade: 'kg', stock: 80,
      epocas: ['Outono'], descricao: 'Ideal para sopas e doce de abóbora.' },
    { produtor: horta._id, nome: 'Couve-galega', categoria: 'Hortícolas', preco: 1.5, unidade: 'molho', stock: 8, biologico: true,
      epocas: ['Outono', 'Inverno', 'Primavera'], descricao: 'Para o caldo verde.' },
    { produtor: horta._id, nome: 'Castanha longal', categoria: 'Fruta', preco: 4.5, unidade: 'kg', stock: 120,
      epocas: ['Outono'], descricao: 'Castanha doce e fácil de descascar.' },
    { produtor: horta._id, nome: 'Broa de milho', categoria: 'Padaria', preco: 3.2, unidade: 'unid.', stock: 20,
      epocas: ['Primavera', 'Verão', 'Outono', 'Inverno'], descricao: 'Farinha de milho e centeio, cozida em forno de lenha.' },
    { produtor: mel._id, nome: 'Mel de urze', categoria: 'Mel', preco: 7.5, unidade: '500 g', stock: 38, biologico: true,
      epocas: ['Verão', 'Outono'], descricao: 'Mel escuro e intenso da serra do Soajo.' },
    { produtor: mel._id, nome: 'Mel de castanheiro', categoria: 'Mel', preco: 7, unidade: '500 g', stock: 21,
      epocas: ['Outono'], descricao: 'Sabor forte, ligeiramente amargo.' },
    { produtor: mel._id, nome: 'Pólen fresco', categoria: 'Mel', preco: 6.2, unidade: '250 g', stock: 15,
      epocas: ['Primavera'], descricao: 'Pólen de abelha, conservar no frio.' },
    { produtor: quinta._id, nome: 'Alvarinho 2025', categoria: 'Vinho', preco: 9.9, unidade: 'garrafa', stock: 240,
      epocas: ['Primavera', 'Verão', 'Outono', 'Inverno'], descricao: 'Vinho Verde DOP, casta Alvarinho. Garrafa de 75 cl.' },
    { produtor: quinta._id, nome: 'Alvarinho Reserva 2024', categoria: 'Vinho', preco: 14.5, unidade: 'garrafa', stock: 6,
      epocas: ['Outono', 'Inverno'], descricao: 'Estágio de 8 meses em barrica.' },
    { produtor: quinta._id, nome: 'Espumante bruto', categoria: 'Vinho', preco: 12, unidade: 'garrafa', stock: 9,
      epocas: ['Inverno'], descricao: 'Método clássico.' },
    { produtor: quinta._id, nome: 'Queijo de cabra curado', categoria: 'Queijo', preco: 6.8, unidade: 'unid.', stock: 0,
      epocas: ['Primavera', 'Verão'], descricao: 'Cura de 60 dias. Produção limitada.' }
  ]);

  const linha = (p, quantidade) => ({ produto: p._id, nome: p.nome, precoUnit: p.preco, unidade: p.unidade, quantidade });

  const [, , entregueMel, entregueHorta] = await Order.create([
    { comprador: tasca._id, produtor: horta._id, linhas: [linha(kiwi, 2)], estado: 'pendente',
      entrega: { tipo: 'levantamento' } },
    { comprador: tasca._id, produtor: horta._id, linhas: [linha(kiwi, 3), linha(abobora, 4)], estado: 'pronta',
      entrega: { tipo: 'levantamento' }, createdAt: new Date(agora - 1 * DIA) },
    { comprador: tasca._id, produtor: mel._id, linhas: [linha(melUrze, 3)], estado: 'entregue',
      entrega: { tipo: 'entrega', morada: 'Largo de Camões 12, Ponte de Lima' }, createdAt: new Date(agora - 12 * DIA) },
    { comprador: ana._id, produtor: horta._id, linhas: [linha(couve, 4), linha(broa, 1)], estado: 'entregue',
      entrega: { tipo: 'levantamento' }, createdAt: new Date(agora - 6 * DIA) },
    { comprador: ana._id, produtor: quinta._id, linhas: [linha(alvarinho, 6), linha(espumante, 1)], estado: 'confirmada',
      entrega: { tipo: 'entrega', morada: 'Rua da Ribeira 14, Viana do Castelo' }, createdAt: new Date(agora - 2 * 3600e3) },
    { comprador: ana._id, produtor: mel._id, linhas: [linha(melCastanheiro, 2), linha(polen, 1)], estado: 'entregue',
      entrega: { tipo: 'levantamento' }, createdAt: new Date(agora - 20 * DIA) }
  ]);
  const entregueAna = await Order.findOne({ comprador: ana._id, produtor: mel._id });

  await Review.create([
    { autor: ana._id, produtor: horta._id, encomenda: entregueHorta._id, classificacao: 5,
      comentario: 'Couves fresquíssimas e a broa ainda vinha morna. Recomendo!' },
    { autor: ana._id, produtor: mel._id, encomenda: entregueAna._id, classificacao: 4, produto: melCastanheiro._id,
      nomeProduto: melCastanheiro.nome, comentario: 'Mel excelente, embalagem cuidada.' },
    // Avaliação denunciada, para o administrador moderar
    { autor: tasca._id, produtor: mel._id, encomenda: entregueMel._id, classificacao: 1,
      comentario: 'Visitem a minha loja online, preços muito mais baixos em www…',
      denuncias: 2, denunciadoPor: [mel._id, ana._id] }
  ]);

  const [leilaoKiwi] = await Auction.create([
    { produtor: horta._id, produto: kiwi._id, lote: '200 kg de kiwi Hayward, calibre A', quantidade: '200 kg',
      descricao: 'Excedente da colheita de outubro, em caixas de 10 kg.',
      precoBase: 200, incremento: 5, licitacaoAtual: { valor: 200 }, permitirEntrega: true,
      iniciaEm: new Date(agora), terminaEm: new Date(agora + 30 * MIN), estado: 'ativo' },
    { produtor: horta._id, produto: castanha._id, lote: '150 kg de castanha longal', quantidade: '150 kg',
      descricao: 'Colheita desta semana, calibrada. Levantamento na quinta.',
      precoBase: 300, incremento: 10, licitacaoAtual: { valor: 300 },
      iniciaEm: new Date(agora), terminaEm: new Date(agora + 45 * MIN), estado: 'ativo' },
    { produtor: quinta._id, produto: alvarinho._id, lote: 'Alvarinho 2025, caixa de 12 garrafas × 5', quantidade: '60 garrafas',
      descricao: 'Cinco caixas de 12 garrafas de 75 cl.',
      precoBase: 420, incremento: 10, licitacaoAtual: { valor: 420 }, permitirEntrega: true,
      iniciaEm: new Date(agora + 10 * MIN), terminaEm: new Date(agora + 40 * MIN), estado: 'agendado' }
  ]);

  // Três licitações já feitas no leilão do kiwi (o estado embebido acompanha o histórico)
  const licitacoes = [
    { comprador: ana, valor: 205, ha: 90 },
    { comprador: tasca, valor: 215, ha: 60 },
    { comprador: ana, valor: 220, ha: 20 }
  ];
  await Bid.create(licitacoes.map((b) => ({
    leilao: leilaoKiwi._id, comprador: b.comprador._id, nome: b.comprador.nome, valor: b.valor,
    createdAt: new Date(agora - b.ha * 1000)
  })));
  await Auction.updateOne({ _id: leilaoKiwi._id }, {
    licitacaoAtual: { valor: 220, comprador: ana._id, nome: ana.nome, em: new Date(agora - 20 * 1000) },
    numLicitacoes: licitacoes.length
  });

  console.log('Seed concluído. Utilizadores (password: password123):');
  [admin, tasca, ana, horta, mel, quinta, valeVerde].forEach((u) => {
    const nota = u.papel === 'produtor' && !u.produtor.validado ? '  (por validar)' : '';
    console.log(`  ${u.papel.padEnd(10)} ${u.email}${nota}`);
  });
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed falhou:', err.message);
  process.exit(1);
});
