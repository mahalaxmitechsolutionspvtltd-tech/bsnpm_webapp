export type NextEmi = {
    emi_date: string
    emi_amount: number | string | null
    original_status: string
    calculated_status: string
    display_status: string
    overdue_since_date: string | null
    overdue_days: number
}

export type LoanEmiSummary = {
    id: number
    application_no: string
    member_id: string
    member_name: string
    member_email: string
    loan_amount: number | string | null
    start_date: string | null
    end_date: string | null
    next_emi: NextEmi | null
    status: string
    loan_details: {
        application_no: string
        member_name: string
        loan_amount: number | string | null
        start_date: string | null
        end_date: string | null
    }
}

export type LoanEmiOverduesNotice = {
    id: number
    application_no: string
    member_id: string
    member_name: string
    member_email: string | null
    emi_date: string
    emi_amount: number | string
    is_mail_send: boolean | number
    send_by: string | null
    send_at: string | null
}

export type GetRecoveryNoticesApiResponse = {
    success: boolean
    message: string
    data: LoanEmiOverduesNotice[]
}


export type LoanOverduesApiResponse = {
    success: boolean
    message: string
    data: LoanEmiSummary[]
}

export type SendRecoveryNoticePayload = {
    member_id: string
    member_name: string
    member_email: string
    emi_date: string
    emi_amount: number | string
}

export type SendRecoveryNoticeRequest = {
    applicationNo: string
    payload: SendRecoveryNoticePayload
}

export type SendRecoveryNoticeResponse = {
    success: boolean
    message: string
    data?: {
        id: number
        application_no: string
        member_id: string
        member_name: string
        member_email: string
        emi_date: string
        emi_amount: number | string
        is_mail_send: boolean | number
        send_by: string | null
        send_at: string | null
    }
}