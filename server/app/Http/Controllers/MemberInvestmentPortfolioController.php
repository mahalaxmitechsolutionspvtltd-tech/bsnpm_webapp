<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\AccountManagement;
use Illuminate\Http\Request;

class MemberInvestmentPortfolioController extends Controller
{
    public function getInvestments(Request $request)
    {
        $search = trim((string) $request->get('search', ''));

        $rows = AccountManagement::query()
            ->select([
                'id',
                'member_id',
                'member_name',
                'member_email',
                'applications_json',
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('member_id', 'like', "%{$search}%")
                        ->orWhere('member_name', 'like', "%{$search}%")
                        ->orWhere('member_email', 'like', "%{$search}%")
                        ->orWhere('applications_json', 'like', "%{$search}%");
                });
            })
            ->orderBy('member_name')
            ->get();

        $members = [];

        foreach ($rows as $row) {
            $memberId = trim((string) ($row->member_id ?? ''));
            $memberName = trim((string) ($row->member_name ?? ''));
            $memberEmail = trim((string) ($row->member_email ?? ''));

            if ($memberId === '') {
                continue;
            }

            if (!isset($members[$memberId])) {
                $members[$memberId] = [
                    'member_id' => $memberId,
                    'member_name' => $memberName,
                    'member_email' => $memberEmail,
                    'rd' => 0,
                    'fd' => 0,
                    'td' => 0,
                    'ly' => 0,
                    'dd' => 0,
                    'share' => 0,
                    'emergency' => 0,
                    'loan_amt' => 0,
                    'loan_out' => 0,
                    'kayam_thev' => 0,
                ];
            }

            $applications = $row->applications_json;

            if (is_string($applications)) {
                $decoded = json_decode($applications, true);
                $applications = json_last_error() === JSON_ERROR_NONE ? $decoded : [];
            }

            if (!is_array($applications)) {
                $applications = [];
            }

            foreach ($applications as $item) {
                if (!is_array($item)) {
                    continue;
                }

                $title = strtolower(trim((string) ($item['title'] ?? '')));
                $applicationNo = strtolower(trim((string) ($item['application no'] ?? $item['application_no'] ?? '')));
                $amount = $this->normalizeAmount($item['amount'] ?? 0);
                $status = strtolower(trim((string) ($item['payment status'] ?? $item['payment_status'] ?? $item['status'] ?? '')));

                if ($amount <= 0) {
                    continue;
                }

                if ($status !== '' && !in_array($status, ['approved', 'paid', 'completed', 'success'])) {
                    continue;
                }

                if ($this->isRd($title, $applicationNo)) {
                    $members[$memberId]['rd'] += $amount;
                    continue;
                }

                if ($this->isFd($title, $applicationNo)) {
                    $members[$memberId]['fd'] += $amount;
                    continue;
                }

                if ($this->isTd($title, $applicationNo)) {
                    $members[$memberId]['td'] += $amount;
                    continue;
                }

                if ($this->isLy($title, $applicationNo)) {
                    $members[$memberId]['ly'] += $amount;
                    continue;
                }

                if ($this->isDd($title, $applicationNo)) {
                    $members[$memberId]['dd'] += $amount;
                    continue;
                }

                if ($this->isShare($title, $applicationNo)) {
                    $members[$memberId]['share'] += $amount;
                    continue;
                }

                if ($this->isEmergency($title, $applicationNo)) {
                    $members[$memberId]['emergency'] += $amount;
                    continue;
                }

                if ($this->isKayamThev($title, $applicationNo)) {
                    $members[$memberId]['kayam_thev'] += $amount;
                    continue;
                }

                if ($this->isLoan($title, $applicationNo)) {
                    $members[$memberId]['loan_amt'] += $amount;
                    continue;
                }
            }
        }

        $members = array_values(array_map(function ($member) {
            $member['rd'] = round($member['rd'], 2);
            $member['fd'] = round($member['fd'], 2);
            $member['td'] = round($member['td'], 2);
            $member['ly'] = round($member['ly'], 2);
            $member['dd'] = round($member['dd'], 2);
            $member['share'] = round($member['share'], 2);
            $member['emergency'] = round($member['emergency'], 2);
            $member['loan_amt'] = round($member['loan_amt'], 2);
            $member['loan_out'] = round(max($member['loan_amt'] - 0, 0), 2);
            $member['kayam_thev'] = round($member['kayam_thev'], 2);

            return $member;
        }, $members));

        $summary = [
            'total_members' => count($members),
            'total_deposits' => round(array_sum(array_column($members, 'rd')), 2),
            'total_loans' => round(array_sum(array_column($members, 'loan_amt')), 2),
            'outstanding' => round(array_sum(array_column($members, 'loan_out')), 2),
            'kayam_thev' => round(array_sum(array_column($members, 'kayam_thev')), 2),
        ];

        return ApiResponse::success(
            'Member investment portfolio fetched successfully',
            [
                'summary' => $summary,
                'members' => $members,
            ]
        );
    }

    private function normalizeAmount($amount): float
    {
        if (is_numeric($amount)) {
            return round((float) $amount, 2);
        }

        if (is_string($amount)) {
            $clean = preg_replace('/[^\d.\-]/', '', $amount);
            return is_numeric($clean) ? round((float) $clean, 2) : 0;
        }

        return 0;
    }

    private function containsAny(string $value, array $needles): bool
    {
        foreach ($needles as $needle) {
            if ($needle !== '' && str_contains($value, strtolower($needle))) {
                return true;
            }
        }

        return false;
    }

    private function isRd(string $title, string $applicationNo): bool
    {
        return $this->containsAny($title, ['rd', 'recurring deposit']) || $this->containsAny($applicationNo, ['-rd-']);
    }

    private function isFd(string $title, string $applicationNo): bool
    {
        return $this->containsAny($title, ['fd', 'fixed deposit']) || $this->containsAny($applicationNo, ['-fd-']);
    }

    private function isTd(string $title, string $applicationNo): bool
    {
        return $this->containsAny($title, ['td', 'term deposit']) || $this->containsAny($applicationNo, ['-td-']);
    }

    private function isLy(string $title, string $applicationNo): bool
    {
        return $this->containsAny($title, ['ly', 'lakshmi yojana', 'laxmi yojana']) || $this->containsAny($applicationNo, ['-ly-']);
    }

    private function isDd(string $title, string $applicationNo): bool
    {
        return $this->containsAny($title, ['dd', 'daily deposit']) || $this->containsAny($applicationNo, ['-dd-']);
    }

    private function isShare(string $title, string $applicationNo): bool
    {
        return $this->containsAny($title, ['share']) || $this->containsAny($applicationNo, ['share']);
    }

    private function isEmergency(string $title, string $applicationNo): bool
    {
        return $this->containsAny($title, ['emergency']) || $this->containsAny($applicationNo, ['emergency']);
    }

    private function isKayamThev(string $title, string $applicationNo): bool
    {
        return $this->containsAny($title, ['kayam thev', 'permanent deposit']) || $this->containsAny($applicationNo, ['kayam', '-kt-']);
    }

    private function isLoan(string $title, string $applicationNo): bool
    {
        return $this->containsAny($title, ['loan', 'emi']) || $this->containsAny($applicationNo, ['-ln-', 'loan']);
    }
}