<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

/** Licitações (coleção "bids"), referenciadas ao leilão. */
class Bid extends Model
{
    protected $connection = 'mongodb';

    protected $table = 'bids';

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected $guarded = ['*'];

    public function leilaoPai()
    {
        return $this->belongsTo(Auction::class, 'leilao');
    }
}
