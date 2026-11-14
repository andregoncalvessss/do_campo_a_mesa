<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

/** Sessão do administrador. As contas são as da coleção "users" (as mesmas da API). */
class AuthController extends Controller
{
    public function formulario(): View
    {
        return view('auth.login');
    }

    public function entrar(Request $request): RedirectResponse
    {
        $dados = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $utilizador = User::where('email', strtolower($dados['email']))->first();

        // As passwords foram gravadas pela API com bcrypt; password_verify valida o mesmo hash.
        // A mensagem é igual para email inexistente, password errada ou conta sem papel de admin.
        if (! $utilizador || ! $utilizador->isAdmin() || ! password_verify($dados['password'], $utilizador->getAuthPassword())) {
            return back()->withErrors(['email' => 'Credenciais inválidas.'])->onlyInput('email');
        }

        Auth::login($utilizador);
        $request->session()->regenerate(); // evita fixação de sessão

        return redirect()->intended(route('painel'));
    }

    public function sair(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
