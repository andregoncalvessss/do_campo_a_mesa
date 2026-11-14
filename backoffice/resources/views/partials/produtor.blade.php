{{-- Linha de um pedido de registo de produtor, com as ações de validação --}}
<div class="item">
    <span class="avatar" aria-hidden="true">{{ iniciais($u->nome_publico) }}</span>
    <div class="corpo">
        <strong>{{ $u->nome_publico }}</strong>
        <div class="small texto-secundario">
            {{ $u->nome }} · {{ $u->email }} · {{ $u->produtor['localidade'] ?? 'sem localidade' }} · pedido a {{ $u->createdAt?->format('d/m/Y') }}
        </div>
        @if (! empty($u->produtor['descricao']))
            <div class="small">{{ $u->produtor['descricao'] }}</div>
        @endif
    </div>
    @if ($u->isProdutorValidado())
        <span class="small texto-secundario">{{ $numProdutos[(string) $u->getKey()] ?? 0 }} produtos</span>
        <a href="{{ loja('produtores/'.$u->getKey()) }}" class="btn btn-outline-secondary btn-sm" target="_blank" rel="noreferrer">Página pública</a>
        <span class="estado estado-validado">Validado</span>
    @else
        <form method="POST" action="{{ route('produtores.rejeitar', $u->getKey()) }}"
              onsubmit="return confirm('Rejeitar e remover o pedido de {{ addslashes($u->nome_publico) }}?')">
            @csrf @method('DELETE')
            <button type="submit" class="btn btn-outline-danger btn-sm">Rejeitar</button>
        </form>
        <form method="POST" action="{{ route('produtores.aprovar', $u->getKey()) }}">
            @csrf @method('PATCH')
            <button type="submit" class="btn btn-success btn-sm">Aprovar</button>
        </form>
    @endif
</div>
