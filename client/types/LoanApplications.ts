export type LoanApplicationStatus =
    | 'pending'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'disbursed'
    | 'closed'

export type GuarantorStatus = 'pending' | 'approved' | 'rejected'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type LoanApplicationNo = `${string}-LN-${string}`

export type LoanApplication = {
    id: number
    application_no: LoanApplicationNo
    application_status: LoanApplicationStatus

    member_id: string
    member_name: string
    member_email: string | null

    scheme_id: number | null
    scheme_name: string

    interest_rate: string | null
    loan_amount: string | null
    tenure_months: number | null
    tenure_years: number | null

    dependents: number | null
    loan_purpose: string | null

    monthly_income_amount: string | null
    annual_family_income: string | null

    source: string | null
    source_details: string | null
    exiting_loans: string | null

    guarantor_1_id: string | null
    guarantor_1_name: string | null
    guarantor_1_status: GuarantorStatus | null
    guarantor_1_reason: string | null
    updated_by_guarantor_1: string | null

    guarantor_2_id: string | null
    guarantor_2_name: string | null
    guarantor_2_status: GuarantorStatus | null
    guarantor_2_reason: string | null
    updated_by_guarantor_2: string | null

    bank_name_and_branch: string | null
    bank_account_number: string | null
    ifsc_code: string | null
    adhaar_number: string | null

    i_agree: boolean | number
    start_date: string | null
    end_date: string | null
    is_active: boolean | number

    sanctioned_amount: string | null
    is_loan_adjusted: boolean | number
    adjustment_remark: string | null

    admin_approval_status: ApprovalStatus | null
    admin_approved_by: string | null
    admin_approved_at: string | null

    sanchalak_response: string | null
    sanchalak_approvals_status: ApprovalStatus | null

    created_by: string | null
    created_at: string | null
}

export type GetLoanApplicationsResponse = {
    success: boolean
    message: string
    data: LoanApplication[]
}

export type GetLoanApplicationResponse = {
    success: boolean
    message: string
    data: LoanApplication | null
}

export type UpdateLoanApplicationPayload = Partial<{
    application_status: LoanApplicationStatus

    scheme_id: number | null
    scheme_name: string

    interest_rate: string | number | null
    loan_amount: string | number | null
    tenure_months: number | null
    tenure_years: number | null

    dependents: number | null
    loan_purpose: string | null

    monthly_income_amount: string | number | null
    annual_family_income: string | number | null

    source: string | null
    source_details: string | null
    exiting_loans: string | null

    guarantor_1_id: string | null
    guarantor_1_name: string | null
    guarantor_1_status: GuarantorStatus
    guarantor_1_reason: string | null
    updated_by_guarantor_1: string | null

    guarantor_2_id: string | null
    guarantor_2_name: string | null
    guarantor_2_status: GuarantorStatus
    guarantor_2_reason: string | null
    updated_by_guarantor_2: string | null

    bank_name_and_branch: string | null
    bank_account_number: string | null
    ifsc_code: string | null
    adhaar_number: string | null

    start_date: string | null
    end_date: string | null
    is_active: boolean | number

    sanctioned_amount: string | number | null
    is_loan_adjusted: boolean | number
    adjustment_remark: string | null

    admin_approval_status: ApprovalStatus
    admin_approved_by: string | null
    admin_approved_at: string | null

    sanchalak_response: string | null
    sanchalak_approvals_status: ApprovalStatus
}>


