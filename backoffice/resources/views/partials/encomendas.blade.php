{{-- Tabela de encomendas (visão geral e listagem) --}}
<div class="table-responsive">
    <table class="table mb-0">
        <thead>
        <tr><th scope="col">N.º</th><th scope="col">Data</th><th scope="col">Comprador</th><th scope="col">Produtor</th><th scope="col">Artigos</th><th scope="col">Entrega</th><th scope="col" class="text-end">Total</th><th scope="col">Estado</th></tr>
        </thead>
        <tbody>
        @forelse ($encomendas as $o)
            <tr>
                <td><strong>{{ $o->referencia }}</strong>@if ($o->origem === 'leilao') <span class="estado estado-confirmada">Leilão</span>@endif</td>
                <td class="text-nowrap">{{ $o->createdAt?->format('d/m H:i') }}</td>
                <td>{{ $o->cliente?->nome ?? '—' }}</td>
                <td>{{ $o->vendedor?->nome_publico ?? '—' }}</td>
                <td class="small">{{ collect($o->linhas)->map(fn ($l) => $l['quantidade'].' × '.$l['nome'])->implode(', ') }}</td>
                <td>{{ ($o->entrega['tipo'] ?? 'levantamento') === 'entrega' ? 'Entrega' : 'Levantamento' }}</td>
                <td class="text-end text-nowrap"><strong>{{ euro($o->total) }}</strong></td>
                <td><span class="estado estado-{{ $o->estado }}">{{ $o->estado }}</span></td>
            </tr>
        @empty
            <tr><td colspan="8" class="texto-secundario">Não há encomendas.</td></tr>
        @endforelse
        </tbody>
    </table>
</div>
