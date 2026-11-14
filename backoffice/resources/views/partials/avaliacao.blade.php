{{-- Linha de uma avaliação, com as ações de moderação --}}
<div class="item">
    <div class="corpo">
        <p class="mb-1">“{{ $a->comentario ?: 'Sem comentário' }}”</p>
        <div class="small texto-secundario">
            {{ $a->classificacao }}★ sobre {{ $a->vendedor?->nome_publico ?? 'produtor removido' }}
            @if ($a->nomeProduto) ({{ $a->nomeProduto }}) @endif
            · por {{ $a->autorUtilizador?->nome ?? 'utilizador removido' }}
            · {{ $a->createdAt?->format('d/m/Y') }}
            · {{ $a->denuncias }} {{ $a->denuncias == 1 ? 'denúncia' : 'denúncias' }}
        </div>
    </div>
    <span class="estado {{ $a->visivel ? 'estado-visivel' : 'estado-oculta' }}">{{ $a->visivel ? 'Visível' : 'Oculta' }}</span>
    @if ($a->denuncias > 0 || ! $a->visivel)
        <form method="POST" action="{{ route('avaliacoes.manter', $a->getKey()) }}">
            @csrf @method('PATCH')
            <button type="submit" class="btn btn-outline-secondary btn-sm">{{ $a->visivel ? 'Manter' : 'Repor' }}</button>
        </form>
    @endif
    @if ($a->visivel)
        <form method="POST" action="{{ route('avaliacoes.ocultar', $a->getKey()) }}">
            @csrf @method('PATCH')
            <button type="submit" class="btn btn-danger btn-sm">Ocultar</button>
        </form>
    @endif
</div>
