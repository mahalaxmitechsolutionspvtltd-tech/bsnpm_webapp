<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Download extends Model
{
    use HasFactory;

    protected $table = 'downloads';

    protected $fillable = [
        'title',
        'description',
        'attachment',
        'created_by',
        'updated_by',
        'is_deleted',
        'deleted_by',
    ];

    protected $casts = [
        'is_deleted' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}