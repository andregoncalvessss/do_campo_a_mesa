@extends('layouts.app')
@section('titulo', 'Produtos')

@section('conteudo')
    <h1 class="h2 mb-1">Produtos</h1>
    <p class="texto-secundario">Moderação de conteúdos: remover do catálogo produtos impróprios ou fraudulentos.</p>

    <form method="GET" action="{{ route('produtos.index') }}" class="row g-2 align-items-end mb-3" role="search">
        <div class="col-8 col-md-6">
            <label for="q" class="form-label small mb-1">Nome do produto</label>
            <input id="q" name="q" type="search" class="form-control" value="{{ $q }}" maxlength="100">
        </div>
        <div class="col-4 col-md-2"><button type="submit" class="btn btn-success w-100">Pesquisar</button></div>
    </form>

    <section class="cartao" aria-label="Lista de produtos">
        <div class="table-responsive">
            <table class="table mb-0">
                <thead><tr><th scope="col">Produto</th><th scope="col">Produtor</th><th scope="col">Categoria</th><th scope="col" class="text-end">Preço</th><th scope="col" class="text-end">Stock</th><th scope="col"><span class="visually-hidden">Ações</span></th></tr></thead>
                <tbody>
                @forelse ($produtos as $p)
                    <tr>
                        <td><strong>{{ $p->nome }}</strong>@if ($p->biologico) <span class="estado estado-validado">Bio</span>@endif
                            @if ($p->descricao)<div class="small texto-secundario">{{ \Illuminate\Support\Str::limit($p->descricao, 80) }}</div>@endif</td>
                        <td>{{ $p->vendedor?->nome_publico ?? '—' }}</td>
                        <td>{{ $p->categoria }}</td>
                        <td class="text-end text-nowrap">{{ euro($p->preco) }} / {{ $p->unidade }}</td>
                        <td class="text-end">{{ $p->stock }}</td>
                        <td class="text-end">
                            <form method="POST" action="{{ route('produtos.destroy', $p->getKey()) }}"
                                  onsubmit="return confirm('Remover &quot;{{ addslashes($p->nome) }}&quot; do catálogo? Esta ação não pode ser desfeita.')">
                                @csrf @method('DELETE')
                                <button type="submit" class="btn btn-outline-danger btn-sm">Remover</button>
                            </form>
                        </td>
                    </tr>
                @empty
                    <tr><td colspan="6" class="texto-secundario">Nenhum produto encontrado.</td></tr>
                @endforelse
                </tbody>
            </table>
        </div>
    </section>
    <div class="mt-3">{{ $produtos->links() }}</div>
@endsection
