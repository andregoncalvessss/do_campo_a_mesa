<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AvaliacaoController;
use App\Http\Controllers\EncomendaController;
use App\Http\Controllers\LeilaoController;
use App\Http\Controllers\PainelController;
use App\Http\Controllers\ProdutoController;
use App\Http\Controllers\ProdutorController;
use App\Http\Controllers\UtilizadorController;
use Illuminate\Support\Facades\Route;

// Sessão
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'formulario'])->name('login');
    Route::post('/login', [AuthController::class, 'entrar'])->middleware('throttle:10,1'); // 10 tentativas por minuto
});
Route::post('/logout', [AuthController::class, 'sair'])->middleware('auth')->name('logout');

// Backoffice: só administradores autenticados
Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/', PainelController::class)->name('painel');

    Route::get('/produtores', [ProdutorController::class, 'index'])->name('produtores.index');
    Route::patch('/produtores/{id}/aprovar', [ProdutorController::class, 'aprovar'])->name('produtores.aprovar');
    Route::delete('/produtores/{id}', [ProdutorController::class, 'rejeitar'])->name('produtores.rejeitar');

    Route::get('/avaliacoes', [AvaliacaoController::class, 'index'])->name('avaliacoes.index');
    Route::patch('/avaliacoes/{id}/manter', [AvaliacaoController::class, 'manter'])->name('avaliacoes.manter');
    Route::patch('/avaliacoes/{id}/ocultar', [AvaliacaoController::class, 'ocultar'])->name('avaliacoes.ocultar');

    Route::get('/utilizadores', [UtilizadorController::class, 'index'])->name('utilizadores.index');
    Route::get('/encomendas', [EncomendaController::class, 'index'])->name('encomendas.index');

    Route::get('/leiloes', [LeilaoController::class, 'index'])->name('leiloes.index');
    Route::get('/leiloes/{id}', [LeilaoController::class, 'show'])->name('leiloes.show');

    Route::get('/produtos', [ProdutoController::class, 'index'])->name('produtos.index');
    Route::delete('/produtos/{id}', [ProdutoController::class, 'destroy'])->name('produtos.destroy');
});
