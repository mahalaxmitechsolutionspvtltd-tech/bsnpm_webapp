<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MinutesOfMeeting extends Model
{
    protected $table = 'minutes_of_meetings';

    protected $fillable = [
        'title',
        'audience',
        'meeting_date',
        'publish_date',
        'key_points',
        'attachment_file',
        'is_published',
        'is_deleted',
    ];

    protected $casts = [
        'meeting_date' => 'date',
        'publish_date' => 'date',
        'is_published' => 'boolean',
        'is_deleted' => 'boolean',
    ];

    public function setKeyPointsAttribute($value): void
    {
        if ($value === null || $value === '') {
            $this->attributes['key_points'] = null;
            return;
        }

        if (is_array($value)) {
            $this->attributes['key_points'] = json_encode($value, JSON_UNESCAPED_UNICODE);
            return;
        }

        if (is_string($value)) {
            json_decode($value, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                $this->attributes['key_points'] = $value;
                return;
            }

            $this->attributes['key_points'] = json_encode([
                'text' => $value,
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $this->attributes['key_points'] = json_encode([
            'text' => (string) $value,
        ], JSON_UNESCAPED_UNICODE);
    }

    public function getKeyPointsAttribute($value)
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (!is_string($value)) {
            return $value;
        }

        $decoded = json_decode($value, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return $value;
        }

        if (is_array($decoded) && array_key_exists('text', $decoded) && is_string($decoded['text'])) {
            return $decoded['text'];
        }

        if (is_string($decoded)) {
            return $decoded;
        }

        return $decoded;
    }
}