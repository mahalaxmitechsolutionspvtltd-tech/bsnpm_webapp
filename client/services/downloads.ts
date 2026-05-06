import { AxiosError } from "axios"
import { apiClient } from "@/lib/api-client"
import type {
    ApiErrorResponse,
    DownloadCreatePayload,
    DownloadDeleteResponse,
    DownloadFormData,
    DownloadListResponse,
    DownloadQueryParams,
    DownloadSingleResponse,
    DownloadUpdatePayload,
} from "@/types/downloads"

const getErrorMessage = (error: unknown): string => {
    const axiosError = error as AxiosError<ApiErrorResponse>

    return (
        axiosError.response?.data?.message ||
        (typeof axiosError.response?.data?.errors === "string"
            ? axiosError.response.data.errors
            : "") ||
        axiosError.message ||
        "Something went wrong"
    )
}

const isBrowserFormData = (payload: unknown): payload is FormData => {
    return typeof FormData !== "undefined" && payload instanceof FormData
}

const getRequestHeaders = (payload: unknown) => {
    if (isBrowserFormData(payload)) {
        return {
            Accept: "application/json",
        }
    }

    return {
        Accept: "application/json",
        "Content-Type": "application/json",
    }
}

export const getAllDownloads = async (
    params?: DownloadQueryParams
): Promise<DownloadListResponse> => {
    try {
        const response = await apiClient.get<DownloadListResponse>(
            "/api/v1/downloads/get-downloads",
            {
                params,
            }
        )

        return response.data
    } catch (error) {
        throw new Error(getErrorMessage(error))
    }
}

export const addDownload = async (
    payload: DownloadCreatePayload
): Promise<DownloadSingleResponse> => {
    try {
        const response = await apiClient.post<DownloadSingleResponse>(
            "/api/v1/downloads/add-downloads",
            payload,
            {
                headers: getRequestHeaders(payload),
            }
        )

        return response.data
    } catch (error) {
        throw new Error(getErrorMessage(error))
    }
}

export const updateDownload = async (
    id: number | string,
    payload: DownloadUpdatePayload
): Promise<DownloadSingleResponse> => {
    try {
        const response = await apiClient.post<DownloadSingleResponse>(
            `/api/v1/downloads/update/${id}`,
            payload,
            {
                headers: getRequestHeaders(payload),
            }
        )

        return response.data
    } catch (error) {
        throw new Error(getErrorMessage(error))
    }
}

export const deleteDownload = async (
    id: number | string,
    payload?: Pick<DownloadFormData, "deleted_by">
): Promise<DownloadDeleteResponse> => {
    try {
        const response = await apiClient.delete<DownloadDeleteResponse>(
            `/api/v1/downloads/delete/${id}`,
            {
                data: payload,
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            }
        )

        return response.data
    } catch (error) {
        throw new Error(getErrorMessage(error))
    }
}