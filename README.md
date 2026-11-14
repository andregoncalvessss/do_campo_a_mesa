# Do Campo à Mesa

Mercado digital de produtores locais com leilões em tempo real.
Trabalho prático individual de **Desenvolvimento Web e para a Cloud** (Mestrado em Engenharia Informática, IPVC – ESTG, 2026/2027).

| | |
|---|---|
| Aplicação (SPA) | _por publicar — preencher depois do Passo 8_ |
| API | _por publicar_ |
| Documentação Swagger | _por publicar_ (`/api-docs`) |
| Relatório | [docs/relatorio.md](docs/relatorio.md) |

## Arquitetura

```
Browser (SPA React · Bootstrap · SASS)
   │  HTTPS/JSON                 │  WebSocket
   ▼                             ▼
API REST (Express · JWT · Swagger UI)  ⇄  Socket.io (mesmo processo, salas por leilão)
   │ Mongoose                    │ upload
   ▼                             ▼
MongoDB Atlas                 Azure Blob Storage (imagens)
```

Três aplicações independentes no mesmo repositório:

- `api/` — API REST + Socket.io (Node.js, Express 4, Mongoose 8). Porta 3000.
- `web/` — SPA (React 18, Vite 5, react-router 6, Bootstrap 5.3, SASS). Porta 5173.
- `backoffice/` — painel de administração em Laravel 13 (MVC, Blade, Eloquent) sobre a mesma base de dados (componente de valorização). Porta 8000. Ver [backoffice/README.md](backoffice/README.md).

```
api/
  openapi.yaml          especificação OpenAPI 3 (Swagger UI em /api-docs)
  test/e2e.js           teste de ponta a ponta (API + sockets)
  src/
    server.js           HTTP + Socket.io + ciclo dos leilões
    app.js              Express: middleware e rotas
    config/ middleware/ models/ routes/ sockets/ services/ utils/ seed/
web/
  src/
    main.jsx · App.jsx  providers e rotas
    api/ context/ hooks/ components/ pages/ styles/ data/
backoffice/             Laravel: app/Models, app/Http/Controllers, resources/views, routes/web.php
docs/relatorio.md
iniciar.sh              arranca tudo em desenvolvimento com um só comando
deploy.sh               comandos Azure CLI do Passo 8
```

## Requisitos

- Node.js 20 LTS ou superior (inclui o npm)
- Uma base de dados MongoDB: [MongoDB Atlas](https://www.mongodb.com/atlas) (tier gratuito M0) ou MongoDB local

## Instalação e execução

### Arranque rápido (um só comando)

```bash
./iniciar.sh
```

Arranca, pela ordem certa, a base de dados local, a API, a SPA e o backoffice, e salta o que já estiver a correr
(não dá erro de porta ocupada). Na primeira vez instala as dependências e cria os ficheiros `.env`; se o catálogo
estiver vazio, corre o seed. `./iniciar.sh --seed` repõe os dados de exemplo. Ctrl+C pára tudo o que o script
arrancou; os registos de cada serviço ficam em `.logs/`.

Os passos manuais, serviço a serviço, estão a seguir.

Em alternativa ao script, abrir **dois terminais**: um para a API, outro para a SPA.

### 1. API

```bash
cd api
cp .env.example .env        # editar MONGODB_URI e JWT_SECRET
npm install
npm run seed                # apaga e recria os dados de exemplo
npm run dev                 # http://localhost:3000 · docs em /api-docs
```

Gerar um `JWT_SECRET` forte:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Sem Atlas nem MongoDB instalado, `npm run bd` (num terceiro terminal, dentro de `api/`) arranca um MongoDB local
na porta 27017 com os dados em `api/.mongo-dados/`. O `.env.example` já aponta para `mongodb://localhost:27017/do-campo-a-mesa`.

### 2. SPA

```bash
cd web
cp .env.example .env        # VITE_API_URL=http://localhost:3000
npm install
npm run dev                 # http://localhost:5173
```

Com `VITE_USAR_DADOS_SIMULADOS=true` o catálogo funciona sem API, com os dados de `web/src/data/produtos.json`.

### 3. Backoffice Laravel (opcional)

Requer PHP 8.3+ com a extensão `mongodb` e o Composer.

```bash
cd backoffice
cp .env.example .env        # MONGODB_URI e MONGODB_DATABASE iguais aos da API
composer install
php artisan key:generate
php artisan serve           # http://localhost:8000
```

Só o administrador entra (`admin@exemplo.pt`).

### Utilizadores de exemplo (depois do seed)

A password de todos é `password123`.

| Papel | Email |
|---|---|
| Administrador | `admin@exemplo.pt` |
| Comprador | `tasca@exemplo.pt`, `ana@exemplo.pt` |
| Produtor | `horta@exemplo.pt`, `mel@exemplo.pt`, `quinta@exemplo.pt` |
| Produtor por validar | `valeverde@exemplo.pt` |

O seed cria dois leilões ativos (30 e 45 minutos) e um agendado para daqui a 10 minutos.

## Testes

Com a API a correr e depois do seed:

```bash
cd api
npm test
```

O teste usa a API real (`fetch`) e clientes `socket.io-client`. Inclui o desafio central:
duas licitações simultâneas do mesmo valor, das quais só uma é aceite.

Teste manual do leilão: abrir duas janelas (uma privada) com `tasca@exemplo.pt` e `ana@exemplo.pt` na mesma sala.

## Variáveis de ambiente

| Ficheiro | Variável | Descrição |
|---|---|---|
| `api/.env` | `PORT` | Porta da API (a plataforma Cloud define-a) |
| | `MONGODB_URI` | Connection string do MongoDB |
| | `JWT_SECRET` | Segredo para assinar os tokens (obrigatório) |
| | `JWT_EXPIRES_IN` | Validade do token (por omissão `2h`) |
| | `CLIENT_URL` | Origem da SPA (CORS e Socket.io) |
| | `STORAGE_CONN` | Connection string do Azure Blob Storage; vazio = grava em `api/uploads/` |
| | `STORAGE_CONTAINER` | Nome do container (por omissão `produtos`) |
| `web/.env` | `VITE_API_URL` | URL da API |
| | `VITE_USAR_DADOS_SIMULADOS` | `true` usa dados simulados no catálogo |

Os ficheiros `.env` nunca vão para o Git (ver `.gitignore`); em produção os segredos ficam nas App Settings.

## Deployment (Azure)

Os comandos estão em [deploy.sh](deploy.sh), pela ordem do guia: resource group, App Service (API, com WebSockets e HTTPS),
Storage account (imagens) e Static Web Apps (SPA). Antes de publicar:

1. No Atlas, autorizar o acesso a partir da Cloud (Network Access).
2. Definir os nomes e segredos no início do `deploy.sh`.
3. Em `web/.env.production`, pôr o URL público da API.
4. Depois de publicar a SPA, atualizar `CLIENT_URL` na API e os URLs no topo deste README.

## Ferramentas e IA

Ver a secção 10 do [relatório](docs/relatorio.md).
