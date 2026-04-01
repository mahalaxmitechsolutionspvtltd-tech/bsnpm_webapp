<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MemberNominee extends Model
{
    protected $table = 'members_nominees';

    public $timestamps = false;

    protected $fillable = [
        'member_name',
        'nominee_name',
        'relation',
        'nominee_contact',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_name', 'full_name');
    }
}