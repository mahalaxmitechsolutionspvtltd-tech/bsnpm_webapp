<?php

namespace App\Http\Controllers;

use App\Models\Help;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;

class HelpController extends Controller
{
    public function getAll(Request $request): JsonResponse
    {
        $query = Help::query();

        if ($request->filled('member_id')) {
            $query->where('member_id', $request->string('member_id')->toString());
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('category')) {
            $query->where('category', $request->string('category')->toString());
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search')->toString());

            $query->where(function ($q) use ($search) {
                $q->where('member_id', 'like', "%{$search}%")
                    ->orWhere('member_name', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%")
                    ->orWhere('created_by', 'like', "%{$search}%")
                    ->orWhere('updated_by', 'like', "%{$search}%");
            });
        }

        $helps = $query
            ->orderByDesc('id')
            ->get()
            ->map(fn (Help $help) => $this->transformHelp($help));

        return response()->json([
            'success' => true,
            'message' => 'Help records fetched successfully.',
            'data' => $helps,
        ]);
    }

    public function getById(int $id): JsonResponse
    {
        $help = Help::find($id);

        if (!$help) {
            return response()->json([
                'success' => false,
                'message' => 'Help record not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Help record fetched successfully.',
            'data' => $this->transformHelp($help),
        ]);
    }

    public function reply(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'message' => ['required', 'string'],
            'admin_name' => ['nullable', 'string', 'max:255'],
            'updated_by' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $help = Help::find($id);

        if (!$help) {
            return response()->json([
                'success' => false,
                'message' => 'Help record not found.',
            ], 404);
        }

        $replyEntry = [
            'message' => trim($request->input('message')),
            'admin_name' => $request->input('admin_name'),
            'reply_at' => Carbon::now()->toDateTimeString(),
        ];

        $existingReplies = $help->admin_reply;

        if (is_array($existingReplies) && array_key_exists('message', $existingReplies)) {
            $existingReplies = [$existingReplies];
        }

        if (!is_array($existingReplies)) {
            $existingReplies = [];
        }

        $existingReplies[] = $replyEntry;

        $help->admin_reply = $existingReplies;
        $help->status = $request->input('status', 'Replied');
        $help->updated_by = $request->input('updated_by', $request->input('admin_name', 'Admin'));
        $help->updated_at = Carbon::now()->toDateTimeString();
        $help->save();

        return response()->json([
            'success' => true,
            'message' => 'Reply added successfully.',
            'data' => $this->transformHelp($help->fresh()),
        ]);
    }

    private function transformHelp(Help $help): array
    {
        return [
            'id' => $help->id,
            'member_id' => $help->member_id,
            'member_name' => $help->member_name,
            'subject' => $help->subject,
            'category' => $help->category,
            'message' => $help->message,
            'attachment' => $help->attachment,
            'attachment_url' => $help->attachment_url,
            'status' => $help->status,
            'created_by' => $help->created_by,
            'created_at' => $help->created_at,
            'admin_reply' => $help->admin_reply,
            'member_replies' => $help->member_replies,
            'updated_by' => $help->updated_by,
            'updated_at' => $help->updated_at,
        ];
    }
}