<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class Report extends Model
{
    protected $table = 'reports';

    protected $fillable = [
        'token',
        'date_submitted',
        'is_anonim',
        'category',
        'title',
        'incident_date',
        'location',
        'description',
        'file_name',
        'file_data',
        'status',
        'reporter_name',
        'reporter_nik',
        'reporter_email',
        'reporter_hp'
    ];

    protected $casts = [
        'is_anonim' => 'boolean',
    ];

    public function history(): HasMany
    {
        return $this->hasMany(ReportHistory::class, 'report_token', 'token')->orderBy('id', 'asc');
    }

    // Mutators & Accessors for Encryption
    public function setReporterNameAttribute($value)
    {
        $this->attributes['reporter_name'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getReporterNameAttribute($value)
    {
        if (!$value) return null;
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return $value;
        }
    }

    public function setReporterNikAttribute($value)
    {
        $this->attributes['reporter_nik'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getReporterNikAttribute($value)
    {
        if (!$value) return null;
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return $value;
        }
    }

    public function setReporterEmailAttribute($value)
    {
        $this->attributes['reporter_email'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getReporterEmailAttribute($value)
    {
        if (!$value) return null;
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return $value;
        }
    }

    public function setReporterHpAttribute($value)
    {
        $this->attributes['reporter_hp'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getReporterHpAttribute($value)
    {
        if (!$value) return null;
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return $value;
        }
    }

    public function getDateSubmittedAttribute($value)
    {
        if (!$value) return null;
        try {
            return \Carbon\Carbon::parse($value)->locale('id')->isoFormat('D MMMM Y, HH:mm') . ' WIB';
        } catch (\Exception $e) {
            return $value;
        }
    }
}

