<?php

// Funções de formatação usadas nas vistas Blade

if (! function_exists('euro')) {
    function euro(float|int|null $valor): string
    {
        return number_format((float) $valor, 2, ',', ' ').' €';
    }
}

if (! function_exists('iniciais')) {
    function iniciais(?string $nome): string
    {
        $partes = array_filter(preg_split('/\s+/', trim((string) $nome)), fn ($p) => mb_strlen($p) > 2);

        return mb_strtoupper(implode('', array_map(fn ($p) => mb_substr($p, 0, 1), array_slice(array_values($partes), 0, 2))));
    }
}

if (! function_exists('loja')) {
    // Link para a aplicação pública (SPA)
    function loja(string $caminho = ''): string
    {
        return rtrim(config('app.loja_url'), '/').'/'.ltrim($caminho, '/');
    }
}
