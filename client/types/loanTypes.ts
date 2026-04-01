
export type LoanTypes = {
    id: number | string
    scheme_name: string | null
    loan_details: string | null
    interest_rate: string | null
    loan_max_amount: string | null
    created_at: Date | string
    created_by: string | null
    updated_at: Date | string
    updated_by: string | null
    is_deleted: Boolean | string
    deleted_by: string | null
}
export type ApiResponse = {
    success: boolean
    message: string
    data: LoanTypes[]
}

export type AddLoanSchemeFormValues = {
    scheme_name: string
    interest_rate: string
    loan_details: string
    created_by: string
}



export type ApproveLoanDeductionItem = {
    type: string
    calculation: string
    amount: number
}

export type ApproveLoanApplicationPayload = {
    application_status: 'pending' | 'approved' | 'rejected'
    start_date?: string | null
    sanctioned_amount?: number
    updated_by: string
    deductions?: ApproveLoanDeductionItem[]
}

export type ApproveLoanApplicationResponse = {
    success: boolean
    message: string
    data?: {
        id: number
        application_no: string
        application_status: string
        admin_approval_status: string
        sanctioned_amount: number | string
        start_date: string | null
        end_date: string | null
        deduction_details: ApproveLoanDeductionItem[]
        total_deductions: number
        net_disbursement_amount: number
        updated_by: string
        emi_schedule: Array<{
            'emi date': string
            'emi amount': number
            'principal amount': number
            'interest amount': number
            'outstanding balance': number
            status: string
        }>
    }
} 


