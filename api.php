<?php

use App\Http\Controllers\AgreementsController;
use App\Http\Controllers\AmcEntryController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\EstimatorController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PushController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\ShareController;
use App\Http\Controllers\StorageController;
use App\Http\Controllers\UserMenuAccessController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\WhatsAppMarketingController;
use App\Models\WhatsAppMarketing;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserAuthController;
use App\Http\Controllers\DealController;
use App\Http\Controllers\LeadsController;
use App\Http\Controllers\NetworkController;
use App\Http\Middleware\AuthenticateWithCookie;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Controllers\ServicesController;

Route::post("signup", [UserAuthController::class, "signUp"]);
Route::post("signin", [UserAuthController::class, "signIn"]);

// ✅ protected routes

Route::post('getnatureofbussiness', [LeadsController::class, 'getNatureOfBussiness']);
Route::post('addnatureofbusiness', [LeadsController::class, 'storeNatureOfBusiness']);


// Middleware for the admin
Route::middleware([AdminMiddleware::class])->group(function () {
    Route::put('update-user/{id}', [UserAuthController::class, 'updateUser']);
    Route::delete('delete-user/{id}', [UserAuthController::class, 'deleteUser']);

    Route::post('/user/set-menu-access', [UserMenuAccessController::class, 'setMenuAccess']);
    Route::get('/user/get-menu-access/{userId}', [UserMenuAccessController::class, 'getMenuAccess']);
});


// middleware for the other user only
Route::middleware([AuthenticateWithCookie::class])->group(function () {

    Route::get('/notifications/{userId}', [NotificationController::class, 'getNotifications']);
    Route::get('/notifications/unread-count/{id}', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all/{id}', [NotificationController::class, 'readAll']);


    Route::get('get-users', [UserAuthController::class, 'getUsers']);

    Route::get("user", [UserAuthController::class, "checkAuth"]);
    Route::post("logout", [UserAuthController::class, "logout"]);


    Route::post("addlead", [LeadsController::class, "addLead"]);
    Route::get("getleads", [LeadsController::class, "getAllLeads"]);
    Route::put("updatelead/{sr_no}", [LeadsController::class, "updateLead"]);
    Route::delete("deletelead/{sr_no}", [LeadsController::class, "deleteLead"]);

    Route::post("createdeal/{sr_no}", [LeadsController::class, "convetLeadIntoDeal"]);
    Route::get("getdeals", [DealController::class, "getDeals"]);
    Route::post("createdeal", [DealController::class, "addDeals"]);
    Route::post("repeatdeal", [DealController::class, "repeatDeal"]);
    Route::post("updatedeal/{dealId}", [DealController::class, "updateDeal"]);
    Route::delete("delete-deal/{dealId}", [DealController::class, "deleteDeal"]);

    Route::get("getnetworks", [NetworkController::class, "getNetworks"]);
    Route::post("addnetwork", [NetworkController::class, "addNetwork"]);
    Route::post("updatenetwork/{network_Id}", [NetworkController::class, "updateNetwork"]);

    // billings
    Route::get('get-all-billings', [BillingController::class, "getAllBilling"]);
    Route::put('update-billing/{id}', [BillingController::class, 'updateBilling']);
    Route::delete('delete-bill/{id}', [BillingController::class, 'deleteBill']);
    Route::post('create-billing', [BillingController::class, 'createBilling']);

    //storage
    Route::post('create-folder', [StorageController::class, "createFolder"]);
    Route::get('get-folders', [StorageController::class, "getFolders"]);
    Route::post('upload-file', [StorageController::class, "upload"]);
    Route::get('get-files/{id}', [StorageController::class, "getAllFiles"]);

    // 
    Route::post('update-folder', [StorageController::class, "UpdateFolder"]);
    Route::post('update-file', [StorageController::class, "UpdateFile"]);
    Route::post('delete-folder/{id}/{userName}', [StorageController::class, "deleteFolder"]);
    Route::post('delete-file/{id}/{userName}', [StorageController::class, "deleteFile"]);
    Route::get('get-folder/{id}', [StorageController::class, "getFolder"]);
    Route::put('update-folder/{id}', [StorageController::class, "updateFolder"]);
    Route::put('update-file/{id}', [StorageController::class, "updateFile"]);

    //file shareing 
    Route::post('/share-email', [ShareController::class, 'sendEmailWithAttachment']);


    //vendor
    Route::post('/vendors/add', [VendorController::class, 'AddVendor']);
    Route::get('/vendors', [VendorController::class, 'GetAllVendors']);
    Route::post('/vendors/update/{id}', [VendorController::class, 'UpdateVendor']);
    Route::post('/vendors/delete/{id}', [VendorController::class, 'deleteVendor']);

    //Announcement

    Route::post('announcement/create', [AnnouncementController::class, 'CreateAnnouncement']);
    Route::get('announcement/get', [AnnouncementController::class, 'GetAllAnnouncements']);
    Route::post('/announcement/update/{uid}', [AnnouncementController::class, 'UpdateAnnouncement']);
    Route::post('/announcement/publish/{uid}', [AnnouncementController::class, 'PublishAnnouncement']);
    Route::post('/announcement/delete/{uid}', [AnnouncementController::class, 'DeleteAnnouncement']);


    //agreements

    Route::post('agreements/create', [AgreementsController::class, 'CreateAgreement']);
    Route::get('agreements/get', [AgreementsController::class, 'GetAllAgreements']);
    Route::post('agreements/update/{uid}', [AgreementsController::class, 'UpdateAgreement']);
    Route::post('agreements/delete/{uid}', [AgreementsController::class, 'DeleteAgreement']);

    //serverce
    Route::get('/services/get', [ServicesController::class, 'getAllServices']);
    Route::post('/services/create', [ServicesController::class, 'create']);
    Route::post('/services/update', [ServicesController::class, 'update']);
    Route::post('/services/delete', [ServicesController::class, 'delete']);

    // whats app marketing 

    Route::get('/whatsapp-marketing/get', [WhatsAppMarketingController::class, 'getAllLeads']);
    Route::post('/whatsapp-marketing/create', [WhatsAppMarketingController::class, 'crateLead']);
    Route::put('/whatsapp-marketing/leads/{id}', [WhatsAppMarketingController::class, 'updateLead']);
    Route::delete('/whatsapp-marketin/leads/{id}', [WhatsAppMarketingController::class, 'deleteLead']);

    Route::post('/push/subscribe', [PushSubscriptionController::class, 'subscribe']);
    Route::post('/push/unsubscribe', [PushSubscriptionController::class, 'unsubscribe']);
    Route::post('/push/test', [PushController::class, 'test']);

    Route::get('/estimator/config', [EstimatorController::class, 'getEstimatorConfig']);
    Route::post('/estimator/submit', [EstimatorController::class, 'submitEstimator']);
    Route::put('/estimator/update-config', [EstimatorController::class, 'updateEstimatorConfig']);
    Route::get('/estimator/leads', [EstimatorController::class, 'getEstimatorLeads']);


    // // AMC MODULE 
    Route::get('v1/amc/amc-analytics', [AmcEntryController::class, 'dashboardAnalytics']);

    Route::post('v1/add-amc-entries', [AmcEntryController::class, 'addAmcEntry']);
    Route::get('v1/get-amc-entries', [AmcEntryController::class, 'getAmcEntries']);
    Route::get('v1/amc/users', [AmcEntryController::class, 'getUserDetails']);
    Route::get('v1/amc/clients', [AmcEntryController::class, 'getClientDetails']);

    Route::post('v1/update-amc-entries/{id}', [AmcEntryController::class, 'updateAmcEntry']);
    Route::delete('v1/delete-amc-entries/{id}', [AmcEntryController::class, 'deleteAmcEntry']);


    //Dashboard anyalitics

    Route::get('v1/advance-revenue-analytics', [BillingController::class, 'getAdvanceRevenueAnalytics']);

});