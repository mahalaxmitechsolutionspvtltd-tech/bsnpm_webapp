export type TrialBalanceEntryType =
    | 'opening_balance'
    | 'credit'
    | 'debit'
    | 'closing_balance'
    | 'cash_in_hand'
    | 'bank_balance'
    | 'total'

export interface TrialBalanceJsonItem {
    id?: number
    title: string
    application_no?: string
    date: string
    amount: number | string
    mode: string
    created_by: string
}

export interface TrialBalanceRow {
    title: string
    application_no?: string
    date?: string
    amount?: number
    mode?: string
    created_by?: string
    debit: number | null
    credit: number | null
    type: TrialBalanceEntryType
}

export interface TrialBalanceRawItem {
    id: number
    financial_year: string
    opening_balance: number | string | null
    cash_in_hand: number | string | null
    bank_balance: number | string | null
    closing_balance: number | string | null
    debit_json: TrialBalanceJsonItem[] | null
    credit_json: TrialBalanceJsonItem[] | null
    updated_by: string | null
    updated_at: string | null
    created_by: string | null
    created_at: string | null
}

export interface TrialBalanceData {
    financial_year: string
    opening_balance: number
    cash_in_hand: number
    bank_balance: number
    closing_balance: number
    debit_json: TrialBalanceJsonItem[]
    credit_json: TrialBalanceJsonItem[]
    debit_total: number
    credit_total: number
    difference: number
    rows: TrialBalanceRow[]
    raw: TrialBalanceRawItem[]
}

export interface TrialBalanceApiResponse {
    success: boolean
    message: string
    data: TrialBalanceData
}

export interface GetTrialBalanceParams {
    financial_year?: string
}