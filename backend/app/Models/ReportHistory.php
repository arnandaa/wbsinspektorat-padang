<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportHistory extends Model
{
    protected $table = 'report_history';

    protected $fillable = [
        'report_token',
        'status',
        'note',
        'date',
        'is_user_msg',
        'file_name',
        'file_data'
    ];

    protected $casts = [
        'is_user_msg' => 'boolean',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class, 'report_token', 'token');
    }

    public function getDateAttribute($value)
    {
        if (!$value) return null;
        try {
            return \Carbon\Carbon::parse($value)->locale('id')->isoFormat('D MMMM Y, HH:mm') . ' WIB';
        } catch (\Exception $e) {
            return $value;
        }
    }
}

