import axios, { AxiosError } from "axios"
import { apiClient } from "@/lib/api-client"
import type {
    AddMomPayload,
    ApiErrorResponse,
    ApiSuccessResponse,
    LaravelPaginatedResponse,
    MomItem,
    MomListQuery,
    PublishMomPayload,
    UpdateMomPayload,
} from "@/types/mom"

const getErrorMessage = (error: unknown): never => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiErrorResponse>
        const message =
            axiosError.response?.data?.message ||
            axiosError.message ||
            "Something went wrong"

        throw new Error(message)
    }

    throw new Error("Something went wrong")
}

export const getAllMomHandler = async (
    params: MomListQuery = {}
): Promise<ApiSuccessResponse<LaravelPaginatedResponse<MomItem>>> => {
    try {
        const response = await apiClient.get<
            ApiSuccessResponse<LaravelPaginatedResponse<MomItem>>
        >("/api/v1/mom/get", {
            params: {
                search: params.search ?? "",
                page: params.page ?? 1,
                per_page: params.per_page ?? 10,
            },
        })

        return response.data
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const addMomHandler = async (
    payload: AddMomPayload
): Promise<ApiSuccessResponse<MomItem>> => {
    try {
        const response = await apiClient.post<ApiSuccessResponse<MomItem>>(
            "/api/v1/mom/add",
            payload
        )

        return response.data
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const updateMomHandler = async (
    id: number,
    payload: UpdateMomPayload
): Promise<ApiSuccessResponse<MomItem>> => {
    try {
        const response = await apiClient.post<ApiSuccessResponse<MomItem>>(
            `/api/v1/mom/update/${id}`,
            payload
        )

        return response.data
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const deleteMomHandler = async (
    id: number
): Promise<ApiSuccessResponse<null>> => {
    try {
        const response = await apiClient.delete<ApiSuccessResponse<null>>(
            `/api/v1/mom/delete/${id}`
        )

        return response.data
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const publishMomHandler = async (
    id: number,
    payload: PublishMomPayload = {}
): Promise<ApiSuccessResponse<MomItem>> => {
    try {
        const response = await apiClient.patch<ApiSuccessResponse<MomItem>>(
            `/api/v1/mom/publish/${id}`,
            payload
        )

        return response.data
    } catch (error) {
        return getErrorMessage(error)
    }
}