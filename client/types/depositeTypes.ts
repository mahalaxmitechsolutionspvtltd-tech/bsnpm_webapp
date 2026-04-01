export interface DepositScheme {
    id: number
    scheme_name: string
    scheme_details: string | null
    interest_rate: string | null
    term_notes: string | null
    investment_terms: string | null
    created_by: string | null
    created_at: string | null
    updated_by: string | null
    updated_at: string | null
    is_deleted: 0 | 1
    deleted_by: string | null
}

export interface CreateDepositSchemePayload {
    scheme_name: string
    scheme_details?: string | null
    interest_rate?: number | string | null
    term_notes?: string | null
    investment_terms?: string | null
    created_by?: string | null
}

export interface UpdateDepositSchemePayload {
    scheme_name?: string
    scheme_details?: string | null
    interest_rate?: number | string | null
    term_notes?: string | null
    investment_terms?: string | null
    updated_by?: string | null
}

export interface DepositSchemeApiResponse {
    success?: boolean
    message?: string
    data?: DepositScheme[]
}

export type DepositApplicationStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "active"
    | "inprogress"
    | "completed"
    | "closed"
    | "withdrawn"

export interface DepositApplicationLinkedJson {
    application_no?: string | null
    payment_mode?: string | null
    reference_trn?: string | null
    remark?: string | null
    proof_file?: string | null
    proofFile?: string | null
    date_of_payment?: string | null
    total_amount?: string | number | null
    status?: string | null
    created_at?: string | null
}

export interface DepositAccountManagementItem {
    id: number
    member_id: string | number | null
    member_name: string | null
    application_no?: string | null
    payment_mode?: string | null
    reference_trn?: string | null
    remark?: string | null
    proof_file?: string | null
    proofFile?: string | null
    file?: string | null
    proof?: string | null
    file_path?: string | null
    document?: string | null
    date_of_payment?: string | null
    payment_date?: string | null
    total_amount?: string | number | null
    amount?: string | number | null
    status?: string | null
    created_at?: string | null
    submitted_at?: string | null
    applications_json?: DepositApplicationLinkedJson | null
    matched_application_json?: DepositApplicationLinkedJson | null
    application_json?: DepositApplicationLinkedJson | null
}

export interface DepositPaymentDetails {
    id?: number | null
    payment_mode?: string | null
    proof_file?: string | null
    reference_trn?: string | null
    total_amount?: string | number | null
    date_of_payment?: string | null
    remark?: string | null
    status?: string | null
    created_by?: string | null
    created_at?: string | null
}

export interface DepositMatchedApplicationJson {
    title?: string | null
    date?: string | null
    amount?: string | number | null
    "application no"?: string | null
    "member name"?: string | null
}

export interface DepositApplication {
    id: number
    application_no: string
    application_type?: string | null
    member_id: string | number
    member_name: string
    member_email: string | null
    scheme_id: number | null
    scheme_name: string
    interest_rate: string | null
    tenure_years: number | null
    deposit_amount: string | null
    start_date: string | Date | null
    end_date: string | Date | null
    status: string | null
    is_active: boolean | number
    is_withdrawal: boolean | number
    is_renewed?: boolean | number
    created_by: string | null
    created_at: string | null
    updated_by: string | null
    updated_at: string | null

    // New backend structure
    payment_details?: DepositPaymentDetails | null
    matched_application_json?: DepositMatchedApplicationJson | null

    // Old fallback structure
    account_management?: DepositAccountManagementItem[] | DepositAccountManagementItem | null
}

export interface CreateDepositApplicationPayload {
    application_no?: string
    member_id: string | number
    member_name: string
    member_email?: string | null
    scheme_id?: number | null
    scheme_name: string
    interest_rate?: number | string | null
    tenure_years?: number | null
    deposit_amount?: number | string | null
    start_date?: string | null
    end_date?: string | null
    status?: DepositApplicationStatus | string | null
    is_active?: boolean | number
    is_withdrawal?: boolean | number
    created_by?: string | null
    updated_by?: string | null
}

export interface UpdateDepositApplicationPayload {
    application_no?: string
    member_id?: string | number
    member_name?: string
    member_email?: string | null
    scheme_id?: number | null
    scheme_name?: string
    interest_rate?: number | string | null
    tenure_years?: number | null
    deposit_amount?: number | string | null
    start_date?: string | null
    end_date?: string | null
    status?: DepositApplicationStatus | string | null
    is_active?: boolean | number
    is_withdrawal?: boolean | number
    created_by?: string | null
    updated_by?: string | null
}

export interface DepositApplicationApiResponse {
    success: boolean
    message?: string
    data: DepositApplication | DepositApplication[]
}

export interface DepositApplicationListResponse {
    success: boolean
    message?: string
    data: DepositApplication[]
}

export interface UpdateDepositApplicationStartDatePayload {
    start_date: Date
    end_date: Date
    updated_by?: string
}

export type RenewalApplicationStatus = "PENDING" | "APPROVED" | "REJECTED"
export type RenewalAmountChangeType = "same" | "increase"

export type DepositInstallmentJsonItem = {
    date: string
    amount: string | number
    status: string
    updated_by: string | null
}

export interface DepositRenewalApplication {
    id: number
    renewal_application_no: string
    deposit_application_id: number
    old_application_no: string
    member_id: string
    member_name: string
    scheme_id: number | null
    scheme_name: string
    current_deposit_amount: string | number
    current_tenure_years: string
    requested_deposit_amount: string | number
    requested_tenure_years: string
    tenure_extension_years: string
    amount_change_type: RenewalAmountChangeType
    amount_multiple: string | number
    scheme_details: string | null
    investment_terms: string | null
    term_notes: string | null
    status: RenewalApplicationStatus
    remark: string | null
    updated_by: string | null
    is_active: boolean | number
    is_deleted: boolean | number
    created_at: string
    updated_at: string
    installment_json: DepositInstallmentJsonItem[]
}

export type ApproveDepositRenewalPayload = {
    renewal_application_no: string
    old_application_no: string
    member_id: string
    status: "PENDING" | "REJECTED" | "APPROVED"
}