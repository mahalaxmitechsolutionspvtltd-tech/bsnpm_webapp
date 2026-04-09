export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface DepositWithdrawalItem {
    id: number
    member_id: string
    member_name: string
    application_no: string
    scheme_name: string
    total_installments_paid: number
    total_amount_paid: string
    calculated_interest: string
    final_maturity_amount: string
    requested_amount: string
    status: WithdrawalStatus
    created_at: string
    updated_at: string | null
    updated_by: string | null
    is_deleted: boolean | number
}

export interface PaginationLink {
    url: string | null
    label: string
    active: boolean
}

export interface TablePaginationData<T> {
    current_page: number
    data: T[]
    first_page_url: string | null
    from: number | null
    last_page: number
    last_page_url: string | null
    links: PaginationLink[]
    next_page_url: string | null
    path: string
    per_page: number
    prev_page_url: string | null
    to: number | null
    total: number
}

export interface CommonTableApiResponse<T> {
    success: boolean
    message: string
    data: TablePaginationData<T>
}
export interface GetWithdrawalRequestsParams {
    search?: string
    status?: string
    page?: number
    per_page?: number
}

export interface UpdateWithdrawalRequestPayload {
    updated_by?: string
}

export interface CommonApiResponse<T = unknown> {
    success: boolean
    message: string
    data?: T
    errors?: Record<string, string[]>
    error?: string
}

export type DepositWithdrawalTableResponse = CommonTableApiResponse<DepositWithdrawalItem>