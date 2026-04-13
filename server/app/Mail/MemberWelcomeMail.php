<?php

namespace App\Mail;

use App\Models\Member;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class MemberWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public Member $member;
    public string $plainPassword;

    public function __construct(Member $member, string $plainPassword)
    {
        $this->member = $member;
        $this->plainPassword = $plainPassword;
    }

    public function build()
    {
        return $this->subject('Welcome to BSNPM Portal - Member Account Details')
            ->view('emails.member_welcome');
    }
}