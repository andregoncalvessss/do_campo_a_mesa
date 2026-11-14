<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_o_backoffice_exige_sessao_de_administrador(): void
    {
        foreach (['/', '/produtores', '/avaliacoes', '/utilizadores', '/encomendas', '/leiloes', '/produtos'] as $caminho) {
            $this->get($caminho)->assertRedirect('/login');
        }
    }

    public function test_a_pagina_de_login_abre(): void
    {
        $this->get('/login')->assertOk()->assertSee('Acesso reservado a administradores');
    }

    public function test_as_acoes_de_escrita_exigem_sessao(): void
    {
        $this->patch('/produtores/000000000000000000000000/aprovar')->assertRedirect('/login');
        $this->delete('/produtos/000000000000000000000000')->assertRedirect('/login');
    }
}
