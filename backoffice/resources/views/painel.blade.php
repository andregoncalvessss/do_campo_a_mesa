@extends('layouts.app')
@section('titulo', 'Visão geral')

@section('conteudo')
    <h1 class="h2 mb-3">Visão geral</h1>

    <section class="indicadores mb-3" aria-label="Indicadores globais">
        <div class="cartao indicador"><small>Utilizadores registados</small><strong>{{ $indicadores['utilizadores'] }}</strong><span class="nota nota-ok">+{{ $indicadores['novosSemana'] }} esta semana</span></div>
        <div class="cartao indicador"><small>Produtores ativos</small><strong>{{ $indicadores['produtoresAtivos'] }}</strong><span class="nota">{{ $indicadores['porValidar'] }} por validar</span></div>
        <div class="cartao indicador"><small>Encomendas hoje</small><strong>{{ $indicadores['encomendasHoje'] }}</strong><span class="nota nota-ok">{{ euro($indicadores['vendasHoje']) }} em vendas</span></div>
        <div class="cartao indicador"><small>Leilões em direto</small><strong>{{ $indicadores['leiloesAtivos'] }}</strong><span class="nota">{{ $indicadores['porModerar'] }} avaliações por moderar</span></div>
    </section>

    <div class="colunas mb-3">
        <div class="d-grid gap-3">
            <section class="cartao" aria-labelledby="t-validar">
                <div class="d-flex justify-content-between align-items-baseline">
                    <h2 id="t-validar" class="h6">Produtores por validar</h2>
                    <a href="{{ route('produtores.index') }}" class="small">{{ $indicadores['porValidar'] }} pedidos</a>
                </div>
                @forelse ($pendentes as $u)
                    @include('partials.produtor', ['u' => $u, 'numProdutos' => []])
                @empty
                    <p class="small texto-secundario mb-0">Não há pedidos pendentes.</p>
                @endforelse
            </section>

            <section class="cartao" aria-labelledby="t-denunciadas">
                <div class="d-flex justify-content-between align-items-baseline">
                    <h2 id="t-denunciadas" class="h6">Avaliações denunciadas</h2>
                    <a href="{{ route('avaliacoes.index') }}" class="small">{{ $indicadores['porModerar'] }} por moderar</a>
                </div>
                @forelse ($denunciadas as $a)
                    @include('partials.avaliacao', ['a' => $a])
                @empty
                    <p class="small texto-secundario mb-0">Não há avaliações por moderar.</p>
                @endforelse
            </section>
        </div>

        <section class="cartao" aria-labelledby="t-leiloes">
            <div class="d-flex justify-content-between align-items-baseline">
                <h2 id="t-leiloes" class="h6"><span class="text-danger" aria-hidden="true">●</span> Leilões ativos</h2>
                <a href="{{ route('leiloes.index') }}" class="small">Ver todos</a>
            </div>
            @forelse ($leiloes as $l)
                <div class="item">
                    <div class="corpo">
                        <a href="{{ route('leiloes.show', $l->getKey()) }}" class="fw-bold text-reset">{{ $l->lote }}</a>
                        <div class="small texto-secundario">{{ $l->vendedor?->nome_publico }} · termina às {{ $l->terminaEm->format('H:i') }}</div>
                    </div>
                    <div class="text-end">
                        <strong>{{ euro($l->licitacaoAtual['valor'] ?? $l->precoBase) }}</strong>
                        <div class="small texto-secundario">{{ $l->numLicitacoes }} licitações</div>
                    </div>
                </div>
            @empty
                <p class="small texto-secundario mb-0">Não há leilões a decorrer.</p>
            @endforelse
        </section>
    </div>

    <section class="cartao" aria-labelledby="t-encomendas">
        <div class="d-flex justify-content-between align-items-baseline">
            <h2 id="t-encomendas" class="h6">Encomendas recentes</h2>
            <a href="{{ route('encomendas.index') }}" class="small">Ver todas</a>
        </div>
        @include('partials.encomendas', ['encomendas' => $encomendas])
    </section>
@endsection
