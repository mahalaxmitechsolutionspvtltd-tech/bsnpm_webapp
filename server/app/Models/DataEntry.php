<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataEntry extends Model
{
    protected $table = 'data_entry';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'voucher_no',
        'entry_type',
        'date',
        'category',
        'payment_mode',
        'amount',
        'reference',
        'description',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
        'is_deleted',
        'deleted_by',
    ];

    protected $casts = [
        'id' => 'integer',
        'date' => 'date',
        'amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}