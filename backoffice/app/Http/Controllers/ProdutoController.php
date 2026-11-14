<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/** Moderação de conteúdos: consultar o catálogo e remover produtos impróprios. */
class ProdutoController extends Controller
{
    public function index(Request $request): View
    {
        $q = $request->validate(['q' => ['nullable', 'string', 'max:100']])['q'] ?? null;

        $consulta = Product::with('vendedor')->orderByDesc('createdAt');
        if ($q) {
            $consulta->where('nome', 'regex', new \MongoDB\BSON\Regex(preg_quote($q), 'i'));
        }

        return view('produtos.index', ['produtos' => $consulta->paginate(20)->withQueryString(), 'q' => $q]);
    }

    public function destroy(string $id): RedirectResponse
    {
        $produto = Product::find($id);
        if (! $produto) {
            return back()->with('erro', 'Produto não encontrado.');
        }
        $nome = $produto->nome;
        $produto->delete();

        return back()->with('sucesso', "Produto \"{$nome}\" removido do catálogo.");
    }
}
