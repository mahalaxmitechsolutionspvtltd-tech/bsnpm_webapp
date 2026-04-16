import { ApiValidationError, CreateNoticePayload, NoticeDeleteResponse, NoticeListParams, NoticeListResponse, NoticeSingleResponse, UpdateNoticePayload } from "@/types/noticesType"
import axios, { AxiosError } from "axios"


const API_BASE_URL =
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
    (typeof process !== "undefined" && process.env?.VITE_REACT_BACKEND_URI) ||
    ""

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        Accept: "application/json",
    },
})

function normalizeError(error: unknown): never {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiValidationError>
        if (axiosError.response?.data) {
            throw axiosError.response.data
        }
        throw {
            success: false,
            message: axiosError.message || "Request failed",
            errors: {},
        }
    }

    throw {
        success: false,
        message: "Something went wrong",
        errors: {},
    }
}

function appendFormData(
    formData: FormData,
    payload: CreateNoticePayload | UpdateNoticePayload
): FormData {
    Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined) {
            return
        }

        if (value === null) {
            formData.append(key, "")
            return
        }

        if (value instanceof File || value instanceof Blob) {
            formData.append(key, value)
            return
        }

        if (typeof value === "boolean") {
            formData.append(key, value ? "1" : "0")
            return
        }

        formData.append(key, String(value))
    })

    return formData
}

export async function getNoticeHandler(
    params: NoticeListParams = {}
): Promise<NoticeListResponse> {
    try {
        const response = await api.get<NoticeListResponse>("/api/v1/notices", {
            params,
        })
        return response.data
    } catch (error) {
        normalizeError(error)
    }
}

export async function createNoticeHandler(
    payload: CreateNoticePayload
): Promise<NoticeSingleResponse> {
    try {
        const hasFile = payload.attachment instanceof File || payload.attachment instanceof Blob

        if (hasFile) {
            const formData = appendFormData(new FormData(), payload)
            const response = await api.post<NoticeSingleResponse>("/api/v1/notices", formData)
            return response.data
        }

        const response = await api.post<NoticeSingleResponse>("/api/v1/notices", payload, {
            headers: {
                "Content-Type": "application/json",
            },
        })
        return response.data
    } catch (error) {
        normalizeError(error)
    }
}

export async function updateNoticeHandler(
    id: number | string,
    payload: UpdateNoticePayload
): Promise<NoticeSingleResponse> {
    try {
        const hasFile = payload.attachment instanceof File || payload.attachment instanceof Blob

        if (hasFile) {
            const formData = appendFormData(new FormData(), payload)
            formData.append("_method", "PUT")
            const response = await api.post<NoticeSingleResponse>(`/api/v1/notices/${id}`, formData)
            return response.data
        }

        const response = await api.put<NoticeSingleResponse>(`/api/v1/notices/${id}`, payload, {
            headers: {
                "Content-Type": "application/json",
            },
        })
        return response.data
    } catch (error) {
        normalizeError(error)
    }
}

export async function deleteHandler(
    id: number | string
): Promise<NoticeDeleteResponse> {
    try {
        const response = await api.delete<NoticeDeleteResponse>(`/api/v1/notices/${id}`)
        return response.data
    } catch (error) {
        normalizeError(error)
    }
}