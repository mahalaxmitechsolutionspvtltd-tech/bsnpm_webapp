export type PaymentStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "paid"
    | "unpaid"
    | "partial"
    | "overdue"
    | "completed"
    | "cancelled"
    | "failed"
    | "processing"
    | string

export type PaymentSourceType =
    | "deposit"
    | "loan"
    | "share"
    | "joining_fee"
    | "withdrawal"
    | "renewal"
    | "penalty"
    | "fine"
    | "emi"
    | "rd"
    | "fd"
    | "scheme"
    | "other"
    | string

export interface ApplicationDetails {
    amount: number
    application_no: string | null
    member_name: string;
    tenure: string | null
    title: string
}

export interface PaymentHistoryTableItem {
    id: number | string
    submitted_on: string | null
    submitted_time?: string | null
    member_id: string | null
    payment_mode: string | null
    member_name: string | null
    amount: number | string | null
    status: PaymentStatus | null
    reference_trn: string | null
    application_no: string | null
    source_type: PaymentSourceType | null
    application_details: ApplicationDetails | null
    created_at: string

}

export interface PaymentHistoryDialogItem {
    id: number | string
    member_id: string | null
    member_name: string | null
    total_amount: number | string | null
    status: PaymentStatus | null
    date_paid: string | null

    scheme_name: string | null
    application_no: string | null
    amount: number | string | null
    due_or_emi_range: string | null
    payment_mode: string | null

    remark: string | null
    reference_trn: string | null
    submitted_at: string | null

    proof_file_url: string | null
    proof_file_name: string | null
    proof_file_type: string | null

    source_type: PaymentSourceType | null
    raw?: Record<string, unknown> | null
}

export interface PaymentHistoryListResponse {
    success: boolean
    message: string
    data: PaymentHistoryTableItem[]
}

export interface PaymentHistoryDetailsResponse {
    success: boolean
    message: string
    data: PaymentHistoryDialogItem
}