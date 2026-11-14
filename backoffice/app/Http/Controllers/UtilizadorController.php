<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\View\View;

/** Painel global de utilizadores, com pesquisa e filtro por papel. */
class UtilizadorController extends Controller
{
    public function index(Request $request): View
    {
        $filtro = $request->validate([
            'papel' => ['nullable', 'in:comprador,produtor,admin'],
            'q' => ['nullable', 'string', 'max:100'],
        ]);

        $consulta = User::query()->orderByDesc('createdAt');
        if (! empty($filtro['papel'])) {
            $consulta->where('papel', $filtro['papel']);
        }
        if (! empty($filtro['q'])) {
            // O texto é escapado antes de ir para a expressão regular
            $rx = new \MongoDB\BSON\Regex(preg_quote($filtro['q']), 'i');
            $consulta->where(fn ($c) => $c->where('nome', 'regex', $rx)->orWhere('email', 'regex', $rx));
        }

        return view('utilizadores.index', [
            'utilizadores' => $consulta->paginate(20)->withQueryString(),
            'filtro' => $filtro + ['papel' => null, 'q' => null],
            'totais' => [
                'comprador' => User::where('papel', 'comprador')->count(),
                'produtor' => User::where('papel', 'produtor')->count(),
                'admin' => User::where('papel', 'admin')->count(),
            ],
        ]);
    }
}
