@extends('layouts.app')
@section('titulo', 'Moderação')

@section('conteudo')
    <h1 class="h2 mb-3">Moderação de avaliações</h1>
    <div class="filtros d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Filtrar avaliações">
        @foreach (['denunciadas' => 'Denunciadas', 'ocultas' => 'Ocultas', 'todas' => 'Todas'] as $valor => $texto)
            <a href="{{ route('avaliacoes.index', ['estado' => $valor]) }}" class="btn btn-sm {{ $filtro === $valor ? 'ativo' : '' }}"
               @if ($filtro === $valor) aria-current="true" @endif>{{ $texto }}</a>
        @endforeach
    </div>

    <section class="cartao" aria-label="Lista de avaliações">
        @forelse ($avaliacoes as $a)
            @include('partials.avaliacao', ['a' => $a])
        @empty
            <p class="small texto-secundario mb-0">Não há avaliações neste filtro.</p>
        @endforelse
    </section>
    <div class="mt-3">{{ $avaliacoes->links() }}</div>
@endsection
