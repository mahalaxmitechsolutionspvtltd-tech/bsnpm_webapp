import { apiClient } from "@/lib/api-client"

export type DividentItem = {
    id: number
    financial_year: string
    dividend_rate: number | string | null
    total_payout: number | string | null
    declared_date: string | null
    created_by: string | null
    created_at: string | null
    updated_by: string | null
    updated_at: string | null
    is_deleted: number | boolean
    deleted_by: string | null
    deleted_at?: string | null
}

export type GetAllDividentResponse = {
    success: boolean
    message: string
    data: DividentItem[]
}

export type MemberShareCapitalItem = {
    id: number
    member_id: string
    member_name: string
    share_capital_amount: number | string
    last_payment_date: string | null
    updated_by: string | null
    updated_at: string | null
}

export type GetMemberShareCapitalResponse = {
    success: boolean
    message: string
    data: MemberShareCapitalItem[]
}

export type CreateDividendPayload = {
    financial_year: string
    dividend_rate: number
    declared_date?: string
    created_by?: string
}

export type DividendResponse = {
    success: boolean
    message: string
    data: unknown
    errors?: Record<string, string[]>
}

export const getAllDividentHandler = async (
    financialYear?: string
): Promise<GetAllDividentResponse> => {
    const response = await apiClient.get<GetAllDividentResponse>("/api/v1/divident", {
        params: financialYear ? { financial_year: financialYear } : {},
    })

    return {
        success: Boolean(response.data?.success),
        message: String(response.data?.message ?? ""),
        data: Array.isArray(response.data?.data) ? response.data.data : [],
    }
}

export const getMemberShareCapitalHandler = async (): Promise<GetMemberShareCapitalResponse> => {
    const response = await apiClient.get<GetMemberShareCapitalResponse>(
        "/api/v1/divident/member-share-capital"
    )

    return {
        success: Boolean(response.data?.success),
        message: String(response.data?.message ?? ""),
        data: Array.isArray(response.data?.data) ? response.data.data : [],
    }
}

export const createDividendHandler = async (
    payload: CreateDividendPayload
): Promise<DividendResponse> => {
    const response = await apiClient.post<DividendResponse>(
        "/api/v1/divident/create",
        payload
    )

    return response.data
}