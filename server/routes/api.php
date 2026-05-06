<?php

use App\Http\Controllers\DepositWithdrawalController;
use App\Http\Controllers\DashboardOverviewController;
use App\Http\Controllers\AgmEgmNoticeController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DataEntryController;
use App\Http\Controllers\DepositeController;
use App\Http\Controllers\DividantController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\MemberInvestmentPortfolioController;
use App\Http\Controllers\NoticeController;
use App\Http\Controllers\PaymentsHistoryController;
use App\Http\Controllers\TrialBalanceController;
use App\Http\Controllers\HelpController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\DownloadController;
use App\Http\Controllers\MinutesOfMeetingController;
use App\Http\Controllers\SanchalakController;
use App\Http\Controllers\ReserveFundController;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;

Route::post('v1/admin/register', [AuthController::class, 'registerAdmin']);
Route::post('v1/admin/login', [AuthController::class, 'adminLogin']);
Route::post('v1/sanchalaka/login', [AuthController::class, 'sanchalakaLogin']);
Route::post('v1/auth/refresh', [AuthController::class, 'refresh']);

Route::middleware([AuthMiddleware::class])->group(function () {
    Route::get('v1/dashboard/overview', [DashboardOverviewController::class, 'index']);

    Route::get('v1/member-investment-portfolio', [MemberInvestmentPortfolioController::class, 'getInvestments']);
    Route::get('v1/members', [MemberController::class, 'getMembers']);
    Route::get('v1/me', [AuthController::class, 'me']);
    Route::post('v1/logout', [AuthController::class, 'logout']);
    Route::get('v1/admin/dashboard', [AuthController::class, 'dashboard']);

    Route::post('v1/create-member', [MemberController::class, 'createMembers']);
    Route::patch('v1/update-member-status/{member_id}', [MemberController::class, 'updateStatus']);

    Route::get('v1/get-deposite-schemes', [DepositeController::class, 'getDepostiteSchemes']);
    Route::post('v1/add-deposite-scheme', [DepositeController::class, 'addDepositeScheme']);
    Route::post('v1/update-deposite-scheme/{id}', [DepositeController::class, 'updateDepositeScheme']);
    Route::post('v1/delete-deposite-scheme/{id}', [DepositeController::class, 'deleteDepositeScheme']);

    Route::get('v1/get-deposite-applications', [DepositeController::class, 'getDepositeApplications']);
    Route::patch('v1/deposite/update-application-status/{application_id}', [DepositeController::class, 'updateDepositeApplicationStatus']);
    Route::patch('v1/deposite/application-start-date/{application_id}', [DepositeController::class, 'updateApplicationStartDate']);

    Route::get('v1/deposite/get-renewals-application', [DepositeController::class, 'getDepositRenewalsApplications']);
    Route::get('v1/get-deposit-installments/{oldApplicationId}', [DepositeController::class, 'getDepositeApplicationsInstallmets']);
    Route::post('v1/approve-deposit-renewal', [DepositeController::class, 'approveDepositRenewal']);

    Route::get('v1/withdrawal-requests', [DepositWithdrawalController::class, 'getWithdrawalRequests']);
    Route::patch('v1/withdrawal-requests/{id}/approve', [DepositWithdrawalController::class, 'approveWithdrawalRequest']);
    Route::patch('v1/withdrawal-requests/{id}/reject', [DepositWithdrawalController::class, 'rejectWithdrawalRequest']);

    Route::get('v1/get-loan-schemes', [LoanController::class, 'getLoanSchemes']);
    Route::post('v1/add-loan-schemes', [LoanController::class, 'addLoanSchemes']);
    Route::put('v1/update-loan-schemes/{scheme_id}', [LoanController::class, 'updateLoanSchemes']);
    Route::post('v1/delete-loan-schemes/{scheme_id}', [LoanController::class, 'deleteLoanSchemes']);

    Route::get('v1/get-loan-applications', [LoanController::class, 'getLoanApplications']);
    Route::patch('v1/loan/approve-application/{application_id}', [LoanController::class, 'approveLoanApplication']);

    Route::get('v1/loan/emi-schedules', [LoanController::class, 'getLoanEmiSchedules']);
    Route::get('v1/loan/emi-summary', [LoanController::class, 'getLoanEmiSummary']);
    Route::get('v1/loan/recovery-notices', [LoanController::class, 'getRecoveryNotices']);

    Route::post('v1/loan/send-recovery-notice/{id}', [LoanController::class, 'sendRecoveryNotice']);

    Route::get('v1/payment-history', [PaymentsHistoryController::class, 'getPaymentHistory']);
    Route::patch('v1/payment-history/approve/{accountManagementId}', [PaymentsHistoryController::class, 'approvePayment']);

    Route::get('v1/data-entry', [DataEntryController::class, 'getDataEntry']);
    Route::post('v1/add-data-entry', [DataEntryController::class, 'addDataEntry']);
    Route::patch('v1/update-data-entry/{id}', [DataEntryController::class, 'updateDataEntry']);

    Route::get('v1/get-trial-balance', [TrialBalanceController::class, 'getTrialBalance']);

    Route::get('v1/divident/member-share-capital', [DividantController::class, 'getAllMemberShareCapital']);
    Route::get('v1/divident', [DividantController::class, 'getAllDividants']);
    Route::post('v1/divident/create', [DividantController::class, 'createDividantDeclaration']);

    Route::get('v1/gallery/get-data', [GalleryController::class, 'getData']);
    Route::post('v1/gallery/add-folder', [GalleryController::class, 'addFolder']);
    Route::post('v1/gallery/folder/{folderId}/add-file', [GalleryController::class, 'addFile']);
    Route::patch('v1/gallery/folder/{folderId}/update-folder', [GalleryController::class, 'updateFolder']);
    Route::post('v1/gallery/folder/{folderId}/file/{fileIndex}/update-file', [GalleryController::class, 'updateFile']);
    Route::delete('v1/gallery/folder/{folderId}/delete-folder', [GalleryController::class, 'deleteFolder']);
    Route::delete('v1/gallery/folder/{folderId}/file/{fileIndex}/delete-file', [GalleryController::class, 'deleteFile']);

    Route::get('v1/notices', [NoticeController::class, 'getNotices']);
    Route::post('v1/notices', [NoticeController::class, 'createNotice']);
    Route::put('v1/notices/{id}', [NoticeController::class, 'updateNotice']);
    Route::delete('v1/notices/{id}', [NoticeController::class, 'deleteNotice']);

    Route::get('v1/agm-egm-notices', [AgmEgmNoticeController::class, 'index']);
    Route::get('v1/agm-egm-notices/{id}', [AgmEgmNoticeController::class, 'show']);
    Route::post('v1/agm-egm-notices', [AgmEgmNoticeController::class, 'store']);
    Route::post('v1/agm-egm-notices/{id}', [AgmEgmNoticeController::class, 'update']);
    Route::patch('v1/agm-egm-notices/{id}/publish', [AgmEgmNoticeController::class, 'publish']);
    Route::delete('v1/agm-egm-notices/{id}', [AgmEgmNoticeController::class, 'destroy']);

    Route::get('v1/complaints', [ComplaintController::class, 'getComplaints']);
    Route::get('v1/complaints/{id}', [ComplaintController::class, 'show']);
    Route::patch('v1/complaints/{id}/reply', [ComplaintController::class, 'reply']);
    Route::delete('v1/complaints/{id}', [ComplaintController::class, 'destroy']);

    Route::get('v1/mom/get', [MinutesOfMeetingController::class, 'getAllMom']);
    Route::post('v1/mom/add', [MinutesOfMeetingController::class, 'addMom']);
    Route::post('v1/mom/update/{id}', [MinutesOfMeetingController::class, 'updateMom']);
    Route::delete('v1/mom/delete/{id}', [MinutesOfMeetingController::class, 'deleteMom']);
    Route::patch('v1/mom/publish/{id}', [MinutesOfMeetingController::class, 'publishMom']);

    Route::get('v1/help/getAll', [HelpController::class, 'getAll']);
    Route::get('v1/help/{id}', [HelpController::class, 'getById'])->whereNumber('id');
    Route::post('v1/help/{id}/reply', [HelpController::class, 'reply'])->whereNumber('id');

    Route::get('v1/downloads/get-downloads', [DownloadController::class, 'getAllDownloads']);
    Route::post('v1/downloads/add-downloads', [DownloadController::class, 'addDownload']);
    Route::post('v1/downloads/update/{id}', [DownloadController::class, 'updateDownload']);
    Route::delete('v1/downloads/delete/{id}', [DownloadController::class, 'deleteDownload']);
    

    // Sanchalaks

    Route::prefix('v1')->group(function () {
        Route::post('/sanchalaks', [SanchalakController::class, 'createSanchalak']);
        Route::get('/sanchalaks', [SanchalakController::class, 'getSanchalaks']);
        Route::get('/sanchalaks/{id}', [SanchalakController::class, 'getSanchalakById']);
        Route::post('/sanchalaks/{id}', [SanchalakController::class, 'updateSanchalak']);
        Route::delete('/sanchalaks/{id}', [SanchalakController::class, 'deleteSanchalak']);
   });

Route::prefix('/v1/reserve-funds')->group(function () {
    Route::get('/', [ReserveFundController::class, 'index']);
    Route::post('/', [ReserveFundController::class, 'store']);
    Route::get('/summary', [ReserveFundController::class, 'summary']);
    Route::get('/{id}', [ReserveFundController::class, 'show']);
    Route::put('/{id}', [ReserveFundController::class, 'update']);
    Route::patch('/{id}', [ReserveFundController::class, 'update']);
    Route::delete('/{id}', [ReserveFundController::class, 'destroy']);
    Route::patch('/{id}/restore', [ReserveFundController::class, 'restore']);
    Route::delete('/{id}/force-delete', [ReserveFundController::class, 'forceDelete']);
});

});