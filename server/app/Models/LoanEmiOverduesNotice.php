<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanEmiOverduesNotice extends Model
{
    protected $table = 'loan_emi_overdues_notices';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'application_no',
        'member_id',
        'member_name',
        'member_email',
        'emi_date',
        'emi_amount',
        'is_mail_send',
        'send_by',
        'send_at',
    ];

    protected $casts = [
        'id' => 'integer',
        'emi_date' => 'date',
        'emi_amount' => 'decimal:2',
        'is_mail_send' => 'boolean',
        'send_at' => 'datetime',
    ];
}