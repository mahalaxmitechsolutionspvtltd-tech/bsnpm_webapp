import { CommonApiResponse, CommonTableApiResponse, DepositWithdrawalItem, UpdateWithdrawalRequestPayload } from '@/types/depositeWithdrawalRequest'
import axios from 'axios'

const URI = process.env.NEXT_PUBLIC_API_BASE_URL

export interface GetWithdrawalRequestsParams {
    search?: string
    status?: string
    page?: number
    per_page?: number
}

export const getWithdrawalRequestsHandler = async (
    params: GetWithdrawalRequestsParams = {}
): Promise<CommonTableApiResponse<DepositWithdrawalItem>> => {
    const response = await axios.get(`${URI}/api/v1/withdrawal-requests`, {
        params: {
            search: params.search ?? '',
            status: params.status ?? '',
            page: params.page ?? 1,
            per_page: params.per_page ?? 10,
        },
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        withCredentials: true,
    })

    return response.data as CommonTableApiResponse<DepositWithdrawalItem>
}

export const approveWithdrawalRequestHandler = async (
    id: number | string,
    payload: UpdateWithdrawalRequestPayload = {}
): Promise<CommonApiResponse> => {
    const response = await axios.patch(
        `${URI}/api/v1/withdrawal-requests/${id}/approve`,
        {
            updated_by: payload.updated_by ?? ''
        },
        {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            withCredentials: true
        }
    )

    return response.data as CommonTableApiResponse<DepositWithdrawalItem>
}


export const rejectWithdrawalRequestHandler = async (
    id: number | string,
    payload: UpdateWithdrawalRequestPayload = {}
): Promise<CommonApiResponse> => {
    const response = await axios.patch(
        `${URI}/api/v1/withdrawal-requests/${id}/reject`,
        {
            updated_by: payload.updated_by ?? ''
        },
        {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            withCredentials: true
        }
    )

    return response.data as CommonApiResponse
}