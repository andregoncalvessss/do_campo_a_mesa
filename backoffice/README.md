# Backoffice (Laravel)

Painel de administração do **Do Campo à Mesa** em Laravel 13 (MVC, Blade, Eloquent). É o componente de valorização
do enunciado: liga-se **à mesma base de dados MongoDB** que a API Node.js, através do pacote `mongodb/laravel-mongodb`.

## Funcionalidades

- Login reservado ao papel `admin` (as contas e os hashes bcrypt são os da coleção `users`).
- Visão geral: utilizadores, produtores, encomendas do dia, leilões em direto.
- Produtores: aprovar ou rejeitar pedidos de registo.
- Moderação: manter, ocultar ou repor avaliações denunciadas; remover produtos do catálogo.
- Listagens globais de utilizadores, encomendas e leilões (com o histórico de licitações).

## Estrutura (MVC)

| Camada | Onde | Conteúdo |
|---|---|---|
| Model | `app/Models/` | `User`, `Product`, `Order`, `Auction`, `Bid`, `Review` (Eloquent sobre as coleções da API) |
| View | `resources/views/` | Blade: `layouts/app`, `painel`, `produtores`, `avaliacoes`, `utilizadores`, `encomendas`, `leiloes`, `produtos`, `partials` |
| Controller | `app/Http/Controllers/` | Um controlador por recurso; `AuthController` para a sessão |
| Rotas | `routes/web.php` | Grupo protegido por `auth` + `admin` (`app/Http/Middleware/EnsureAdmin.php`) |

## Requisitos

- PHP 8.3 ou superior com a extensão `mongodb` (`pecl install mongodb`)
- Composer
- A base de dados da API a correr (ver o README da raiz)

## Instalação e execução

```bash
cd backoffice
cp .env.example .env        # MONGODB_URI e MONGODB_DATABASE iguais aos da API
composer install
php artisan key:generate
php artisan serve           # http://localhost:8000
```

Entrar com `admin@exemplo.pt` / `password123` (depois de `npm run seed` na API).

## Testes

```bash
php artisan test
```

## Notas

- Não há migrações: o esquema é definido pelos modelos Mongoose da API.
- As sessões e a cache usam ficheiros (`SESSION_DRIVER=file`), por isso não é precisa nenhuma base de dados SQL.
- As ações escrevem diretamente na base de dados, por isso não disparam os eventos Socket.io da API
  (por exemplo, `conta-validada`); o produtor vê a validação quando a aplicação atualiza a sessão.
