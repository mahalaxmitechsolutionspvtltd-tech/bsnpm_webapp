<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    use HasFactory;

    protected $table = 'complaints';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'member_id',
        'member_name',
        'subject',
        'category',
        'message',
        'admin_reply',
        'member_reply',
        'status',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
        'is_deleted',
        'deleted_by',
    ];

    protected $casts = [
        'admin_reply' => 'array',
        'member_reply' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}