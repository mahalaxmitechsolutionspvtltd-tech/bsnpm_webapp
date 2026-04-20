import axios, { AxiosError } from "axios"
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

const URI = process.env.NEXT_PUBLIC_API_BASE_URL

if (!URI) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined")
}

const momApi = axios.create({
  baseURL: URI.endsWith("/") ? URI.slice(0, -1) : URI,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
})

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
    const response = await momApi.get<
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
    const response = await momApi.post<ApiSuccessResponse<MomItem>>(
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
    const response = await momApi.post<ApiSuccessResponse<MomItem>>(
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
    const response = await momApi.delete<ApiSuccessResponse<null>>(
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
    const response = await momApi.patch<ApiSuccessResponse<MomItem>>(
      `/api/v1/mom/publish/${id}`,
      payload
    )
    return response.data
  } catch (error) {
    return getErrorMessage(error)
  }
}