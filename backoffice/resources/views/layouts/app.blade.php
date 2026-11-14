<!doctype html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>@yield('titulo', 'Visão geral') · Backoffice Do Campo à Mesa</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="{{ asset('css/backoffice.css') }}" rel="stylesheet">
</head>
<body>
<a href="#conteudo" class="visually-hidden-focusable btn btn-success m-2">Saltar para o conteúdo</a>
<div class="estrutura">
    <header class="lateral">
        <div class="d-flex justify-content-between align-items-center">
            <a href="{{ route('painel') }}" class="d-block">
                <span class="marca d-block">Do Campo à Mesa</span>
                <span class="sub">Administração</span>
            </a>
            <button class="btn btn-outline-light btn-sm d-lg-none" type="button" data-bs-toggle="collapse" data-bs-target="#menu"
                    aria-controls="menu" aria-expanded="false" aria-label="Abrir menu">Menu</button>
        </div>
        <div class="collapse mt-3" id="menu">
            <nav class="nav flex-column gap-1" aria-label="Navegação do backoffice">
                @php
                    $itens = [
                        ['painel', 'Visão geral', null],
                        ['produtores.index', 'Produtores', $menuPorValidar ?? 0],
                        ['utilizadores.index', 'Utilizadores', null],
                        ['avaliacoes.index', 'Moderação', $menuPorModerar ?? 0],
                        ['produtos.index', 'Produtos', null],
                        ['encomendas.index', 'Encomendas', null],
                        ['leiloes.index', 'Leilões', null],
                    ];
                @endphp
                @foreach ($itens as [$rota, $texto, $n])
                    @php $ativo = request()->routeIs($rota) || request()->routeIs(explode('.', $rota)[0].'.*'); @endphp
                    <a href="{{ route($rota) }}" class="nav-link {{ $ativo ? 'active' : '' }}" @if ($ativo) aria-current="page" @endif>
                        {{ $texto }}
                        @if ($n) <span class="contador" aria-label="{{ $n }} pendentes">{{ $n }}</span> @endif
                    </a>
                @endforeach
            </nav>
            <hr class="border-light opacity-25">
            <p class="small mb-2">{{ auth()->user()->nome }}<span class="d-block sub">Administrador</span></p>
            <div class="d-flex flex-wrap gap-2">
                <a href="{{ loja() }}" class="btn btn-outline-light btn-sm" target="_blank" rel="noreferrer">Ver a loja</a>
                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" class="btn btn-outline-light btn-sm">Sair</button>
                </form>
            </div>
        </div>
    </header>

    <main id="conteudo" class="conteudo">
        @if (session('sucesso'))
            <div class="alert alert-success" role="status">{{ session('sucesso') }}</div>
        @endif
        @if (session('erro'))
            <div class="alert alert-danger" role="alert">{{ session('erro') }}</div>
        @endif
        @if ($errors->any())
            <div class="alert alert-danger" role="alert">{{ $errors->first() }}</div>
        @endif
        @yield('conteudo')
    </main>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
