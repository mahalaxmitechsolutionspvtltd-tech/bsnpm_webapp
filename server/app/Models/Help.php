<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Help extends Model
{
    protected $table = 'help';

    protected $fillable = [
        'member_id',
        'member_name',
        'subject',
        'category',
        'message',
        'attachment',
        'status',
        'created_by',
        'created_at',
        'admin_reply',
        'member_replies',
        'updated_by',
        'updated_at',
    ];

    public $timestamps = false;

    protected $appends = [
        'attachment_url',
    ];

    public function getAdminReplyAttribute($value): array|null
    {
        return $this->decodeJsonValue($value);
    }

    public function getMemberRepliesAttribute($value): array|null
    {
        return $this->decodeJsonValue($value);
    }

    public function setAdminReplyAttribute($value): void
    {
        $this->attributes['admin_reply'] = $this->encodeJsonValue($value);
    }

    public function setMemberRepliesAttribute($value): void
    {
        $this->attributes['member_replies'] = $this->encodeJsonValue($value);
    }

    public function getAttachmentUrlAttribute(): ?string
    {
        if (!$this->attachment) {
            return null;
        }

        return url('uploads/help/' . ltrim($this->attachment, '/'));
    }

    private function decodeJsonValue($value): array|null
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_array($value)) {
            return $value;
        }

        $decoded = json_decode($value, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : null;
    }

    private function encodeJsonValue($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_string($value)) {
            json_decode($value, true);

            return json_last_error() === JSON_ERROR_NONE ? $value : json_encode([$value], JSON_UNESCAPED_UNICODE);
        }

        return json_encode($value, JSON_UNESCAPED_UNICODE);
    }
}