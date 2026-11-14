<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

/** Leilões (coleção "auctions"): a licitação atual está embebida; o histórico está em "bids". */
class Auction extends Model
{
    protected $connection = 'mongodb';

    protected $table = 'auctions';

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected $guarded = ['*'];

    protected function casts(): array
    {
        return ['iniciaEm' => 'datetime', 'terminaEm' => 'datetime'];
    }

    public function vendedor()
    {
        return $this->belongsTo(User::class, 'produtor');
    }

    public function licitacoes()
    {
        return $this->hasMany(Bid::class, 'leilao');
    }
}
