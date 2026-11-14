<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/** Moderação de avaliações denunciadas. */
class AvaliacaoController extends Controller
{
    public function index(Request $request): View
    {
        $filtro = $request->validate(['estado' => ['nullable', 'in:denunciadas,ocultas,todas']])['estado'] ?? 'denunciadas';

        $consulta = Review::with('autorUtilizador', 'vendedor');
        match ($filtro) {
            'denunciadas' => $consulta->porModerar()->orderByDesc('denuncias'),
            'ocultas' => $consulta->where('visivel', false)->orderByDesc('updatedAt'),
            default => $consulta->orderByDesc('createdAt'),
        };

        return view('avaliacoes.index', ['avaliacoes' => $consulta->paginate(15)->withQueryString(), 'filtro' => $filtro]);
    }

    // Manter: a avaliação continua pública e as denúncias são limpas
    public function manter(string $id): RedirectResponse
    {
        $n = Review::where('_id', $id)->update(['visivel' => true, 'denuncias' => 0, 'denunciadoPor' => []]);

        return back()->with($n ? 'sucesso' : 'erro', $n ? 'Avaliação mantida; denúncias arquivadas.' : 'Avaliação não encontrada.');
    }

    // Ocultar: deixa de aparecer na página do produtor e de contar para a média
    public function ocultar(string $id): RedirectResponse
    {
        $n = Review::where('_id', $id)->update(['visivel' => false]);

        return back()->with($n ? 'sucesso' : 'erro', $n ? 'Avaliação ocultada.' : 'Avaliação não encontrada.');
    }
}
