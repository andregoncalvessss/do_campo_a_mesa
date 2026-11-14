<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use Illuminate\Http\Request;
use Illuminate\View\View;

/** Leilões ativos, agendados e terminados, com o histórico de licitações de cada um. */
class LeilaoController extends Controller
{
    public function index(Request $request): View
    {
        $estado = $request->validate(['estado' => ['nullable', 'in:ativo,agendado,terminado']])['estado'] ?? 'ativo';

        $leiloes = Auction::with('vendedor')
            ->where('estado', $estado)
            ->orderBy('terminaEm', $estado === 'terminado' ? 'desc' : 'asc')
            ->paginate(15)
            ->withQueryString();

        return view('leiloes.index', compact('leiloes', 'estado'));
    }

    public function show(string $id): View
    {
        $leilao = Auction::with('vendedor')->findOrFail($id);
        $licitacoes = $leilao->licitacoes()->orderByDesc('createdAt')->limit(100)->get();

        return view('leiloes.show', compact('leilao', 'licitacoes'));
    }
}
