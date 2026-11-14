<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/** Validação do registo de novos produtores. */
class ProdutorController extends Controller
{
    public function index(Request $request): View
    {
        $filtro = $request->validate(['estado' => ['nullable', 'in:por-validar,validados']])['estado'] ?? 'por-validar';

        $produtores = ($filtro === 'validados' ? User::validados() : User::porValidar())
            ->orderBy('createdAt')
            ->paginate(15)
            ->withQueryString();

        // Número de produtos de cada produtor da página (uma só consulta)
        $numProdutos = Product::whereIn('produtor', $produtores->pluck('_id')->all())
            ->get(['produtor'])
            ->countBy(fn ($p) => (string) $p->produtor);

        return view('produtores.index', compact('produtores', 'filtro', 'numProdutos'));
    }

    public function aprovar(string $id): RedirectResponse
    {
        // Condição e alteração numa só operação: só valida quem é produtor e ainda não está validado
        $alterados = User::where('_id', $id)->porValidar()->update(['produtor.validado' => true]);

        return back()->with(
            $alterados ? 'sucesso' : 'erro',
            $alterados ? 'Produtor aprovado: já pode publicar produtos e leilões.' : 'O pedido já não está pendente.'
        );
    }

    public function rejeitar(string $id): RedirectResponse
    {
        // Só se remove um pedido que ainda não foi validado
        $removidos = User::where('_id', $id)->porValidar()->delete();

        return back()->with(
            $removidos ? 'sucesso' : 'erro',
            $removidos ? 'Pedido rejeitado e removido.' : 'O pedido já não está pendente.'
        );
    }
}
