<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

/** Avaliações (coleção "reviews"), moderadas pelo administrador. */
class Review extends Model
{
    protected $connection = 'mongodb';

    protected $table = 'reviews';

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected $guarded = ['*'];

    public function autorUtilizador()
    {
        return $this->belongsTo(User::class, 'autor');
    }

    public function vendedor()
    {
        return $this->belongsTo(User::class, 'produtor');
    }

    // Denunciadas e ainda visíveis: as que o administrador tem de moderar
    public function scopePorModerar($query)
    {
        return $query->where('denuncias', '>', 0)->where('visivel', true);
    }
}
