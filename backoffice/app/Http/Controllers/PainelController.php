<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use Illuminate\View\View;

/** Visão geral: indicadores globais e o que está à espera do administrador. */
class PainelController extends Controller
{
    public function __invoke(): View
    {
        $encomendasHoje = Order::where('createdAt', '>=', today())->get();

        return view('painel', [
            'indicadores' => [
                'utilizadores' => User::count(),
                'novosSemana' => User::where('createdAt', '>=', now()->subWeek())->count(),
                'produtoresAtivos' => User::validados()->count(),
                'porValidar' => User::porValidar()->count(),
                'encomendasHoje' => $encomendasHoje->count(),
                'vendasHoje' => $encomendasHoje->sum('total'),
                'leiloesAtivos' => Auction::where('estado', 'ativo')->count(),
                'porModerar' => Review::porModerar()->count(),
            ],
            'pendentes' => User::porValidar()->orderBy('createdAt')->limit(5)->get(),
            'denunciadas' => Review::porModerar()->with('autorUtilizador', 'vendedor')->orderByDesc('denuncias')->limit(5)->get(),
            'leiloes' => Auction::where('estado', 'ativo')->with('vendedor')->orderBy('terminaEm')->get(),
            'encomendas' => Order::with('cliente', 'vendedor')->orderByDesc('createdAt')->limit(6)->get(),
        ]);
    }
}
