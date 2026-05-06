import { AxiosError } from "axios"
import { apiClient } from "@/lib/api-client"
import type {
    ApiErrorResponse,
    HelpItem,
    HelpQueryParams,
    HelpReplyPayload,
    HelpListResponse,
    HelpSingleResponse,
} from "@/types/helpTypes"

const normalizeError = (error: unknown): never => {
    const axiosError = error as AxiosError<ApiErrorResponse>

    const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Something went wrong while processing the request."

    const enhancedError = new Error(message) as Error & {
        status?: number
        errors?: Record<string, string[]>
    }

    enhancedError.status = axiosError.response?.status
    enhancedError.errors = axiosError.response?.data?.errors

    throw enhancedError
}

export const getHelpListHandler = async (
    params?: HelpQueryParams
): Promise<HelpItem[]> => {
    try {
        const response = await apiClient.get<HelpListResponse>("/api/v1/help/getAll", {
            params: params ?? {},
        })

        if (!response.data?.success) {
            throw new Error(response.data?.message || "Failed to fetch help requests.")
        }

        return Array.isArray(response.data.data) ? response.data.data : []
    } catch (error) {
        return normalizeError(error)
    }
}

export const getHelpByIdHandler = async (
    id: number | string
): Promise<HelpItem> => {
    try {
        const response = await apiClient.get<HelpSingleResponse>(`/api/v1/help/${id}`)

        if (!response.data?.success || !response.data?.data) {
            throw new Error(response.data?.message || "Failed to fetch help request.")
        }

        return response.data.data
    } catch (error) {
        return normalizeError(error)
    }
}

export const replyHelpHandler = async (
    id: number | string,
    payload: HelpReplyPayload
): Promise<HelpItem> => {
    try {
        const response = await apiClient.post<HelpSingleResponse>(
            `/api/v1/help/${id}/reply`,
            payload
        )

        if (!response.data?.success || !response.data?.data) {
            throw new Error(response.data?.message || "Failed to reply help request.")
        }

        return response.data.data
    } catch (error) {
        return normalizeError(error)
    }
}