<?php

namespace App\Http\Controllers;

use App\Models\Notice;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoticeController extends Controller
{
    public function getNotices(Request $request): JsonResponse
    {
        $audience = strtoupper(trim((string) $request->query('audience', '')));
        $search = trim((string) $request->query('search', ''));
        $today = Carbon::now();

        $query = Notice::query()
            ->where('publish_at', '<=', $today)
            ->where(function ($q) use ($today) {
                $q->whereNull('expire_at')
                    ->orWhere('expire_at', '>=', $today);
            });

        if ($audience !== '') {
            $query->where('audience', $audience);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('message', 'like', '%' . $search . '%');
            });
        }

        $notices = $query
            ->orderBy('publish_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Notices fetched successfully',
            'data' => $notices,
        ], 200);
    }
}