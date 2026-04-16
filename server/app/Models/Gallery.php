<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gallery extends Model
{
    protected $table = 'gallery';

    protected $fillable = [
        'folder_name',
        'photos_json',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
        'is_deleted',
        'deleted_by',
    ];

    protected $casts = [
        'photos_json' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}