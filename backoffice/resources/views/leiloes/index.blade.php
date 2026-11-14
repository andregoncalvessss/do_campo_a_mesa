@extends('layouts.app')
@section('titulo', 'Leilões')

@section('conteudo')
    <h1 class="h2 mb-3">Leilões</h1>
    <div class="filtros d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Filtrar por estado">
        @foreach (['ativo' => 'Em direto', 'agendado' => 'Agendados', 'terminado' => 'Terminados'] as $valor => $texto)
            <a href="{{ route('leiloes.index', ['estado' => $valor]) }}" class="btn btn-sm {{ $estado === $valor ? 'ativo' : '' }}"
               @if ($estado === $valor) aria-current="true" @endif>{{ $texto }}</a>
        @endforeach
    </div>

    <section class="cartao" aria-label="Lista de leilões">
        <div class="table-responsive">
            <table class="table mb-0">
                <thead><tr><th scope="col">Lote</th><th scope="col">Produtor</th><th scope="col">Início</th><th scope="col">Fim</th><th scope="col" class="text-end">Base</th><th scope="col" class="text-end">Atual</th><th scope="col" class="text-end">Licitações</th><th scope="col">Estado</th></tr></thead>
                <tbody>
                @forelse ($leiloes as $l)
                    <tr>
                        <td><a href="{{ route('leiloes.show', $l->getKey()) }}" class="fw-bold">{{ $l->lote }}</a></td>
                        <td>{{ $l->vendedor?->nome_publico ?? '—' }}</td>
                        <td class="text-nowrap">{{ $l->iniciaEm->format('d/m H:i') }}</td>
                        <td class="text-nowrap">{{ $l->terminaEm->format('d/m H:i') }}</td>
                        <td class="text-end text-nowrap">{{ euro($l->precoBase) }}</td>
                        <td class="text-end text-nowrap"><strong>{{ euro($l->licitacaoAtual['valor'] ?? $l->precoBase) }}</strong></td>
                        <td class="text-end">{{ $l->numLicitacoes }}</td>
                        <td><span class="estado estado-{{ $l->estado }}">{{ $l->estado }}</span></td>
                    </tr>
                @empty
                    <tr><td colspan="8" class="texto-secundario">Não há leilões neste estado.</td></tr>
                @endforelse
                </tbody>
            </table>
        </div>
    </section>
    <div class="mt-3">{{ $leiloes->links() }}</div>
@endsection
