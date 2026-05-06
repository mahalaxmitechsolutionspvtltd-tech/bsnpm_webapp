import { apiClient } from "@/lib/api-client"
import {
    ComplaintDeleteApiResponse,
    ComplaintItem,
    ComplaintListApiResponse,
    ComplaintListFilters,
    ComplaintSingleApiResponse,
    PaginatedComplaintResponse,
    ReplyComplaintPayload,
} from "@/types/complainsTypes"

export const getComplaintsHandler = async (
    filters?: ComplaintListFilters
): Promise<PaginatedComplaintResponse> => {
    const params: Record<string, string | number> = {}

    if (filters?.search) {
        params.search = filters.search
    }

    if (filters?.status) {
        params.status = filters.status
    }

    if (filters?.category) {
        params.category = filters.category
    }

    if (filters?.member_id) {
        params.member_id = filters.member_id
    }

    if (filters?.page) {
        params.page = filters.page
    }

    if (filters?.per_page) {
        params.per_page = filters.per_page
    }

    const response = await apiClient.get<ComplaintListApiResponse>(
        "/api/v1/complaints",
        {
            params,
        }
    )

    if (!response.data.success) {
        throw response.data
    }

    return response.data.data
}

export const getComplaintByIdHandler = async (
    id: number | string
): Promise<ComplaintItem> => {
    const response = await apiClient.get<ComplaintSingleApiResponse>(
        `/api/v1/complaints/${id}`
    )

    if (!response.data.success) {
        throw response.data
    }

    return response.data.data
}

export const replyComplaintHandler = async (
    id: number | string,
    payload: ReplyComplaintPayload
): Promise<ComplaintItem> => {
    const response = await apiClient.patch<ComplaintSingleApiResponse>(
        `/api/v1/complaints/${id}/reply`,
        {
            message: payload.message,
            updated_by: payload.updated_by,
            status: payload.status,
        }
    )

    if (!response.data.success) {
        throw response.data
    }

    return response.data.data
}

export const deleteComplaintHandler = async (
    id: number | string,
    deleted_by?: string
): Promise<{ success: true; message: string }> => {
    const response = await apiClient.delete<ComplaintDeleteApiResponse>(
        `/api/v1/complaints/${id}`,
        {
            data: {
                deleted_by,
            },
        }
    )

    if (!response.data.success) {
        throw response.data
    }

    return {
        success: true,
        message: response.data.message,
    }
}