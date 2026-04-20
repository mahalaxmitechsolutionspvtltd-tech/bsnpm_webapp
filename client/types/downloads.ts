export interface DownloadItem {
  id: number
  title: string
  description: string | null
  attachment: string
  created_by: string | null
  created_at: string | null
  updated_by: string | null
  updated_at: string | null
  is_deleted: number
  deleted_by: string | null
}

export interface DownloadListResponse {
  success: boolean
  message: string
  data: DownloadItem[]
}

export interface DownloadSingleResponse {
  success: boolean
  message: string
  data: DownloadItem
}

export interface DownloadDeleteResponse {
  success: boolean
  message: string
}

export interface DownloadFormData {
  title: string
  description?: string | null
  attachment: string
  created_by?: string | null
  updated_by?: string | null
  deleted_by?: string | null
}

export type DownloadCreatePayload = DownloadFormData | FormData
export type DownloadUpdatePayload = Partial<DownloadFormData> | FormData

export interface DownloadQueryParams {
  search?: string
}

export interface ApiValidationErrors {
  [key: string]: string[]
}

export interface ApiErrorResponse {
  success?: boolean
  message?: string
  errors?: ApiValidationErrors | string
}