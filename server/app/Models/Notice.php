<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notice extends Model
{
    protected $table = 'notices';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'title',
        'audience',
        'message',
        'attachment_path',
        'attachment_name',
        'publish_at',
        'expire_at',
        'created_by_admin_id',
        'created_at',
        'updated_by_admin_id',
        'updated_at',
    ];

    protected $casts = [
        'id' => 'integer',
        'publish_at' => 'datetime',
        'expire_at' => 'datetime',
        'created_by_admin_id' => 'integer',
        'created_at' => 'datetime',
        'updated_by_admin_id' => 'integer',
        'updated_at' => 'datetime',
    ];
}