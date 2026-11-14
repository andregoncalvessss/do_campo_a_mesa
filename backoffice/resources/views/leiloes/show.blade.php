@extends('layouts.app')
@section('titulo', $leilao->lote)

@section('conteudo')
    <nav aria-label="Caminho" class="small mb-2"><a href="{{ route('leiloes.index', ['estado' => $leilao->estado]) }}">Leilões</a> / {{ $leilao->lote }}</nav>
    <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
            <h1 class="h3 mb-1">{{ $leilao->lote }}</h1>
            <p class="texto-secundario mb-0">{{ $leilao->vendedor?->nome_publico }} · {{ $leilao->quantidade }}</p>
        </div>
        <div class="d-flex gap-2 align-items-center">
            <span class="estado estado-{{ $leilao->estado }}">{{ $leilao->estado }}</span>
            <a href="{{ loja('leiloes/'.$leilao->getKey()) }}" class="btn btn-outline-success btn-sm" target="_blank" rel="noreferrer">Abrir a sala</a>
        </div>
    </div>

    <section class="indicadores mb-3" aria-label="Dados do leilão">
        <div class="cartao indicador"><small>Preço base</small><strong>{{ euro($leilao->precoBase) }}</strong><span class="nota nota-ok">incremento {{ euro($leilao->incremento) }}</span></div>
        <div class="cartao indicador"><small>Licitação atual</small><strong>{{ euro($leilao->licitacaoAtual['valor'] ?? $leilao->precoBase) }}</strong><span class="nota nota-ok">{{ $leilao->licitacaoAtual['nome'] ?? 'sem licitações' }}</span></div>
        <div class="cartao indicador"><small>Início</small><strong>{{ $leilao->iniciaEm->format('H:i') }}</strong><span class="nota nota-ok">{{ $leilao->iniciaEm->format('d/m/Y') }}</span></div>
        <div class="cartao indicador"><small>Fim</small><strong>{{ $leilao->terminaEm->format('H:i') }}</strong><span class="nota nota-ok">{{ $leilao->terminaEm->format('d/m/Y') }}</span></div>
    </section>

    @if ($leilao->descricao)
        <p>{{ $leilao->descricao }}</p>
    @endif

    <section class="cartao" aria-labelledby="t-licitacoes">
        <h2 id="t-licitacoes" class="h6">Histórico de licitações ({{ $leilao->numLicitacoes }})</h2>
        <div class="table-responsive">
            <table class="table mb-0">
                <thead><tr><th scope="col">Hora</th><th scope="col">Comprador</th><th scope="col" class="text-end">Valor</th></tr></thead>
                <tbody>
                @forelse ($licitacoes as $b)
                    <tr>
                        <td class="text-nowrap">{{ $b->createdAt?->format('d/m H:i:s') }}</td>
                        <td>{{ $b->nome }}</td>
                        <td class="text-end"><strong>{{ euro($b->valor) }}</strong></td>
                    </tr>
                @empty
                    <tr><td colspan="3" class="texto-secundario">Ainda ninguém licitou.</td></tr>
                @endforelse
                </tbody>
            </table>
        </div>
    </section>
@endsection
