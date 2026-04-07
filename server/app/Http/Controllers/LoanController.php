<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Mail\RecoveryNoticeMail;
use App\Models\LoanApplication;
use App\Models\LoanApplicationDeduction;
use App\Models\LoanEmi;
use App\Models\LoanEmiOverduesNotice;
use App\Models\LoanScheme;
use App\Models\Member;
use App\Models\TrialBalance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Validator;

class LoanController extends Controller
{
    public function getLoanSchemes()
    {
        $loanSchemes = LoanScheme::query()
            ->where('is_deleted', 0)
            ->orderBy('id', 'desc')
            ->get([
                'id',
                'scheme_name',
                'loan_details',
                'interest_rate',
                'loan_max_amount',
                'created_by',
                'created_at',
                'updated_by',
                'updated_at',
            ]);

        if ($loanSchemes->isEmpty()) {
            return ApiResponse::success('No loan schemes found.', []);
        }

        return ApiResponse::success(
            'Loan schemes fetched successfully.',
            $loanSchemes,
            200
        );
    }

    public function addLoanSchemes(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'scheme_name' => ['required', 'string'],
            'interest_rate' => ['required', 'numeric'],
            'loan_details' => ['required', 'string'],
            'created_by' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return ApiResponse::error(
                'Validation failed',
                $validator->errors(),
                422
            );
        }

        $scheme = LoanScheme::create([
            'scheme_name' => $request->scheme_name,
            'loan_details' => $request->loan_details,
            'interest_rate' => $request->interest_rate,
            'loan_max_amount' => 500000,
            'created_by' => $request->created_by,
            'updated_by' => null,
            'is_deleted' => 0,
            'deleted_by' => null,
        ]);

        return ApiResponse::success(
            'Loan scheme added successfully',
            $scheme
        );
    }

    public function updateLoanSchemes(Request $request, $scheme_id)
    {
        if (!$scheme_id) {
            return ApiResponse::error('Missing scheme id', null, 404);
        }

        $validated = Validator::make($request->all(), [
            'scheme_name' => 'required|string',
            'loan_details' => 'required|string',
            'interest_rate' => 'required|numeric',
            'created_by' => 'required|string',
        ]);

        if ($validated->fails()) {
            return ApiResponse::error(
                'Validation failed',
                $validated->errors(),
                422
            );
        }

        $scheme = LoanScheme::find($scheme_id);

        if (!$scheme) {
            return ApiResponse::error('Loan scheme not found', null, 404);
        }

        $scheme->update([
            'scheme_name' => $request->scheme_name,
            'loan_details' => $request->loan_details,
            'interest_rate' => $request->interest_rate,
            'loan_max_amount' => 500000,
            'updated_by' => $request->created_by,
        ]);

        return ApiResponse::success(
            'Loan scheme updated successfully',
            $scheme->fresh()
        );
    }

    public function deleteLoanSchemes(Request $request, $scheme_id)
    {
        if (!$scheme_id) {
            return ApiResponse::error('Missing scheme id', null, 404);
        }

        $scheme = LoanScheme::where('id', $scheme_id)
            ->where('is_deleted', 0)
            ->first();

        if (!$scheme) {
            return ApiResponse::error('Loan scheme not found', null, 404);
        }

        $scheme->update([
            'is_deleted' => 1,
            'deleted_by' => $request->deleted_by,
        ]);

        return ApiResponse::success(
            'Loan scheme deleted successfully',
            $scheme
        );
    }


    // LOAN APPLICAION  GET,APPROVE,UPDATE  

    public function getLoanApplications()
    {
        try {
            $loanApplications = LoanApplication::orderBy('id', 'desc')->get();

            return ApiResponse::success(
                'Loan applications fetched successfully',
                $loanApplications
            );
        } catch (\Throwable $th) {
            return ApiResponse::error(
                'Failed to fetch loan applications',
                $th->getMessage(),
                500
            );
        }
    }
    public function approveLoanApplication(Request $request, $application_id)
    {
        $validator = Validator::make($request->all(), [
            'application_status' => 'required|string|in:pending,approved,rejected',
            'start_date' => 'nullable|date',
            'sanctioned_amount' => 'nullable|numeric|min:0',
            'updated_by' => 'required|string|max:255',
            'deductions' => 'nullable|array',
            'deductions.*.type' => 'required_with:deductions|string|max:255',
            'deductions.*.calculation' => 'nullable|string|max:255',
            'deductions.*.amount' => 'required_with:deductions|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            $application = LoanApplication::find($application_id);

            if (!$application) {
                return response()->json([
                    'success' => false,
                    'message' => 'Loan application not found',
                ], 404);
            }

            $requestedStatus = strtolower(trim((string) $request->application_status));

            $startDate = $request->start_date
                ? Carbon::parse($request->start_date)->startOfDay()
                : null;

            $sanchalakApproved = strtolower(trim((string) $application->sanchalak_approvals_status)) === 'approved';
            $guarantor1Approved = strtolower(trim((string) $application->guarantor_1_status)) === 'approved';
            $guarantor2Approved = strtolower(trim((string) $application->guarantor_2_status)) === 'approved';

            if ($requestedStatus === 'approved') {
                if (!$sanchalakApproved || !$guarantor1Approved || !$guarantor2Approved) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Loan cannot be approved until Sanchalak and both guarantors are approved',
                        'data' => [
                            'sanchalak_approvals_status' => $application->sanchalak_approvals_status,
                            'guarantor_1_status' => $application->guarantor_1_status,
                            'guarantor_2_status' => $application->guarantor_2_status,
                        ],
                    ], 422);
                }

                if (!$startDate) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Start date is required when application is approved',
                    ], 422);
                }
            }

            $endDate = null;
            $tenureMonths = 0;

            if ($requestedStatus === 'approved') {
                $tenureYears = (int) ($application->tenure_years ?? 0);
                $tenureMonthsFromDb = (int) ($application->tenure_months ?? 0);

                if ($tenureMonthsFromDb > 0) {
                    $tenureMonths = $tenureMonthsFromDb;
                } elseif ($tenureYears > 0) {
                    $tenureMonths = $tenureYears * 12;
                }

                if ($tenureMonths <= 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Tenure not found for this application',
                    ], 422);
                }

                $endDate = $startDate->copy()->addMonths($tenureMonths)->subDay();
            }

            $deductions = $request->deductions ?? [];

            $kayamThevAmount = 0;
            $processingFeeAmount = 0;
            $formFeeAmount = 0;

            foreach ($deductions as $item) {
                $type = strtolower(trim((string) ($item['type'] ?? '')));
                $amount = (float) ($item['amount'] ?? 0);

                if ($type === 'kayam thev') {
                    $kayamThevAmount = $amount;
                } elseif ($type === 'processing fee') {
                    $processingFeeAmount = $amount;
                } elseif ($type === 'form fee') {
                    $formFeeAmount = $amount;
                }
            }

            $totalDeductions = $kayamThevAmount + $processingFeeAmount + $formFeeAmount;

            $sanctionedAmount = $request->filled('sanctioned_amount')
                ? (float) $request->sanctioned_amount
                : (float) ($application->loan_amount ?? 0);

            $netDisbursementAmount = max($sanctionedAmount - $totalDeductions, 0);

            $application->application_status = $requestedStatus;
            $application->sanctioned_amount = $sanctionedAmount;
            $application->start_date = $startDate ? $startDate->format('Y-m-d') : null;
            $application->end_date = $endDate ? $endDate->format('Y-m-d') : null;

            if ($requestedStatus === 'approved') {
                $application->admin_approval_status = 'approved';
                $application->admin_approved_at = now();
                $application->admin_approved_by = $request->updated_by;
                $application->is_active = 1;
            }

            if ($requestedStatus === 'rejected') {
                $application->admin_approval_status = 'rejected';
                $application->is_active = 0;
            }

            $application->save();

            LoanApplicationDeduction::updateOrCreate(
                ['application_no' => $application->application_no],
                [
                    'member_id' => $application->member_id,
                    'member_name' => $application->member_name,
                    'applied_date' => $application->created_at
                        ? Carbon::parse($application->created_at)->format('Y-m-d')
                        : now()->format('Y-m-d'),
                    'start_date' => $startDate ? $startDate->format('Y-m-d') : null,
                    'end_date' => $endDate ? $endDate->format('Y-m-d') : null,
                    'loan_amount' => $sanctionedAmount,
                    'kayam_thev_amount' => $kayamThevAmount,
                    'loan_processing_fee' => $processingFeeAmount,
                    'loan_form_fee' => $formFeeAmount,
                    'total_deductions' => $totalDeductions,
                    'created_by' => $application->created_by ?? $request->updated_by,
                    'created_at' => now(),
                    'updated_by' => $request->updated_by,
                    'updated_at' => now(),
                    'is_deducted' => 1,
                ]
            );

            $emiSchedule = [];

            if ($requestedStatus === 'approved') {
                LoanEmi::where('application_no', $application->application_no)->delete();

                $principal = (float) $sanctionedAmount;
                $annualInterestRate = (float) ($application->interest_rate ?? 0);
                $monthlyRate = $annualInterestRate / 12 / 100;
                $numberOfMonths = (int) $tenureMonths;

                if ($numberOfMonths <= 0) {
                    throw new \Exception('Invalid EMI tenure months');
                }

                if ($monthlyRate > 0) {
                    $emiAmount = ($principal * $monthlyRate * pow(1 + $monthlyRate, $numberOfMonths))
                        / (pow(1 + $monthlyRate, $numberOfMonths) - 1);
                } else {
                    $emiAmount = $principal / $numberOfMonths;
                }

                $emiAmount = round($emiAmount, 2);
                $outstandingBalance = round($principal, 2);

                for ($i = 1; $i <= $numberOfMonths; $i++) {
                    $emiDate = $startDate->copy()->addMonths($i);

                    $interestAmount = $monthlyRate > 0
                        ? round($outstandingBalance * $monthlyRate, 2)
                        : 0;

                    $principalAmount = round($emiAmount - $interestAmount, 2);

                    if ($i === $numberOfMonths) {
                        $principalAmount = round($outstandingBalance, 2);
                        $emiAmount = round($principalAmount + $interestAmount, 2);
                    }

                    $outstandingBalance = round($outstandingBalance - $principalAmount, 2);

                    if ($outstandingBalance < 0) {
                        $outstandingBalance = 0;
                    }

                    $emiSchedule[] = [
                        'emi date' => $emiDate->format('d-m-Y'),
                        'emi amount' => $emiAmount,
                        'principal amount' => $principalAmount,
                        'interest amount' => $interestAmount,
                        'outstanding balance' => $outstandingBalance,
                        'status' => 'pending',
                    ];
                }

                LoanEmi::create([
                    'application_no' => $application->application_no,
                    'member_id' => $application->member_id,
                    'member_name' => $application->member_name,
                    'loan_amount' => $sanctionedAmount,
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate ? $endDate->format('Y-m-d') : null,
                    'emi_schedule' => $emiSchedule,
                    'created_by' => $request->updated_by,
                    'created_at' => now(),
                ]);
            }

            $application = LoanApplication::find($application_id);

            $isApplicationApproved = strtolower(trim((string) $application->application_status)) === 'approved';
            $isAdminApproved = strtolower(trim((string) $application->admin_approval_status)) === 'approved';
            $isSanchalakApproved = strtolower(trim((string) $application->sanchalak_approvals_status)) === 'approved';
            $isGuarantor1Approved = strtolower(trim((string) $application->guarantor_1_status)) === 'approved';
            $isGuarantor2Approved = strtolower(trim((string) $application->guarantor_2_status)) === 'approved';

            if (
                $isApplicationApproved &&
                $isAdminApproved &&
                $isSanchalakApproved &&
                $isGuarantor1Approved &&
                $isGuarantor2Approved
            ) {
                $loanDeduction = LoanApplicationDeduction::where('application_no', $application->application_no)->first();

                if ($loanDeduction) {
                    $trialDate = Carbon::now();
                    $trialMonth = (int) $trialDate->format('n');
                    $trialYear = (int) $trialDate->format('Y');

                    if ($trialMonth >= 4) {
                        $financialYearStart = $trialYear;
                        $financialYearEnd = $trialYear + 1;
                    } else {
                        $financialYearStart = $trialYear - 1;
                        $financialYearEnd = $trialYear;
                    }

                    $financialYear = $financialYearStart . '-' . substr((string) $financialYearEnd, -2);

                    $trialBalance = TrialBalance::where('financial_year', $financialYear)->first();

                    if (!$trialBalance) {
                        throw new \Exception('Trial balance record not found for financial year ' . $financialYear);
                    }

                    $creditJson = $trialBalance->credit_json;

                    if (is_string($creditJson)) {
                        $decodedCreditJson = json_decode($creditJson, true);
                        $creditJson = is_array($decodedCreditJson) ? $decodedCreditJson : [];
                    } elseif (!is_array($creditJson)) {
                        $creditJson = [];
                    }

                    $existingIds = [];
                    foreach ($creditJson as $creditItem) {
                        if (is_array($creditItem) && isset($creditItem['id']) && is_numeric($creditItem['id'])) {
                            $existingIds[] = (int) $creditItem['id'];
                        }
                    }

                    $nextId = !empty($existingIds) ? max($existingIds) + 1 : 1;

                    $existingEntries = [];
                    foreach ($creditJson as $creditItem) {
                        if (!is_array($creditItem)) {
                            continue;
                        }

                        $existingApplicationNo = trim((string) ($creditItem['application_no'] ?? ''));
                        $existingTitle = strtolower(trim((string) ($creditItem['title'] ?? '')));

                        if ($existingApplicationNo === trim((string) $application->application_no) && $existingTitle !== '') {
                            $existingEntries[$existingTitle] = true;
                        }
                    }

                    $loanFormFee = (float) ($loanDeduction->loan_form_fee ?? 0);
                    $kayamAmount = (float) ($loanDeduction->kayam_thev_amount ?? 0);
                    $processingAmount = (float) ($loanDeduction->loan_processing_fee ?? 0);

                    if ($loanFormFee > 0 && !isset($existingEntries['form fee amount'])) {
                        $creditJson[] = [
                            'id' => $nextId++,
                            'title' => 'Form fee amount',
                            'application_no' => (string) $application->application_no,
                            'date' => $trialDate->format('d-m-Y'),
                            'amount' => $loanFormFee,
                            'mode' => 'online',
                            'created_by' => (string) $request->updated_by,
                        ];
                    }

                    if ($kayamAmount > 0 && !isset($existingEntries['kayam amount'])) {
                        $creditJson[] = [
                            'id' => $nextId++,
                            'title' => 'Kayam amount',
                            'application_no' => (string) $application->application_no,
                            'date' => $trialDate->format('d-m-Y'),
                            'amount' => $kayamAmount,
                            'mode' => 'online',
                            'created_by' => (string) $request->updated_by,
                        ];
                    }

                    if ($processingAmount > 0 && !isset($existingEntries['processing amount'])) {
                        $creditJson[] = [
                            'id' => $nextId++,
                            'title' => 'Processing amount',
                            'application_no' => (string) $application->application_no,
                            'date' => $trialDate->format('d-m-Y'),
                            'amount' => $processingAmount,
                            'mode' => 'online',
                            'created_by' => (string) $request->updated_by,
                        ];
                    }

                    $trialBalance->update([
                        'credit_json' => $creditJson,
                        'updated_by' => $request->updated_by,
                        'updated_at' => now(),
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Loan application processed successfully',
                'data' => [
                    'id' => $application->id,
                    'application_no' => $application->application_no,
                    'application_status' => $application->application_status,
                    'admin_approval_status' => $application->admin_approval_status,
                    'sanctioned_amount' => $sanctionedAmount,
                    'start_date' => $application->start_date,
                    'end_date' => $application->end_date,
                    'total_deductions' => $totalDeductions,
                    'net_disbursement_amount' => $netDisbursementAmount,
                    'emi_schedule' => $emiSchedule,
                ],
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Something went wrong while approving loan application',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getLoanEmiSchedules(Request $request)
    {
        try {
            $search = trim((string) $request->query('search', ''));
            $perPage = (int) $request->query('per_page', 10);

            $query = LoanEmi::query();

            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('member_name', 'LIKE', "%{$search}%")
                        ->orWhere('application_no', 'LIKE', "%{$search}%")
                        ->orWhere('member_id', 'LIKE', "%{$search}%");
                });
            }

            $loanEmis = $query
                ->orderByDesc('id')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Loan EMI schedules fetched successfully',
                'data' => $loanEmis,
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Something went wrong while fetching EMI schedules',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getLoanEmiSummary(Request $request)
    {
        $loanEmis = LoanEmi::orderBy('id', 'desc')->get();

        if ($loanEmis->isEmpty()) {
            return ApiResponse::success('No loan EMI records found', []);
        }

        $today = Carbon::today();

        $formattedData = $loanEmis->map(function ($loanEmi) use ($today) {
            $emiSchedule = $loanEmi->emi_schedule;

            if (is_string($emiSchedule)) {
                $emiSchedule = json_decode($emiSchedule, true);
            }

            if (!is_array($emiSchedule)) {
                $emiSchedule = [];
            }

            $overdueEmi = null;

            $normalizedSchedule = collect($emiSchedule)
                ->map(function ($emi) {
                    $emiDateRaw = $emi['emi date'] ?? null;

                    if (!$emiDateRaw) {
                        return null;
                    }

                    try {
                        $emiDate = Carbon::parse($emiDateRaw)->startOfDay();
                    } catch (\Exception $e) {
                        return null;
                    }

                    return [
                        'emi_date' => $emiDate,
                        'emi_amount' => $emi['emi amount'] ?? null,
                        'status' => strtolower(trim($emi['status'] ?? 'pending')),
                        'original_status' => $emi['status'] ?? 'pending',
                    ];
                })
                ->filter()
                ->sortBy(fn($emi) => $emi['emi_date']->timestamp)
                ->values();

            foreach ($normalizedSchedule as $emi) {
                $emiDate = $emi['emi_date'];
                $emiStatus = $emi['status'];

                // only unpaid EMI check
                if (!in_array($emiStatus, ['pending', 'overdue', 'partial'])) {
                    continue;
                }

                // only past EMI should become overdue
                // today chi EMI overdue nahi
                if ($emiDate->lt($today)) {
                    $overdueEmi = [
                        'emi_date' => $emiDate->format('Y-m-d'),
                        'emi_amount' => $emi['emi_amount'],
                        'original_status' => $emi['original_status'],
                        'calculated_status' => 'overdue',
                        'display_status' => 'Overdue',
                        'overdue_since_date' => $emiDate->format('Y-m-d'),
                        'overdue_days' => $emiDate->diffInDays($today),
                    ];
                    break;
                }
            }

            return [
                'id' => $loanEmi->id,
                'application_no' => $loanEmi->application_no,
                'member_id' => $loanEmi->member_id,
                'member_name' => $loanEmi->member_name,
                'loan_amount' => $loanEmi->loan_amount,
                'start_date' => $loanEmi->start_date,
                'end_date' => $loanEmi->end_date,
                'next_emi' => $overdueEmi,
                'status' => $overdueEmi ? 'overdue' : 'completed',
                'loan_details' => [
                    'application_no' => $loanEmi->application_no,
                    'member_name' => $loanEmi->member_name,
                    'loan_amount' => $loanEmi->loan_amount,
                    'start_date' => $loanEmi->start_date,
                    'end_date' => $loanEmi->end_date,
                ],
            ];
        })
            ->filter(function ($loan) {
                return !is_null($loan['next_emi']);
            })
            ->values();

        return ApiResponse::success(
            'Loan EMI overdue summary fetched successfully',
            $formattedData
        );
    }

    public function getRecoveryNotices()
    {
        try {
            $notices = LoanEmiOverduesNotice::orderBy('id', 'desc')->get();

            if ($notices->isEmpty()) {
                return ApiResponse::success('No recovery notices found', []);
            }

            return ApiResponse::success(
                'Recovery notices fetched successfully',
                $notices
            );
        } catch (\Exception $e) {
            return ApiResponse::error(
                'Failed to fetch recovery notices',
                ['error' => $e->getMessage()],
                500
            );
        }
    }



    // Loan recovry mail send

    public function sendRecoveryNotice(Request $request, $application_no)
    {
        $validated = Validator::make($request->all(), [
            'member_id' => 'required|string',
            'member_name' => 'required|string',
            'emi_date' => 'required|date',
            'emi_amount' => 'required|numeric',
        ]);

        if ($validated->fails()) {
            return ApiResponse::error(
                'Validation failed',
                $validated->errors(),
                422
            );
        }

        try {
            $member = Member::where('member_id', $request->member_id)->first();

            if (!$member) {
                return ApiResponse::error(
                    'Member not found',
                    [],
                    404
                );
            }

            $memberEmail = $member->email ?? $member->member_email ?? null;

            if (empty($memberEmail)) {
                return ApiResponse::error(
                    'Member email not found',
                    [],
                    422
                );
            }

            $notice = LoanEmiOverduesNotice::where('application_no', $application_no)
                ->whereDate('emi_date', $request->emi_date)
                ->latest('id')
                ->first();

            if (!$notice) {
                $notice = LoanEmiOverduesNotice::create([
                    'application_no' => $application_no,
                    'member_id' => $request->member_id,
                    'member_name' => $request->member_name,
                    'member_email' => $memberEmail,
                    'emi_date' => $request->emi_date,
                    'emi_amount' => $request->emi_amount,
                    'is_mail_send' => 0,
                    'send_by' => null,
                    'send_at' => null,
                ]);
            } else {
                $notice->update([
                    'member_id' => $request->member_id,
                    'member_name' => $request->member_name,
                    'member_email' => $memberEmail,
                    'emi_date' => $request->emi_date,
                    'emi_amount' => $request->emi_amount,
                ]);
            }

            Mail::to($memberEmail)->send(new RecoveryNoticeMail($notice));

            $notice->update([
                'is_mail_send' => 1,
                'send_by' => auth()->user()?->full_name ?? 'System',
                'send_at' => now(),
            ]);

            return ApiResponse::success(
                'Recovery notice email sent successfully',
                $notice
            );
        } catch (\Exception $e) {
            return ApiResponse::error(
                'Failed to send email',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
