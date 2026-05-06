import { AxiosError } from "axios"
import { apiClient } from "@/lib/api-client"

export type ReserveFundStatus = "active" | "inactive" | "cancelled"

export type ReserveFundTransactionType = "credit" | "debit"

export type ReserveFundPaymentMode =
    | "cash"
    | "bank"
    | "upi"
    | "cheque"
    | "online"
    | "other"

export type ReserveFund = {
    id: number
    reserve_fund_id: string
    title: string
    category: string | null
    amount: string | number
    transaction_type: ReserveFundTransactionType
    payment_mode: ReserveFundPaymentMode | null
    reference_no: string | null
    fund_date: string
    financial_year: string | null
    status: ReserveFundStatus
    remark: string | null
    created_by: string | null
    updated_by: string | null
    deleted_by?: string | null
    is_deleted: 0 | 1
    created_at: string | null
    updated_at: string | null
    formatted_amount?: string
    formatted_fund_date?: string | null
    formatted_created_at?: string | null
    formatted_updated_at?: string | null
}

export type ReserveFundsPaginationLink = {
    url: string | null
    label: string
    active: boolean
}

export type ReserveFundsPaginatedData = {
    current_page: number
    data: ReserveFund[]
    first_page_url: string | null
    from: number | null
    last_page: number
    last_page_url: string | null
    links: ReserveFundsPaginationLink[]
    next_page_url: string | null
    path: string
    per_page: number
    prev_page_url: string | null
    to: number | null
    total: number
}

export type ReserveFundsApiResponse = {
    status: "success" | "error"
    message: string
    data: ReserveFundsPaginatedData
}

export type ReserveFundApiResponse = {
    status: "success" | "error"
    message: string
    data: ReserveFund
}

export type ReserveFundSummary = {
    total_credit: number
    total_debit: number
    available_balance: number
    active_funds: number
    inactive_funds: number
    cancelled_funds: number
    total_records: number
}

export type ReserveFundSummaryApiResponse = {
    status: "success" | "error"
    message: string
    data: ReserveFundSummary
}

export type ReserveFundQueryParams = {
    search?: string
    category?: string
    transaction_type?: ReserveFundTransactionType
    payment_mode?: ReserveFundPaymentMode
    financial_year?: string
    status?: ReserveFundStatus
    fund_date_from?: string
    fund_date_to?: string
    per_page?: number
    page?: number
    sort_by?:
        | "id"
        | "reserve_fund_id"
        | "title"
        | "category"
        | "amount"
        | "transaction_type"
        | "payment_mode"
        | "fund_date"
        | "financial_year"
        | "status"
        | "created_at"
        | "updated_at"
        | "is_deleted"
    sort_order?: "asc" | "desc"
    with_deleted?: boolean
    only_deleted?: boolean
}

export type CreateReserveFundPayload = {
    reserve_fund_id?: string
    title: string
    category?: string | null
    amount: number
    transaction_type: ReserveFundTransactionType
    payment_mode?: ReserveFundPaymentMode | null
    reference_no?: string | null
    fund_date: string
    financial_year?: string | null
    status?: ReserveFundStatus
    remark?: string | null
    created_by?: string | null
    updated_by?: string | null
}

export type UpdateReserveFundPayload = {
    reserve_fund_id?: string
    title: string
    category?: string | null
    amount: number
    transaction_type: ReserveFundTransactionType
    payment_mode?: ReserveFundPaymentMode | null
    reference_no?: string | null
    fund_date: string
    financial_year?: string | null
    status?: ReserveFundStatus
    remark?: string | null
    updated_by?: string | null
}

export type DeleteReserveFundPayload = {
    deleted_by?: string | null
}

export type ApiErrorResponse = {
    status?: string
    message?: string
    errors?: Record<string, string[]>
}

function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
    const axiosError = error as AxiosError<ApiErrorResponse>
    return axiosError.response?.data?.message ?? axiosError.message ?? fallbackMessage
}

function cleanParams(params?: ReserveFundQueryParams): ReserveFundQueryParams {
    const cleanedParams: ReserveFundQueryParams = {}

    if (!params) {
        return cleanedParams
    }

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            cleanedParams[key as keyof ReserveFundQueryParams] = value as never
        }
    })

    return cleanedParams
}

export async function getReserveFundsHandler(params?: ReserveFundQueryParams): Promise<ReserveFundsApiResponse> {
    try {
        const response = await apiClient.get<ReserveFundsApiResponse>("/api/v1/reserve-funds", {
            params: cleanParams(params),
        })

        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to fetch reserve funds"))
    }
}

export async function getReserveFundDetailsHandler(id: string | number): Promise<ReserveFundApiResponse> {
    try {
        const response = await apiClient.get<ReserveFundApiResponse>(`/api/v1/reserve-funds/${id}`)
        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to fetch reserve fund details"))
    }
}

export async function createReserveFundHandler(payload: CreateReserveFundPayload): Promise<ReserveFundApiResponse> {
    try {
        const response = await apiClient.post<ReserveFundApiResponse>("/api/v1/reserve-funds", payload)
        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to create reserve fund"))
    }
}

export async function updateReserveFundHandler(id: string | number, payload: UpdateReserveFundPayload): Promise<ReserveFundApiResponse> {
    try {
        const response = await apiClient.put<ReserveFundApiResponse>(`/api/v1/reserve-funds/${id}`, payload)
        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to update reserve fund"))
    }
}

export async function deleteReserveFundHandler(id: string | number, payload?: DeleteReserveFundPayload): Promise<{ status: "success" | "error"; message: string }> {
    try {
        const response = await apiClient.delete<{ status: "success" | "error"; message: string }>(`/api/v1/reserve-funds/${id}`, {
            data: payload,
        })

        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to delete reserve fund"))
    }
}

export async function restoreReserveFundHandler(id: string | number): Promise<ReserveFundApiResponse> {
    try {
        const response = await apiClient.patch<ReserveFundApiResponse>(`/api/v1/reserve-funds/${id}/restore`)
        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to restore reserve fund"))
    }
}

export async function forceDeleteReserveFundHandler(id: string | number): Promise<{ status: "success" | "error"; message: string }> {
    try {
        const response = await apiClient.delete<{ status: "success" | "error"; message: string }>(`/api/v1/reserve-funds/${id}/force-delete`)
        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to permanently delete reserve fund"))
    }
}

export async function getReserveFundSummaryHandler(params?: Pick<ReserveFundQueryParams, "financial_year" | "fund_date_from" | "fund_date_to" | "status">): Promise<ReserveFundSummaryApiResponse> {
    try {
        const response = await apiClient.get<ReserveFundSummaryApiResponse>("/api/v1/reserve-funds/summary", {
            params: cleanParams(params),
        })

        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to fetch reserve fund summary"))
    }
}