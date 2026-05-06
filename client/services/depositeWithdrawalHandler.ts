import { apiClient } from "@/lib/api-client"
import {
    CommonApiResponse,
    CommonTableApiResponse,
    DepositWithdrawalItem,
    UpdateWithdrawalRequestPayload,
} from "@/types/depositeWithdrawalRequest"

export interface GetWithdrawalRequestsParams {
    search?: string
    status?: string
    page?: number
    per_page?: number
}

export const getWithdrawalRequestsHandler = async (
    params: GetWithdrawalRequestsParams = {}
): Promise<CommonTableApiResponse<DepositWithdrawalItem>> => {
    const response = await apiClient.get<CommonTableApiResponse<DepositWithdrawalItem>>(
        "/api/v1/withdrawal-requests",
        {
            params: {
                search: params.search ?? "",
                status: params.status ?? "",
                page: params.page ?? 1,
                per_page: params.per_page ?? 10,
            },
        }
    )

    return response.data
}

export const approveWithdrawalRequestHandler = async (
    id: number | string,
    payload: UpdateWithdrawalRequestPayload = {}
): Promise<CommonApiResponse> => {
    const response = await apiClient.patch<CommonApiResponse>(
        `/api/v1/withdrawal-requests/${id}/approve`,
        {
            updated_by: payload.updated_by ?? "",
        }
    )

    return response.data
}

export const rejectWithdrawalRequestHandler = async (
    id: number | string,
    payload: UpdateWithdrawalRequestPayload = {}
): Promise<CommonApiResponse> => {
    const response = await apiClient.patch<CommonApiResponse>(
        `/api/v1/withdrawal-requests/${id}/reject`,
        {
            updated_by: payload.updated_by ?? "",
        }
    )

    return response.data
}