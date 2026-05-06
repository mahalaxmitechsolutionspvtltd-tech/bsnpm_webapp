import { AxiosError } from "axios"
import { apiClient } from "@/lib/api-client"

export type SanchalakStatus = "active" | "inactive" | "blocked"

export type Sanchalak = {
  id: number
  sanchalak_id: string
  sanchalak_name: string
  sanchalak_email: string
  sanchalak_mobile: string
  profile_photo: string | null
  status: SanchalakStatus
  created_at?: string | null
  updated_at?: string | null
}

export type GetSanchalaksParams = {
  search?: string
  status?: string
  from_date?: string
  to_date?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: "asc" | "desc"
  all?: boolean
}

export type PaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export type GetSanchalaksResponse = {
  success: boolean
  message: string
  data: Sanchalak[]
  pagination?: PaginationMeta
}

export type CreateSanchalakInput = {
  sanchalak_name: string
  sanchalak_email: string
  sanchalak_mobile: string
  password: string
  status: SanchalakStatus
  profile_photo?: File | null
}

export type UpdateSanchalakInput = {
  id: number
  sanchalak_name: string
  sanchalak_email: string
  sanchalak_mobile: string
  password?: string
  status: SanchalakStatus
  profile_photo?: File | null
}

export type CreateSanchalakResponse = {
  success: boolean
  message: string
  data: Sanchalak
}

export type UpdateSanchalakResponse = {
  success: boolean
  message: string
  data: Sanchalak
}

export type ApiErrorResponse = {
  success: false
  message: string
  errors?: Record<string, string[]>
  error?: string
}

const getApiErrorMessage = (error: unknown): string => {
  const axiosError = error as AxiosError<ApiErrorResponse>

  if (axiosError.response?.data?.errors) {
    const firstError = Object.values(axiosError.response.data.errors)[0]?.[0]

    if (firstError) {
      return firstError
    }
  }

  return axiosError.response?.data?.message || axiosError.message || "Something went wrong"
}

export const getSanchalaksHandler = async (
  params: GetSanchalaksParams = {}
): Promise<GetSanchalaksResponse> => {
  try {
    const response = await apiClient.get<GetSanchalaksResponse>("/api/v1/sanchalaks", {
      params,
    })

    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export const createSanchalakHandler = async (
  payload: CreateSanchalakInput
): Promise<CreateSanchalakResponse> => {
  try {
    const formData = new FormData()

    formData.append("sanchalak_name", payload.sanchalak_name.trim())
    formData.append("sanchalak_email", payload.sanchalak_email.trim())
    formData.append("sanchalak_mobile", payload.sanchalak_mobile.trim())
    formData.append("password", payload.password)
    formData.append("status", payload.status)

    if (payload.profile_photo) {
      formData.append("profile_photo", payload.profile_photo)
    }

    const response = await apiClient.post<CreateSanchalakResponse>(
      "/api/v1/sanchalaks",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )

    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export const updateSanchalakHandler = async (
  payload: UpdateSanchalakInput
): Promise<UpdateSanchalakResponse> => {
  try {
    const formData = new FormData()

    formData.append("sanchalak_name", payload.sanchalak_name.trim())
    formData.append("sanchalak_email", payload.sanchalak_email.trim())
    formData.append("sanchalak_mobile", payload.sanchalak_mobile.trim())
    formData.append("status", payload.status)

    if (payload.password && payload.password.trim().length > 0) {
      formData.append("password", payload.password)
    }

    if (payload.profile_photo) {
      formData.append("profile_photo", payload.profile_photo)
    }

    const response = await apiClient.post<UpdateSanchalakResponse>(
      `/api/v1/sanchalaks/${payload.id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )

    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}