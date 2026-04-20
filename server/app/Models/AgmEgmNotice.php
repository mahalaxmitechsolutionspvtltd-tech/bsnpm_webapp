<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgmEgmNotice extends Model
{
    use HasFactory;

    protected $table = 'agm_egm_notice';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'type',
        'audience',
        'title',
        'meeting_at',
        'is_published',
        'is_drafted',
        'publish_date',
        'attachment_file',
        'created_by',
        'created_at',
        'updated_by',
        'update_at',
        'is_deleted',
        'deleted_by',
    ];

    protected $casts = [
        'meeting_at' => 'datetime',
        'is_published' => 'boolean',
        'is_drafted' => 'boolean',
        'publish_date' => 'datetime',
        'created_at' => 'datetime',
        'update_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}