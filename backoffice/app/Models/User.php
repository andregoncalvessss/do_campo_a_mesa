<?php

namespace App\Models;

use MongoDB\Laravel\Auth\User as Authenticatable;

/**
 * Utilizadores (coleção "users", partilhada com a API Node.js).
 * Os dados da exploração do produtor estão embebidos no campo "produtor".
 */
class User extends Authenticatable
{
    protected $connection = 'mongodb';

    protected $table = 'users';

    // A API (Mongoose) usa createdAt/updatedAt em vez de created_at/updated_at
    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    // O hash da password nunca é exposto em arrays nem em JSON
    protected $hidden = ['passwordHash'];

    // Nada é preenchido em massa a partir de pedidos: as alterações são explícitas nos controladores
    protected $guarded = ['*'];

    // A password está em "passwordHash" (bcrypt), não em "password"
    public function getAuthPasswordName(): string
    {
        return 'passwordHash';
    }

    public function getAuthPassword(): string
    {
        return (string) $this->passwordHash;
    }

    public function isAdmin(): bool
    {
        return $this->papel === 'admin';
    }

    public function isProdutorValidado(): bool
    {
        return $this->papel === 'produtor' && ($this->produtor['validado'] ?? false) === true;
    }

    // Nome a mostrar: o da exploração, se for produtor
    public function getNomePublicoAttribute(): string
    {
        return $this->produtor['nomeExploracao'] ?? $this->nome;
    }

    public function produtos()
    {
        return $this->hasMany(Product::class, 'produtor');
    }

    // Scopes reutilizados nos controladores
    public function scopeProdutores($query)
    {
        return $query->where('papel', 'produtor');
    }

    public function scopePorValidar($query)
    {
        return $query->where('papel', 'produtor')->where('produtor.validado', '!=', true);
    }

    public function scopeValidados($query)
    {
        return $query->where('papel', 'produtor')->where('produtor.validado', true);
    }
}
