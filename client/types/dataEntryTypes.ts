export type DataEntryType = 'INCOME' | 'EXPENSE' | string
export type DataEntryPaymentMode = 'cash' | 'online' | 'Cash' | 'Online' | string

export interface DataEntry {
    id: number
    voucher_no?: string | null
    entry_type: DataEntryType
    date: string | null
    category: string | null
    payment_mode: string | null
    amount: number | string | null
    reference: string | null
    description: string | null
    created_by: string | null
    created_at: string | null
    updated_by: string | null
    updated_at: string | null
    is_deleted: number | boolean
    deleted_by: string | null
}

export interface DataEntryFormData {
    voucher_no?: string | null
    entry_type: DataEntryType
    date?: string | null
    category?: string | null
    payment_mode?: DataEntryPaymentMode | null
    amount?: number | string | null
    reference?: string | null
    description?: string | null
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number | boolean
    deleted_by?: string | null
}

export interface DataEntryApiResponse {
    success: boolean
    message: string
    data: DataEntry | DataEntry[] | null
}