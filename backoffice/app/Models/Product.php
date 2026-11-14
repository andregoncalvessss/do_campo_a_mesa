<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

/** Produtos do catálogo (coleção "products"). O produtor é uma referência a "users". */
class Product extends Model
{
    protected $connection = 'mongodb';

    protected $table = 'products';

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected $guarded = ['*'];

    // O campo "produtor" guarda o ObjectId; a relação tem outro nome para não colidir com ele
    public function vendedor()
    {
        return $this->belongsTo(User::class, 'produtor');
    }
}
