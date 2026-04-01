<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoanEmiOverduesNotice extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'loan_emi_overdues_notices';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'id';

    /**
     * Indicates if the model's ID is auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = true;

    /**
     * The data type of the primary key.
     *
     * @var string
     */
    protected $keyType = 'int';

    /**
     * Indicates if the model should be timestamped.
     * Set to false since the table uses a custom 'send_at' column
     * instead of Laravel's default created_at/updated_at.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
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

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'emi_date' => 'date',
        'emi_amount' => 'decimal:2',
        'is_mail_send' => 'boolean',
        'send_at' => 'datetime',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [];


    /**
     * Scope: only records where the mail has been sent.
     */
    public function scopeMailSent($query)
    {
        return $query->where('is_mail_send', true);
    }

    /**
     * Scope: only records where the mail has NOT been sent.
     */
    public function scopeMailPending($query)
    {
        return $query->where('is_mail_send', false);
    }

    /**
     * Scope: filter by member ID.
     */
    public function scopeForMember($query, string $memberId)
    {
        return $query->where('member_id', $memberId);
    }

    /**
     * Scope: filter by application number.
     */
    public function scopeForApplication($query, string $applicationNo)
    {
        return $query->where('application_no', $applicationNo);
    }

    /**
     * Scope: EMI notices due on or before a given date.
     */
    public function scopeDueBy($query, string $date)
    {
        return $query->whereDate('emi_date', '<=', $date);
    }
}