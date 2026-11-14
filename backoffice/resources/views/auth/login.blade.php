<!doctype html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Entrar · Backoffice Do Campo à Mesa</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="{{ asset('css/backoffice.css') }}" rel="stylesheet">
</head>
<body>
<main class="entrada px-3">
    <p class="text-uppercase small fw-bold mb-1" style="color: var(--terracota); letter-spacing: .1em;">Administração</p>
    <h1 class="h2 mb-3">Do Campo à Mesa</h1>
    <form method="POST" action="{{ route('login') }}" class="cartao d-grid gap-3">
        @csrf
        @if ($errors->any())
            <div class="alert alert-danger mb-0" role="alert">{{ $errors->first() }}</div>
        @endif
        <div>
            <label for="email" class="form-label">Email</label>
            <input id="email" name="email" type="email" class="form-control" value="{{ old('email') }}" autocomplete="email" required autofocus>
        </div>
        <div>
            <label for="password" class="form-label">Password</label>
            <input id="password" name="password" type="password" class="form-control" autocomplete="current-password" required>
        </div>
        <button type="submit" class="btn btn-success">Entrar</button>
        <p class="small texto-secundario mb-0">Acesso reservado a administradores. <a href="{{ loja() }}">Voltar à loja</a></p>
    </form>
</main>
</body>
</html>
