<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('token', 50)->unique();
            $table->string('date_submitted', 50);
            $table->boolean('is_anonim')->default(true);
            $table->string('category', 150);
            $table->string('title', 255);
            $table->string('incident_date', 50)->nullable();
            $table->string('location', 255);
            $table->text('description');
            $table->string('file_name', 255)->nullable();
            $table->longText('file_data')->nullable(); // Base64 or Supabase Storage URL
            $table->string('status', 50)->default('Diajukan');
            $table->text('reporter_name')->nullable();  // Encrypted via Crypt
            $table->text('reporter_nik')->nullable();   // Encrypted via Crypt
            $table->text('reporter_email')->nullable(); // Encrypted via Crypt
            $table->text('reporter_hp')->nullable();    // Encrypted via Crypt
            $table->timestamps();

            $table->index('token');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
