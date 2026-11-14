@extends('layouts.app')
@section('titulo', 'Encomendas')

@section('conteudo')
    <h1 class="h2 mb-3">Encomendas</h1>
    <div class="filtros d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Filtrar por estado">
        <a href="{{ route('encomendas.index') }}" class="btn btn-sm {{ $estado ? '' : 'ativo' }}">Todas ({{ $contagens->sum() }})</a>
        @foreach (\App\Models\Order::ESTADOS as $e)
            <a href="{{ route('encomendas.index', ['estado' => $e]) }}" class="btn btn-sm text-capitalize {{ $estado === $e ? 'ativo' : '' }}"
               @if ($estado === $e) aria-current="true" @endif>{{ $e }} ({{ $contagens[$e] ?? 0 }})</a>
        @endforeach
    </div>

    <section class="cartao" aria-label="Lista de encomendas">
        @include('partials.encomendas', ['encomendas' => $encomendas])
    </section>
    <div class="mt-3">{{ $encomendas->links() }}</div>
@endsection
