<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RecoveryNoticeMail extends Mailable
{
    use Queueable, SerializesModels;

    public $notice;

    public function __construct($notice)
    {
        $this->notice = $notice;
    }

    public function build()
    {
        return $this->subject('BSNPM Loan EMI Overdue Notice - ' . $this->notice->application_no)
            ->view('emails.recovery_notice');
    }
}