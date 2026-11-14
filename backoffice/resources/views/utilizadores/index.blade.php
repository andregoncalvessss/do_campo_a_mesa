@extends('layouts.app')
@section('titulo', 'Utilizadores')

@section('conteudo')
    <h1 class="h2 mb-3">Utilizadores</h1>

    <form method="GET" action="{{ route('utilizadores.index') }}" class="row g-2 align-items-end mb-3" role="search">
        <div class="col-12 col-md-5">
            <label for="q" class="form-label small mb-1">Nome ou email</label>
            <input id="q" name="q" type="search" class="form-control" value="{{ $filtro['q'] }}" maxlength="100">
        </div>
        <div class="col-8 col-md-4">
            <label for="papel" class="form-label small mb-1">Papel</label>
            <select id="papel" name="papel" class="form-select">
                <option value="">Todos</option>
                @foreach (['comprador' => 'Compradores', 'produtor' => 'Produtores', 'admin' => 'Administradores'] as $valor => $texto)
                    <option value="{{ $valor }}" @selected($filtro['papel'] === $valor)>{{ $texto }} ({{ $totais[$valor] }})</option>
                @endforeach
            </select>
        </div>
        <div class="col-4 col-md-3"><button type="submit" class="btn btn-success w-100">Filtrar</button></div>
    </form>

    <section class="cartao" aria-label="Lista de utilizadores">
        <div class="table-responsive">
            <table class="table mb-0">
                <thead><tr><th scope="col">Nome</th><th scope="col">Email</th><th scope="col">Papel</th><th scope="col">Localidade</th><th scope="col">Registo</th></tr></thead>
                <tbody>
                @forelse ($utilizadores as $u)
                    <tr>
                        <td><strong>{{ $u->nome }}</strong>@if ($u->papel === 'produtor')<div class="small texto-secundario">{{ $u->nome_publico }}</div>@endif</td>
                        <td>{{ $u->email }}</td>
                        <td>
                            <span class="text-capitalize">{{ $u->papel }}</span>
                            @if ($u->papel === 'produtor')
                                <span class="estado {{ $u->isProdutorValidado() ? 'estado-validado' : 'estado-por-validar' }}">{{ $u->isProdutorValidado() ? 'Validado' : 'Por validar' }}</span>
                            @endif
                        </td>
                        <td>{{ $u->produtor['localidade'] ?? '—' }}</td>
                        <td class="text-nowrap">{{ $u->createdAt?->format('d/m/Y') }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="texto-secundario">Nenhum utilizador encontrado.</td></tr>
                @endforelse
                </tbody>
            </table>
        </div>
    </section>
    <div class="mt-3">{{ $utilizadores->links() }}</div>
@endsection
