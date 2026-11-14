@extends('layouts.app')
@section('titulo', 'Produtores')

@section('conteudo')
    <h1 class="h2 mb-3">Produtores</h1>
    <div class="filtros d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Filtrar produtores">
        @foreach (['por-validar' => 'Por validar', 'validados' => 'Validados'] as $valor => $texto)
            <a href="{{ route('produtores.index', ['estado' => $valor]) }}" class="btn btn-sm {{ $filtro === $valor ? 'ativo' : '' }}"
               @if ($filtro === $valor) aria-current="true" @endif>{{ $texto }}</a>
        @endforeach
    </div>

    <section class="cartao" aria-label="Lista de produtores">
        @forelse ($produtores as $u)
            @include('partials.produtor', ['u' => $u])
        @empty
            <p class="small texto-secundario mb-0">{{ $filtro === 'validados' ? 'Ainda não há produtores validados.' : 'Não há pedidos pendentes.' }}</p>
        @endforelse
    </section>
    <div class="mt-3">{{ $produtores->links() }}</div>
@endsection
