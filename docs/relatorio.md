# Do Campo à Mesa — Relatório

**Desenvolvimento Web e para a Cloud** · Mestrado em Engenharia Informática · IPVC – ESTG · 2026/2027
**Autor:** _(nome e número de estudante)_
**Repositório:** _(URL)_ · **Aplicação:** _(URL público)_ · **Swagger UI:** _(URL público)/api-docs_

> Nota para a entrega: os campos em _itálico entre parênteses_ ficam por preencher (identificação, URLs públicos
> depois do Passo 8, capturas de ecrã). As secções 9 e 10 devem ser revistas pelo autor, porque descrevem a sua
> experiência pessoal e o uso que fez das ferramentas.

## 1. Introdução

O **Do Campo à Mesa** é uma plataforma web que liga pequenos produtores agrícolas do Alto Minho (hortícolas, fruta,
mel, vinho, queijo) a consumidores e à restauração local. Os produtores publicam produtos e os compradores fazem
encomendas, para levantar na quinta ou receber em casa. Para lotes sazonais ou excedentes, a plataforma organiza
leilões em direto, com vários compradores a licitar em simultâneo.

O trabalho junta duas vertentes: **gestão de dados** (produtos, encomendas, produtores, avaliações) e **interação em
tempo real** (leilões e notificações). Há quatro intervenientes:

| Interveniente | O que faz |
|---|---|
| Visitante | Explora o catálogo (categoria, produtor, localidade, época, modo biológico), vê a página pública de cada produtor com mapa e regista-se |
| Comprador | Carrinho e encomendas (levantamento ou entrega), acompanha os estados, avalia e licita em leilões |
| Produtor | Gere catálogo, preços, stock, fotografias e página pública; muda o estado das encomendas; cria leilões; consulta estatísticas |
| Administrador | Valida produtores, modera avaliações denunciadas e tem um painel global de utilizadores, encomendas e leilões |

## 2. Arquitetura

```
                 ┌────────────────────── Cloud (Azure, PaaS) ──────────────────────┐
                 │                                                                  │
 Browser         │  API REST (Node.js · Express)      Mongoose     MongoDB Atlas    │
 SPA React  ─────┼─▶ JWT · Swagger UI ───────────────────────────▶ users · products │
 Bootstrap·SASS  │        ▲  io partilhado                         orders · auctions│
     ▲           │        ▼                                        bids · reviews   │
     └───────────┼─▶ Socket.io (mesmo processo)        upload                       │
   WebSocket     │   salas por leilão e por utilizador ─────────▶ Blob Storage      │
                 └──────────────────────────────────────────────────────────────────┘
```

- **SPA** (`web/`): React 18 com Vite, react-router 6, Bootstrap 5.3 e SASS. Fala com o servidor só por HTTP (JSON) e WebSocket.
- **API REST** (`api/`): Express 4. Recursos por URI, verbos e códigos HTTP corretos, validação e autorização no servidor.
- **Socket.io**: corre no mesmo processo Node.js e no mesmo servidor HTTP que a API. As rotas REST usam o objeto `io`
  (através de `req.app.get('io')`) para enviar notificações, sem conhecerem os sockets.
- **MongoDB Atlas**: seis coleções, acedidas com Mongoose.
- **Storage na Cloud**: as fotografias dos produtos ficam no Azure Blob Storage; o documento do produto só guarda o URL.

O repositório tem duas aplicações independentes, cada uma com o seu `package.json`. No servidor há uma pasta por
responsabilidade (`models`, `routes`, `sockets`, `services`, `middleware`): os modelos não conhecem as rotas e as rotas
não conhecem os sockets. O `app.js` configura o Express sem abrir portas e o `server.js` cria o servidor HTTP, liga o
Socket.io e arranca o ciclo dos leilões.

## 3. Frontend e SPA

**Framework.** Escolhi React com Vite: componentes de função com hooks, um servidor de desenvolvimento rápido e um
build para ficheiros estáticos que pode ser publicado num serviço de alojamento estático com CDN.

**Mobile First e breakpoints.** Os estilos base são os do telemóvel; os ecrãs maiores acrescentam regras com
`min-width`. Os três breakpoints estão num mapa SASS e são usados através de um mixin:

```scss
$breakpoints: (md: 768px, lg: 1024px, xl: 1280px);
@mixin a-partir-de($bp) { @media (min-width: map-get($breakpoints, $bp)) { @content; } }

.grelha-produtos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));                              // telemóvel
  @include a-partir-de(md) { grid-template-columns: repeat(3, minmax(0, 1fr)); } // tablet
  @include a-partir-de(xl) { grid-template-columns: repeat(4, minmax(0, 1fr)); } // desktop
}
```

Outros exemplos de adaptação: a navegação passa de menu colapsável mais barra inferior (telemóvel) para barra
completa (≥ 1024 px); a sala de leilão passa de uma coluna para duas, com o painel de licitação fixo; a lista de
encomendas do produtor passa de cartões para tabela a partir de 768 px.

**SASS.** Parciais `_variables`, `_mixins`, `_base`, `_catalogo`, `_leiloes` e `_paineis`, importados por esta ordem em
`main.scss`. As variáveis do Bootstrap (`$primary`, `$body-bg`, …) são definidas antes de o importar, para o tema usar
a paleta da aplicação. Mapas com `@each` geram uma classe de cor por categoria (`.cat-mel`, …) e por estado da
encomenda (`.estado--pronta`, …), sem repetir cores.

**Bootstrap.** Grelha e utilitários, `navbar` colapsável, `card`, formulários, botões, `btn-check` e alertas.

**HTML semântico e acessibilidade.** `header`, `nav`, `main`, `footer`, `section` e `article`; todos os campos têm
`label`; os botões só com ícone têm `aria-label`; o estado nunca é comunicado só pela cor (cor + texto); link "Saltar
para o conteúdo"; `aria-live` nas notificações e na licitação atual; `prefers-reduced-motion` desliga as animações.

**Componentes.** Reutilizáveis: `CartaoProduto` (catálogo e página do produtor), `CartaoLeilao` (catálogo, lista de
leilões e painel do produtor), `EstadoEncomenda` (linha temporal), `Navbar`, `NavInferior`, `Notificacoes`,
`RotaProtegida`, `Icone`. Os dados descem por props e as ações sobem por callbacks (`onAdicionar`).

**Estado global.** Três contextos: `AuthContext` (sessão `{ token, utilizador }`, guardada no `localStorage`),
`SocketContext` (uma ligação por sessão) e `CarrinhoContext` (carrinho, também no `localStorage`, para sobreviver a
um refresh). O estado local fica em `useState`.

**Routing.** `react-router` com `BrowserRouter`. As rotas estão agrupadas por papel dentro de `RotaProtegida`, que
redireciona para `/login` (guardando a página pedida) ou para o catálogo se o papel não servir. É só conveniência: a
API valida sempre o papel.

| Rota | Página | Quem |
|---|---|---|
| `/`, `/produtores`, `/produtores/:id`, `/leiloes`, `/login`, `/registo` | Catálogo, produtores, leilões, autenticação | todos |
| `/leiloes/:id` | Sala de leilão | autenticado (só compradores licitam) |
| `/carrinho`, `/encomendas` | Carrinho e encomendas | comprador |
| `/produtor`, `/produtor/produtos`, `/produtor/leiloes/novo` | Painel, catálogo e criação de leilão | produtor |
| `/admin` | Painel de administração | administrador |

**Hooks próprios.** `useApi` (pedidos GET com estados "a carregar" e erro), `useLeilao` (eventos da sala) e
`useContagem` (contagem decrescente). No catálogo, os filtros são um único objeto de estado ligado ao formulário
(data binding) e o pedido à API só é feito 300 ms depois da última tecla (debounce).

_(Inserir capturas: catálogo a 390 px e a 1360 px; sala de leilão; painel do produtor; painel do administrador.)_

## 4. API REST

Documentação interativa: _(URL público)/api-docs_ (em desenvolvimento, `http://localhost:3000/api-docs`).

| Verbo | URI | Quem | Sucesso | Erros |
|---|---|---|---|---|
| POST | `/api/auth/registo` · `/api/auth/login` | todos | 201 · 200 | 400 · 401 · 409 |
| GET | `/api/auth/eu` | autenticado | 200 | 401 |
| GET | `/api/products?q&categoria&precoMax&bio&epoca&produtor&localidade&ordenar` | todos | 200 | — |
| POST | `/api/products` | produtor validado | 201 + `Location` | 400 · 401 · 403 |
| GET · PUT · DELETE | `/api/products/:id` | todos · produtor dono | 200 · 200 · 204 | 400 · 404 |
| POST | `/api/products/:id/imagem` | produtor dono | 200 | 400 · 404 |
| GET | `/api/producers` · `/api/producers/:id` | todos | 200 | 404 |
| PUT · GET | `/api/producers/eu` · `/api/producers/eu/estatisticas` | produtor | 200 | 400 · 401 · 403 |
| POST | `/api/orders` | comprador | 201 | 400 · 404 · 409 (stock) |
| GET | `/api/orders` · `/api/orders/:id` | autenticado | 200 | 401 · 404 |
| PATCH | `/api/orders/:id/estado` | produtor | 200 | 400 · 404 · 409 |
| GET · POST | `/api/auctions` | todos · produtor validado | 200 · 201 | 400 · 403 |
| GET | `/api/auctions/:id` · `/api/auctions/:id/licitacoes` | todos | 200 | 404 |
| GET · POST | `/api/reviews` | todos · comprador | 200 · 201 | 400 · 404 · 409 |
| POST | `/api/reviews/:id/denunciar` | autenticado | 200 | 401 · 404 |
| GET · PATCH | `/api/admin/…` (resumo, utilizadores, produtores, avaliações) | administrador | 200 · 204 | 401 · 403 · 404 · 409 |

Decisões principais:

- **Erros num único sítio.** Os handlers assíncronos são envolvidos por um utilitário que passa os erros ao
  `errorHandler`. Este converte `ValidationError` e `CastError` em 400, chave duplicada (11000) em 409 e devolve
  apenas "Erro interno" nos 500, sem expor detalhes.
- **Reserva de stock atómica.** Encomendar usa `findOneAndUpdate({ _id, stock: { $gte: q } }, { $inc: { stock: -q } })`:
  a condição e a alteração são uma só operação, por isso dois pedidos simultâneos não vendem o mesmo stock. Se uma
  linha falhar (409), o stock já reservado é reposto.
- **Uma encomenda por produtor.** O carrinho pode ter produtos de vários produtores; a API agrupa as linhas e cria
  uma encomenda para cada um. Cada linha guarda cópia do nome e do preço no momento da compra.
- **Estados que só avançam.** `pendente → confirmada → pronta → entregue`. A verificação está no filtro do update
  (`estado: { $in: ESTADOS.slice(0, novo) }`); tentar recuar devolve 409.
- **Dono do recurso.** O produtor só altera o que é seu: os filtros incluem `produtor: req.user.id`, e um recurso de
  outro produtor devolve 404 (não revela que existe).

A especificação `openapi.yaml` (OpenAPI 3.0.3) descreve os 25 caminhos, com parâmetros, corpos e respostas. Os
schemas estão definidos uma vez em `components` e reutilizados com `$ref` e `allOf`; a autenticação está declarada
como `bearerAuth` (JWT).

## 5. Modelo de dados

Seis coleções: `users`, `products`, `orders`, `auctions`, `bids` e `reviews`.

| Relação | Decisão | Justificação |
|---|---|---|
| Encomenda → linhas | Embeber | Lidas sempre com a encomenda; poucas por encomenda; guardam cópia do nome e do preço no momento da compra |
| Utilizador → dados da exploração | Embeber (`users.produtor`) | Relação 1:1, sempre lida com o utilizador, pequena |
| Leilão → licitação atual | Embeber | Tem de ser atualizada de forma atómica no mesmo documento que o estado e o prazo |
| Leilão → licitações | Referenciar (`bids`) | Podem ser centenas; o documento do leilão não pode crescer sem limite (máx. 16 MB) |
| Produto → produtor | Referenciar | Um produtor tem muitos produtos; os dados do produtor mudam e não se querem cópias desatualizadas |
| Encomenda → comprador e produtor | Referenciar | Utilizadores são entidades independentes, consultadas noutros contextos |
| Avaliações | Referenciar (`reviews`) | Consultadas por produtor e moderadas pelo administrador de forma independente |

Regra seguida: embeber o que é lido em conjunto e é limitado; referenciar o que cresce sem limite, é partilhado ou é
consultado sozinho. Há duas cópias deliberadas (desnormalização): o nome e o preço nas linhas da encomenda, porque
são um registo histórico, e o nome do comprador em cada licitação, para mostrar o histórico sem `populate`.

**Validação no schema:** `required`, `enum` (categoria, épocas, papel, estados), `min`/`max` (preço, stock,
classificação 1–5), `match` e `unique` no email, `maxlength` nos textos. O hash da password tem `select: false`. A
coleção `reviews` tem um índice único `{ encomenda, autor }`: uma avaliação por encomenda. O total da encomenda é um
*virtual*, calculado a partir das linhas.

**Consultas com operadores:**

```js
// Pesquisa do catálogo
{ $or: [{ nome: { $regex: q, $options: 'i' } }, { descricao: { $regex: q, $options: 'i' } }, { produtor: { $in: ids } }] }
{ preco: { $lte: Number(precoMax) } }          { epocas: { $in: [epoca] } }
// Stock baixo (painel do produtor) e leilões expirados (ciclo de fecho)
Product.find({ produtor: id, stock: { $lt: 10 } })
Auction.find({ estado: 'ativo', terminaEm: { $lte: agora } })
// Reserva de stock
Product.findOneAndUpdate({ _id, stock: { $gte: q } }, { $inc: { stock: -q } })
```

O texto de pesquisa é escapado antes de ir para o `$regex`, para um utilizador não injetar expressões regulares.

## 6. Segurança

| Prática | Como está implementada | Onde |
|---|---|---|
| Passwords com hash | bcrypt, custo 12; campo com `select: false` | `routes/auth.js`, `models/User.js` |
| JWT com expiração | `{ id, papel, nome }`, 2 h, enviado em `Authorization: Bearer` | `routes/auth.js` |
| Autorização no servidor | `auth(...papeis)`: 401 sem token válido, 403 com papel errado | `middleware/auth.js` |
| Produtor por validar | 403 ao publicar produtos ou leilões | `middleware/produtorValidado.js` |
| Dono do recurso | Filtro `produtor: req.user.id` em todas as escritas | `routes/*` |
| Mass assignment | Só os campos permitidos são copiados de `req.body`; o papel `admin` nunca vem do registo | `routes/products.js`, `routes/auth.js` |
| Injeção em `$regex` | Texto de pesquisa escapado | `routes/products.js` |
| Enumeração de contas | Mesma resposta 401 para email inexistente e password errada | `routes/auth.js` |
| CORS restrito | `origin: CLIENT_URL` na API e no Socket.io | `app.js`, `server.js` |
| Limites | JSON até 1 MB; imagens até 5 MB e só JPEG, PNG ou WebP; nome do ficheiro gerado no servidor | `app.js`, `services/imagens.js` |
| Erros sem detalhes | Os 500 devolvem só "Erro interno" | `middleware/errorHandler.js` |
| Sockets autenticados | `io.use()` valida o mesmo JWT antes de aceitar a ligação | `sockets/index.js` |
| Segredos fora do código | `.env` (no `.gitignore`); App Settings na Cloud; a API não arranca sem `JWT_SECRET` | `.env.example`, `server.js` |
| HTTPS | Obrigatório em produção (`--https-only`); fornecido pela plataforma | `deploy.sh` |

Limitação conhecida: o token fica no `localStorage`, acessível por JavaScript. O risco é reduzido porque o React
escapa todo o texto apresentado e a aplicação nunca injeta HTML de utilizadores.

## 7. Tempo real

### Salas e eventos

Cada leilão é uma sala `leilao:<id>`. Cada utilizador tem uma sala pessoal `user:<id>`, onde entram todos os seus
dispositivos; os administradores entram também em `admins`.

| Direção | Evento | Dados | Quando |
|---|---|---|---|
| cliente → servidor | `entrar` / `sair` | `leilaoId` | Abrir / sair da sala |
| cliente → servidor | `licitar` | `{ leilaoId, valor }`, ack | Botão Licitar |
| servidor → socket | `estado` | `{ agora, leilao, licitacoes }` | Ao entrar na sala |
| servidor → socket | `recusada` | "Licitação mínima: 225,00 €" | Licitação inválida |
| servidor → sala | `presenca` | n.º de participantes | Alguém entra ou sai |
| servidor → sala | `nova-licitacao` | `{ valor, nome, createdAt, numLicitacoes }` | Licitação aceite |
| servidor → sala | `aberto` / `terminado` | `{ id }` / `{ vencedor, valor }` | Ciclo do leilão |
| servidor → `user:ID` | `encomenda-atualizada` | `{ id, estado, produtor }` | Produtor muda o estado |
| servidor → `user:ID` | `nova-encomenda` | `{ id, total, comprador }` | Comprador encomenda |
| servidor → `user:ID` | `leilao-ganho` / `leilao-terminado` / `leilao-aberto` | `{ lote, valor, encomenda }` | Ciclo do leilão |
| servidor → `user:ID` | `conta-validada` · `nova-avaliacao` | — · `{ classificacao, autor }` | Admin aprova · comprador avalia |
| servidor → `admins` | `novo-produtor` · `avaliacao-denunciada` | `{ nome }` · `{ id }` | Registo · denúncia |

### Consistência dos leilões (desafio central)

**Problema.** Quando dois compradores licitam o mesmo valor quase ao mesmo tempo, ler o valor atual, verificar e
gravar em passos separados deixa passar as duas licitações (ambas leem 215 €, ambas concluem que 220 € é válido,
ambas gravam): dois vencedores.

**Solução.** O servidor é a única fonte da verdade e valida cada licitação com **uma única operação atómica** no
documento do leilão:

```js
const leilao = await Auction.findOneAndUpdate(
  { _id: leilaoId, estado: 'ativo', terminaEm: { $gt: agora },
    'licitacaoAtual.valor': { $lte: cent(valor - base.incremento) } },   // valor >= atual + incremento
  { $set: { licitacaoAtual: { valor, comprador, nome, em: agora } }, $inc: { numLicitacoes: 1 } },
  { new: true }
);
```

O MongoDB garante que a atualização de um documento é atómica: a condição do filtro e a alteração acontecem juntas.
A primeira licitação a chegar altera `licitacaoAtual.valor` para 220; a segunda já não satisfaz a condição
(`220 ≤ 215` é falso), o update devolve `null` e o cliente recebe `recusada` com o novo mínimo. É por isso que a
licitação atual está **embebida** no leilão (secção 5): estado, prazo e valor são verificados e alterados no mesmo
documento. O mesmo filtro garante que não entram licitações depois do prazo.

Só depois de a operação ser aceite é que a licitação é registada no histórico (`bids`) e é feito o broadcast
`nova-licitacao` à sala; assim todos os clientes veem o mesmo estado. Dentro de cada instância há ainda uma fila por
leilão, que trata as licitações por ordem de chegada; é uma camada extra, não é dela que depende a correção.

**Relógio sincronizado.** O servidor envia `terminaEm` e a sua hora (`agora`). O cliente calcula
`offset = agora − Date.now()` e mostra `terminaEm − (Date.now() + offset)`. Sem isto, um computador com o relógio
adiantado mostraria o leilão como fechado antes do tempo.

**Ciclo de vida.** De 2 em 2 segundos o servidor abre os leilões agendados e fecha os expirados. Cada mudança é
condicionada ao estado anterior (`{ _id, estado: 'ativo' } → 'terminado'`), por isso com várias instâncias da API só
uma fecha cada leilão. O vencedor recebe uma encomenda já confirmada com o lote e uma notificação.

**Prova.** O teste de ponta a ponta (`api/test/e2e.js`) lança duas licitações de 105 € com `Promise.all` e verifica
que só uma é aceite; depois lança uma rajada de 10 licitações concorrentes com valores repetidos e confirma que o
número de aceites é igual ao de registadas e que cada uma é ≥ anterior + incremento. Saída (excerto):

```
Leilões em tempo real
  ✔ criar leilão -> 201, ativo, a começar no preço base
  ✔ ao entrar recebe o estado e a hora do servidor
  ✔ presença: 3 participantes na sala
  ✔ licitação abaixo do mínimo é recusada
  ✔ produtor não pode licitar
  ✔ duas licitações simultâneas de 105 €: só UMA é aceite
  ✔ a sala recebe a nova licitação (broadcast)
  ✔ rajada de 10: aceites (5) = registadas
  ✔ cada licitação aceite >= anterior + incremento
  ✔ licitação atual embebida = maior licitação do histórico
  ✔ leilão fecha e anuncia o vencedor à sala
  ✔ licitação depois do fim é recusada
  ✔ vencedor recebe encomenda do lote
  ✔ ao desligar, a presença baixa
...
57 / 57 verificações a passar
Todos os testes passaram
```

### Notificações

O produtor muda o estado no painel (`PATCH /api/orders/:id/estado`); a rota grava e emite `encomenda-atualizada`
para `user:<comprador>`. No cliente, o componente `Notificacoes` mostra um toast e a página de encomendas atualiza a
linha temporal sem refresh. No cliente, cada `socket.on` tem o `socket.off` correspondente na limpeza do
`useEffect`, para os eventos não ficarem duplicados ao mudar de página.

## 8. Cloud

_(Rever depois de publicar; os comandos estão em `deploy.sh`.)_

| Componente | Serviço | Modelo | Justificação |
|---|---|---|---|
| API + Socket.io | Azure App Service (Linux, B1, Node 20) | PaaS | Publica-se o código; a plataforma trata do runtime, do sistema operativo, do HTTPS e da escala. O plano B1 suporta WebSockets sem os limites do F1 |
| SPA | Azure Static Web Apps (Free) | PaaS | Ficheiros estáticos com CDN e HTTPS incluídos; `navigationFallback` devolve `index.html` nas rotas da SPA |
| Base de dados | MongoDB Atlas (M0) | DBaaS | Base de dados gerida, com réplicas e backups, sem administrar servidores; gratuita |
| Imagens | Azure Blob Storage (Standard LRS) | Storage gerido (BaaS) | Paga-se só o que se guarda; a API fica sem estado em disco, o que permite várias instâncias |

Não usei IaaS (máquinas virtuais): obrigaria a gerir sistema operativo, atualizações, certificados e escala, sem
benefício para este projeto. A API não guarda estado local (sessões em JWT, imagens no storage, leilões na base de
dados), por isso pode escalar horizontalmente; o fecho dos leilões já está preparado para várias instâncias. Para o
broadcast do Socket.io entre instâncias seria preciso acrescentar um adaptador (por exemplo, Redis).

**Configuração.** Segredos nas App Settings (`MONGODB_URI`, `JWT_SECRET`, `STORAGE_CONN`, `CLIENT_URL`), WebSockets
ativos, HTTPS obrigatório, acesso de rede autorizado no Atlas.

**Custos (CapEx vs OpEx).** Não há investimento inicial em servidores (CapEx); paga-se pelo uso (OpEx): Atlas M0 e
Static Web Apps gratuitos, App Service B1 coberto pelos créditos Azure for Students, Blob Storage a cêntimos por GB.
_(Confirmar os valores na calculadora de preços do Azure à data da entrega.)_

**URLs públicos:** _(aplicação)_ · _(API /api/health)_ · _(Swagger UI)_

## 9. Dificuldades

_(Rever e completar com a experiência do autor.)_

- **Licitações simultâneas.** A primeira ideia (ler, comparar e gravar) falha com pedidos concorrentes. A solução
  foi reescrever a condição "valor ≥ atual + incremento" sobre o campo guardado (`atual ≤ valor − incremento`), para
  poder ir no filtro de um `findOneAndUpdate`.
- **Arredondamentos.** Somar incrementos em vírgula flutuante dá valores como 216,99999; todos os valores passam
  por um arredondamento aos cêntimos antes de serem comparados.
- **Presença ao desligar.** No evento `disconnecting` o socket ainda está nas salas; foi preciso guardar as salas e
  emitir a presença só depois do `disconnect`.
- **YAML da especificação.** Uma descrição com vírgula dentro de um mapa em linha (`{ description: a, b }`) fazia a
  API falhar ao arrancar; as descrições com vírgulas passaram a estar entre aspas.
- **Pesquisa por produtor.** Pesquisar "mel" devolve também os produtos do produtor "Mel do Soajo"; é o
  comportamento pretendido (pesquisa por nome, descrição ou produtor), e o teste foi ajustado a isso.
- **Variáveis `VITE_`.** São substituídas no arranque e no build: alterar o `.env` da SPA obriga a reiniciar.

## 10. Ferramentas e IA

**Bibliotecas:** React, react-router, Vite, Bootstrap, SASS, Express, Mongoose, Socket.io, jsonwebtoken, bcryptjs,
swagger-ui-express, yamljs, multer, @azure/storage-blob. Em desenvolvimento: nodemon, socket.io-client (testes) e
mongodb-memory-server (base de dados local sem instalação). No backoffice: Laravel 13 e mongodb/laravel-mongodb.

**Assistente de IA (declaração).** Foi usado o assistente **Claude Code** (Anthropic) para gerar o código da API, da
SPA, do backoffice em Laravel, da especificação OpenAPI, do teste de ponta a ponta e uma primeira versão deste relatório, a partir do enunciado
e do guia de implementação da unidade curricular. _(O autor deve descrever aqui, pelas suas palavras, o que reviu,
alterou e testou, e confirmar que consegue explicar qualquer parte do código na defesa.)_

## 11. Componente de valorização: backoffice em Laravel

Além do painel `/admin` da SPA, existe um painel de administração separado em **Laravel 13** (`backoffice/`), que
segue o padrão **MVC** com vistas **Blade** e modelos **Eloquent**. Tal como no diagrama do enunciado, o backoffice
liga-se **diretamente à mesma base de dados MongoDB** que a API, através do pacote `mongodb/laravel-mongodb`.

| Camada | Implementação |
|---|---|
| Model | `User`, `Product`, `Order`, `Auction`, `Bid`, `Review`: modelos Eloquent sobre as coleções criadas pelo Mongoose (`createdAt`/`updatedAt` mapeados nos modelos; relações `belongsTo`/`hasMany` sobre os ObjectId; *scopes* `porValidar`, `validados`, `porModerar`; *accessor* `total` da encomenda) |
| View | Blade com um layout comum (`layouts/app`), parciais reutilizados (`partials/produtor`, `avaliacao`, `encomendas`) e Bootstrap 5, com a paleta da aplicação; responsivo (menu colapsável no telemóvel, barra lateral a partir de 992 px) |
| Controller | Um controlador por recurso (`ProdutorController`, `AvaliacaoController`, `UtilizadorController`, `EncomendaController`, `LeilaoController`, `ProdutoController`), `PainelController` para a visão geral e `AuthController` para a sessão |

**Funcionalidades:** validar produtores (aprovar ou rejeitar), moderar avaliações (manter, ocultar, repor) e conteúdos
(remover produtos), e consultar utilizadores, encomendas e leilões com o histórico de licitações.

**Segurança.** O login usa as contas da coleção `users`: o hash bcrypt gravado pela API é verificado com
`password_verify`, e só o papel `admin` entra (a mensagem de erro é a mesma em todos os casos de falha). O middleware
`EnsureAdmin` volta a verificar o papel em cada pedido. Os formulários têm proteção CSRF (`@csrf`), o login está
limitado a 10 tentativas por minuto, a sessão é regenerada ao entrar, os filtros são validados (`$request->validate`)
e os textos de pesquisa são escapados antes de irem para expressões regulares. Os modelos não aceitam preenchimento
em massa (`$guarded = ['*']`): todas as alterações são explícitas nos controladores.

**Consistência com a API.** Aprovar um produtor é um `update` condicionado (`papel = produtor` e ainda não validado),
tal como na API. Verifiquei que um produtor aprovado no backoffice passa a conseguir publicar produtos pela API e que
uma avaliação ocultada no backoffice deixa de aparecer na página pública e de contar para a média.

**Limitações.** Como o backoffice escreve diretamente na base de dados, não emite os eventos Socket.io da API (por
exemplo, `conta-validada`): o produtor vê a validação quando a aplicação atualiza a sessão. As regras de validação
dos dados continuam definidas nos schemas Mongoose, por isso o backoffice só faz alterações simples de estado.
_(O backoffice ainda não está publicado na Cloud; se for publicado, acrescentar o URL e o serviço usado na secção 8.)_

## Anexo: como correr

Ver o [README](../README.md): `npm install`, `npm run seed` e `npm run dev` em `api/`; `npm install` e `npm run dev`
em `web/`; `npm test` em `api/` para o teste de ponta a ponta.
