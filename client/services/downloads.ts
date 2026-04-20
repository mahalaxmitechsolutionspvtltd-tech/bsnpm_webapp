import axios, { AxiosError } from "axios"
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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL 

const downloadsApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
})

const getErrorMessage = (error: unknown): string => {
  const axiosError = error as AxiosError<ApiErrorResponse>
  return (
    axiosError.response?.data?.message ||
    (typeof axiosError.response?.data?.errors === "string"
      ? axiosError.response?.data?.errors
      : "") ||
    axiosError.message ||
    "Something went wrong"
  )
}

const isBrowserFormData = (payload: unknown): payload is FormData => {
  return typeof FormData !== "undefined" && payload instanceof FormData
}

export const getAllDownloads = async (
  params?: DownloadQueryParams
): Promise<DownloadListResponse> => {
  try {
    const response = await downloadsApi.get<DownloadListResponse>(
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
    const response = await downloadsApi.post<DownloadSingleResponse>(
      "/api/v1/downloads/add-downloads",
      payload,
      {
        headers: isBrowserFormData(payload)
          ? {
              "Content-Type": "multipart/form-data",
            }
          : {
              "Content-Type": "application/json",
            },
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
    const response = await downloadsApi.post<DownloadSingleResponse>(
      `/api/v1/downloads/update/${id}`,
      payload,
      {
        headers: isBrowserFormData(payload)
          ? {
              "Content-Type": "multipart/form-data",
            }
          : {
              "Content-Type": "application/json",
            },
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
    const response = await downloadsApi.delete<DownloadDeleteResponse>(
      `/api/v1/downloads/delete/${id}`,
      {
        data: payload,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}