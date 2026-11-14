<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

/** Painel global de encomendas (só consulta: o estado é mudado pelo produtor na aplicação). */
class EncomendaController extends Controller
{
    public function index(Request $request): View
    {
        $estado = $request->validate(['estado' => ['nullable', Rule::in(Order::ESTADOS)]])['estado'] ?? null;

        $consulta = Order::with('cliente', 'vendedor')->orderByDesc('createdAt');
        if ($estado) {
            $consulta->where('estado', $estado);
        }

        // Contagem por estado numa só agregação
        $porEstado = Order::raw(fn ($colecao) => $colecao->aggregate([
            ['$group' => ['_id' => '$estado', 'n' => ['$sum' => 1]]],
        ]));
        $contagens = collect($porEstado)->mapWithKeys(fn ($r) => [$r['_id'] => $r['n']]);

        return view('encomendas.index', [
            'encomendas' => $consulta->paginate(20)->withQueryString(),
            'estado' => $estado,
            'contagens' => $contagens,
        ]);
    }
}
