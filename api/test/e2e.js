// Semana 7: teste de ponta a ponta. Usa a API real (fetch) e clientes socket.io-client,
// tal como a SPA. Correr com a API ligada e depois do seed:  npm run seed && npm test
const { io } = require('socket.io-client');

const URL_API = process.env.API_URL || 'http://localhost:3000';
let falhas = 0;
let total = 0;

function ok(condicao, descricao) {
  total += 1;
  if (!condicao) falhas += 1;
  console.log(`  ${condicao ? '✔' : '✘'} ${descricao}`);
}

async function pedir(caminho, { metodo = 'GET', corpo, token } = {}) {
  const r = await fetch(`${URL_API}/api${caminho}`, {
    method: metodo,
    headers: {
      ...(corpo ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  const dados = r.status === 204 ? null : await r.json().catch(() => null);
  return { status: r.status, dados, headers: r.headers };
}

const login = async (email, password = 'password123') => (await pedir('/auth/login', { metodo: 'POST', corpo: { email, password } })).dados;
const ligar = (token) => new Promise((res, rej) => {
  const s = io(URL_API, { auth: { token }, transports: ['websocket'], forceNew: true });
  s.once('connect', () => res(s));
  s.once('connect_error', rej);
});
// Envolve o emit com callback (ack) numa Promise
const emitir = (s, ev, d) => new Promise((res) => s.emit(ev, d, res));
// Espera por um evento (ou devolve null ao fim do tempo limite)
const esperar = (s, ev, ms = 8000) => new Promise((res) => {
  const t = setTimeout(() => res(null), ms);
  s.once(ev, (d) => { clearTimeout(t); res(d ?? true); });
});
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function correr() {
  const sufixo = Date.now();

  console.log('\nAutenticação e papéis');
  const saude = await pedir('/health');
  ok(saude.status === 200 && saude.dados.estado === 'ok', 'GET /health -> 200');
  ok((await pedir('/auth/login', { metodo: 'POST', corpo: { email: 'tasca@exemplo.pt', password: 'errada' } })).status === 401,
    'login com password errada -> 401');
  const inexistente = await pedir('/auth/login', { metodo: 'POST', corpo: { email: 'ninguem@exemplo.pt', password: 'x' } });
  ok(inexistente.status === 401 && inexistente.dados.erro === 'Credenciais inválidas', 'email inexistente -> mesma mensagem 401');

  const tasca = await login('tasca@exemplo.pt');
  const ana = await login('ana@exemplo.pt');
  const horta = await login('horta@exemplo.pt');
  const mel = await login('mel@exemplo.pt');
  const admin = await login('admin@exemplo.pt');
  ok(tasca.token && tasca.utilizador.papel === 'comprador', 'login de comprador -> token e papel');
  ok(!JSON.stringify([tasca, horta, admin]).includes('passwordHash'), 'nenhuma resposta contém passwordHash');
  ok((await pedir('/orders')).status === 401, 'sem token -> 401');
  ok((await pedir('/products', { metodo: 'POST', token: tasca.token, corpo: { nome: 'X', categoria: 'Fruta', preco: 1 } })).status === 403,
    'comprador numa rota de produtor -> 403');
  ok((await pedir('/admin/resumo', { token: horta.token })).status === 403, 'produtor numa rota de admin -> 403');

  const novo = await pedir('/auth/registo', {
    metodo: 'POST',
    corpo: { nome: 'Quinta Teste', email: `quinta${sufixo}@teste.pt`, password: 'password123', papel: 'produtor',
      produtor: { nomeExploracao: 'Quinta Teste', localidade: 'Caminha' } }
  });
  ok(novo.status === 201 && novo.dados.token, 'registo de produtor -> 201 com token');
  ok((await pedir('/auth/registo', { metodo: 'POST', corpo: { nome: 'Repetido', email: `quinta${sufixo}@teste.pt`, password: 'password123' } })).status === 409,
    'email repetido -> 409');
  const comoAdmin = await pedir('/auth/registo', { metodo: 'POST', corpo: { nome: 'Esperto', email: `esperto${sufixo}@teste.pt`, password: 'password123', papel: 'admin' } });
  ok(comoAdmin.dados.utilizador.papel === 'comprador', 'registo nunca cria administradores');
  ok((await pedir('/products', { metodo: 'POST', token: novo.dados.token, corpo: { nome: 'X', categoria: 'Fruta', preco: 1 } })).status === 403,
    'produtor por validar não pode publicar produtos -> 403');

  console.log('\nProdutos e pesquisa');
  const meis = await pedir('/products?q=mel&categoria=Mel');
  // "mel" também apanha o produtor "Mel do Soajo": a pesquisa cobre nome, descrição e produtor
  ok(meis.dados.filter((p) => /mel/i.test(p.nome)).length === 2 && meis.dados.every((p) => p.categoria === 'Mel'),
    'pesquisa $regex + categoria devolve os 2 méis');
  const baratos = await pedir('/products?precoMax=2&ordenar=preco_asc');
  ok(baratos.dados.length > 0 && baratos.dados.every((p, i, l) => p.preco <= 2 && (i === 0 || l[i - 1].preco <= p.preco)),
    'filtro $lte e ordenação por preço');
  const outono = await pedir('/products?epoca=Outono&bio=true');
  ok(outono.dados.length > 0 && outono.dados.every((p) => p.biologico && p.epocas.includes('Outono')), 'filtro por época ($in) e biológico');
  ok((await pedir('/products?q=(')).status === 200, 'pesquisa com "(" não rebenta (regex escapada)');
  ok((await pedir('/products/abc')).status === 400, 'id inválido -> 400');
  ok((await pedir('/nao-existe')).status === 404, 'rota desconhecida -> 404');

  const invalido = await pedir('/products', { metodo: 'POST', token: horta.token, corpo: { nome: 'X', preco: 1 } });
  ok(invalido.status === 400 && invalido.dados.detalhes?.categoria, 'produto sem categoria -> 400 com o campo em detalhes');
  const criado = await pedir('/products', {
    metodo: 'POST', token: horta.token,
    corpo: { nome: `Maçã de teste ${sufixo}`, categoria: 'Fruta', preco: 1.8, unidade: 'kg', stock: 50, produtor: 'outro', imagemUrl: 'http://x' }
  });
  const produto = criado.dados;
  ok(criado.status === 201 && criado.headers.get('location') === `/api/products/${produto._id}`, 'criar produto -> 201 com cabeçalho Location');
  ok(produto.produtor === horta.utilizador.id && !produto.imagemUrl, 'campos não permitidos são ignorados (mass assignment)');
  ok((await pedir(`/products/${produto._id}`, { metodo: 'PUT', token: mel.token, corpo: { preco: 0.01 } })).status === 404,
    'outro produtor não pode alterar -> 404');
  const alterado = await pedir(`/products/${produto._id}`, { metodo: 'PUT', token: horta.token, corpo: { preco: 2 } });
  ok(alterado.status === 200 && alterado.dados.preco === 2, 'produtor dono altera o preço -> 200');
  ok((await pedir(`/products/${produto._id}`, { metodo: 'PUT', token: horta.token, corpo: { preco: -1 } })).status === 400,
    'preço negativo -> 400 (runValidators)');

  console.log('\nEncomendas, stock e notificações');
  const sTasca = await ligar(tasca.token);
  const sAna = await ligar(ana.token);
  const sHorta = await ligar(horta.token);
  let recusado = false;
  try { await ligar('token-falso'); } catch { recusado = true; }
  ok(recusado, 'socket sem token válido é recusado');

  ok((await pedir('/orders', { metodo: 'POST', token: tasca.token, corpo: { linhas: [{ produto: produto._id, quantidade: 51 }] } })).status === 409,
    'stock insuficiente -> 409');
  const avisoProdutor = esperar(sHorta, 'nova-encomenda');
  const enc = await pedir('/orders', { metodo: 'POST', token: tasca.token, corpo: { linhas: [{ produto: produto._id, quantidade: 2 }] } });
  const encomenda = enc.dados?.[0];
  ok(enc.status === 201 && encomenda.total === 4 && encomenda.linhas[0].precoUnit === 2, 'encomenda -> 201 com cópia do preço e total');
  ok(!!(await avisoProdutor), 'produtor recebe "nova-encomenda" em tempo real');
  // Uma linha válida seguida de uma impossível: o stock da primeira tem de ser reposto
  const kiwi = (await pedir('/products?q=Kiwi')).dados[0];
  const falhada = await pedir('/orders', {
    metodo: 'POST', token: tasca.token,
    corpo: { linhas: [{ produto: produto._id, quantidade: 5 }, { produto: kiwi._id, quantidade: 999999 }] }
  });
  const stockDepois = (await pedir(`/products/${produto._id}`)).dados.stock;
  ok(falhada.status === 409 && stockDepois === 48, 'stock reservado (50 -> 48) e reposto após falha');

  const avisoComprador = esperar(sTasca, 'encomenda-atualizada');
  const confirmada = await pedir(`/orders/${encomenda._id}/estado`, { metodo: 'PATCH', token: horta.token, corpo: { estado: 'confirmada' } });
  const aviso = await avisoComprador;
  ok(confirmada.status === 200 && aviso?.estado === 'confirmada', 'comprador recebe notificação em tempo real');
  ok((await pedir(`/orders/${encomenda._id}/estado`, { metodo: 'PATCH', token: horta.token, corpo: { estado: 'pendente' } })).status === 409,
    'estado não pode recuar -> 409');
  ok((await pedir(`/orders/${encomenda._id}/estado`, { metodo: 'PATCH', token: mel.token, corpo: { estado: 'pronta' } })).status === 404,
    'outro produtor não muda o estado -> 404');
  ok((await pedir('/reviews', { metodo: 'POST', token: tasca.token, corpo: { encomenda: encomenda._id, classificacao: 5 } })).status === 409,
    'não avalia antes da entrega -> 409');
  await pedir(`/orders/${encomenda._id}/estado`, { metodo: 'PATCH', token: horta.token, corpo: { estado: 'entregue' } });
  const avaliacao = await pedir('/reviews', { metodo: 'POST', token: tasca.token, corpo: { encomenda: encomenda._id, classificacao: 5, comentario: 'Teste e2e' } });
  ok(avaliacao.status === 201, 'avalia depois da entrega -> 201');
  ok((await pedir('/reviews', { metodo: 'POST', token: tasca.token, corpo: { encomenda: encomenda._id, classificacao: 4 } })).status === 409,
    'não avalia duas vezes -> 409');
  ok((await pedir('/orders', { token: ana.token })).dados.every((o) => (o.comprador._id || o.comprador) === ana.utilizador.id),
    'cada comprador só vê as suas encomendas');

  console.log('\nLeilões em tempo real');
  const fim = new Date(Date.now() + 9000).toISOString();
  const lei = await pedir('/auctions', {
    metodo: 'POST', token: horta.token,
    corpo: { lote: `Lote de teste ${sufixo}`, quantidade: '10 kg', precoBase: 100, incremento: 5, terminaEm: fim }
  });
  const leilao = lei.dados;
  ok(lei.status === 201 && leilao.estado === 'ativo' && leilao.licitacaoAtual.valor === 100, 'criar leilão -> 201, ativo, a começar no preço base');

  const estado = esperar(sAna, 'estado');
  sAna.emit('entrar', leilao._id);
  sTasca.emit('entrar', leilao._id);
  const e = await estado;
  ok(e?.leilao?._id === leilao._id && !!e.agora, 'ao entrar recebe o estado e a hora do servidor');
  await dormir(300);
  const presenca = esperar(sAna, 'presenca');
  sHorta.emit('entrar', leilao._id);
  ok((await presenca) === 3, 'presença: 3 participantes na sala');

  const baixo = await emitir(sAna, 'licitar', { leilaoId: leilao._id, valor: 102 });
  ok(baixo.ok === false && /mínima/.test(baixo.erro), 'licitação abaixo do mínimo é recusada');
  const doProdutor = await emitir(sHorta, 'licitar', { leilaoId: leilao._id, valor: 105 });
  ok(doProdutor.ok === false, 'produtor não pode licitar');

  const broadcast = esperar(sHorta, 'nova-licitacao');
  const [x, y] = await Promise.all([
    emitir(sAna, 'licitar', { leilaoId: leilao._id, valor: 105 }),
    emitir(sTasca, 'licitar', { leilaoId: leilao._id, valor: 105 })
  ]);
  ok([x, y].filter((z) => z.ok).length === 1, 'duas licitações simultâneas de 105 €: só UMA é aceite');
  ok((await broadcast)?.valor === 105, 'a sala recebe a nova licitação (broadcast)');

  // Rajada: 10 licitações concorrentes com valores repetidos
  const valores = [110, 110, 115, 115, 120, 120, 125, 125, 130, 130];
  const rajada = await Promise.all(valores.map((valor, i) => emitir(i % 2 ? sAna : sTasca, 'licitar', { leilaoId: leilao._id, valor })));
  const aceites = rajada.filter((r) => r.ok).length;
  const historico = (await pedir(`/auctions/${leilao._id}/licitacoes`)).dados;
  ok(historico.length === aceites + 1, `rajada de 10: aceites (${aceites}) = registadas`);
  const ordenado = [...historico].reverse().map((b) => b.valor);
  ok(ordenado.every((v, i) => (i === 0 ? v >= 105 : v >= ordenado[i - 1] + 5)), 'cada licitação aceite >= anterior + incremento');
  const atual = (await pedir(`/auctions/${leilao._id}`)).dados;
  ok(atual.licitacaoAtual.valor === Math.max(...ordenado) && atual.numLicitacoes === historico.length, 'licitação atual embebida = maior licitação do histórico');

  const vencedorEsperado = atual.licitacaoAtual.comprador;
  const sVencedor = vencedorEsperado === ana.utilizador.id ? sAna : sTasca;
  const tokenVencedor = vencedorEsperado === ana.utilizador.id ? ana.token : tasca.token;
  const ganho = esperar(sVencedor, 'leilao-ganho', 20000);
  const terminado = await esperar(sHorta, 'terminado', 20000);
  ok(terminado?.vencedor?.id === vencedorEsperado && terminado.valor === atual.licitacaoAtual.valor, 'leilão fecha e anuncia o vencedor à sala');
  const premio = await ganho;
  const tarde = await emitir(sAna, 'licitar', { leilaoId: leilao._id, valor: 999 });
  ok(tarde.ok === false && /não está ativo/.test(tarde.erro), 'licitação depois do fim é recusada');
  const doVencedor = (await pedir('/orders', { token: tokenVencedor })).dados;
  ok(!!premio && doVencedor.some((o) => o.origem === 'leilao' && o.leilao === leilao._id && o.estado === 'confirmada' && o.total === atual.licitacaoAtual.valor),
    'vencedor recebe encomenda do lote');

  const antes = esperar(sHorta, 'presenca');
  sTasca.disconnect();
  ok((await antes) === 2, 'ao desligar, a presença baixa');

  console.log('\nAdministração');
  const pendentes = await pedir('/admin/produtores?validado=false', { token: admin.token });
  ok(pendentes.dados.some((u) => u._id === novo.dados.utilizador.id), 'admin vê o produtor por validar');
  const aprovado = await pedir(`/admin/produtores/${novo.dados.utilizador.id}`, { metodo: 'PATCH', token: admin.token, corpo: { aprovado: true } });
  const jaPode = await pedir('/products', { metodo: 'POST', token: novo.dados.token, corpo: { nome: 'Alface', categoria: 'Hortícolas', preco: 1 } });
  ok(aprovado.status === 200 && jaPode.status === 201, 'admin aprova produtor · produtor passa a publicar');
  await pedir(`/reviews/${avaliacao.dados._id}/denunciar`, { metodo: 'POST', token: horta.token });
  const repetida = await pedir(`/reviews/${avaliacao.dados._id}/denunciar`, { metodo: 'POST', token: horta.token });
  ok(repetida.dados.denuncias === 1, 'a mesma pessoa só denuncia uma vez');
  const oculta = await pedir(`/admin/avaliacoes/${avaliacao.dados._id}`, { metodo: 'PATCH', token: admin.token, corpo: { visivel: false } });
  const visiveis = (await pedir(`/reviews?produtor=${horta.utilizador.id}`)).dados;
  ok(oculta.status === 200 && !visiveis.some((r) => r._id === avaliacao.dados._id), 'admin oculta avaliação · deixa de ser pública');
  const resumo = await pedir('/admin/resumo', { token: admin.token });
  ok(resumo.status === 200 && resumo.dados.utilizadores >= 7 && resumo.dados.encomendasHoje >= 1, 'painel global com contagens');

  // Limpeza do que este teste criou
  await pedir(`/products/${jaPode.dados._id}`, { metodo: 'DELETE', token: novo.dados.token });
  ok((await pedir(`/products/${produto._id}`, { metodo: 'DELETE', token: horta.token })).status === 204, 'remover produto -> 204');
  ok((await pedir(`/products/${produto._id}`)).status === 404, 'produto removido -> 404');

  [sAna, sHorta].forEach((s) => s.disconnect());
}

correr()
  .catch((err) => { falhas += 1; console.error('\nErro inesperado:', err); })
  .finally(() => {
    console.log(`\n${total - Math.min(falhas, total)} / ${total} verificações a passar`);
    console.log(falhas ? `${falhas} falha(s)` : 'Todos os testes passaram');
    process.exit(falhas ? 1 : 0);
  });
