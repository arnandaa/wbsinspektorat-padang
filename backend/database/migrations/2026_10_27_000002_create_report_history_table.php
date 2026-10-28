<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_history', function (Blueprint $table) {
            $table->id();
            $table->string('report_token', 50);
            $table->string('status', 50);
            $table->text('note')->nullable();
            $table->string('date', 50);
            $table->boolean('is_user_msg')->default(false);
            $table->string('file_name', 255)->nullable();
            $table->longText('file_data')->nullable();
            $table->timestamps();

            $table->foreign('report_token')->references('token')->on('reports')->onDelete('cascade');
            $table->index('report_token');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_history');
    }
};
