export type EMISchedules = {
    'emi date': string
    'emi amount': number
    'principal amount': number
    'interest amount': number
    'outstanding balance': number
    status: string
}[]

export type LoanEmi = {
    id: number
    application_no: string
    member_id: string
    member_name: string
    loan_amount: number | string | null
    start_date: string | null
    end_date: string | null
    emi_schedule: EMISchedules
    created_by: string | null
    created_at: string | null
}

export type GetLoanEmiSchedulesResponse = {
    success: boolean
    message: string
    data: {
        data: LoanEmi[]
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
}
