<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    protected $table = 'members';

    protected $fillable = [
        'member_id',
        'full_name',
        'email',
        'mobile_number',
        'residential_address',
        'gender',
        'status',
        'profile_photo',
        'password',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
        'is_deleted',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Member $member) {
            if (empty($member->member_id)) {
                $member->member_id = self::generateMemberId();
            }

            if (empty($member->status)) {
                $member->status = 'active';
            }

            if (!isset($member->is_deleted)) {
                $member->is_deleted = 0;
            }
        });
    }

    public static function generateMemberId(): string
    {
        $prefix = 'BSNPM';

        $lastMember = self::withoutGlobalScopes()
            ->whereNotNull('member_id')
            ->where('member_id', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->first();

        if (!$lastMember || empty($lastMember->member_id)) {
            return $prefix . '01';
        }

        $lastNumber = (int) str_replace($prefix, '', $lastMember->member_id);
        $nextNumber = $lastNumber + 1;

        return $prefix . str_pad((string) $nextNumber, 2, '0', STR_PAD_LEFT);
    }

    public function nominees()
    {
        return $this->hasMany(MemberNominee::class, 'member_name', 'full_name');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_deleted', 0);
    }
}