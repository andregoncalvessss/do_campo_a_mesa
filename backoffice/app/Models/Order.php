<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use MongoDB\Laravel\Eloquent\Model;

/** Encomendas (coleção "orders"): linhas embebidas, comprador e produtor referenciados. */
class Order extends Model
{
    public const ESTADOS = ['pendente', 'confirmada', 'pronta', 'entregue'];

    protected $connection = 'mongodb';

    protected $table = 'orders';

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected $guarded = ['*'];

    public function cliente()
    {
        return $this->belongsTo(User::class, 'comprador');
    }

    public function vendedor()
    {
        return $this->belongsTo(User::class, 'produtor');
    }

    // Total calculado a partir das linhas embebidas (tal como o virtual do Mongoose)
    protected function total(): Attribute
    {
        return Attribute::get(fn () => round(
            collect($this->linhas ?? [])->sum(fn ($l) => ($l['precoUnit'] ?? 0) * ($l['quantidade'] ?? 0)),
            2
        ));
    }

    // Referência curta, igual à da SPA: #A1B2C3
    protected function referencia(): Attribute
    {
        return Attribute::get(fn () => '#'.strtoupper(substr((string) $this->getKey(), -6)));
    }
}
