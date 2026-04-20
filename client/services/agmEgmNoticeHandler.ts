import axios from "axios"

const URI = process.env.NEXT_PUBLIC_API_BASE_URL

export type AgmEgmNoticeItem = {
  id: number
  type: string
  audience: string | null
  title: string
  meeting_at: string | null
  is_published: boolean | number
  is_drafted: boolean | number
  publish_date: string | null
  attachment_file: string | null
  attachment_url?: string | null
  created_by: string | null
  created_at: string | null
  updated_by: string | null
  update_at: string | null
  is_deleted: boolean | number
  deleted_by: string | null
}

export type AgmEgmNoticeListFilters = {
  search?: string
  type?: string
  audience?: string
  is_published?: number | boolean
  is_drafted?: number | boolean
  from_date?: string
  to_date?: string
  page?: number
  per_page?: number
}

export type PaginationLink = {
  url: string | null
  label: string
  active: boolean
}

export type PaginatedAgmEgmNoticeResponse = {
  current_page: number
  data: AgmEgmNoticeItem[]
  first_page_url: string | null
  from: number | null
  last_page: number
  last_page_url: string | null
  links: PaginationLink[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

export type ApiSuccessResponse<T> = {
  success: true
  message: string
  data: T
}

export type ApiErrorResponse<E = Record<string, string[]>> = {
  success: false
  message: string
  errors?: E
}

export type AgmEgmNoticeListApiResponse =
  | ApiSuccessResponse<PaginatedAgmEgmNoticeResponse>
  | ApiErrorResponse

export type AgmEgmNoticeSingleApiResponse =
  | ApiSuccessResponse<AgmEgmNoticeItem>
  | ApiErrorResponse

export type AgmEgmNoticeDeleteApiResponse =
  | ApiSuccessResponse<null>
  | ApiErrorResponse

export type CreateAgmEgmNoticePayload = {
  type: string
  audience?: string
  title: string
  meeting_at?: string
  is_published?: boolean | number
  is_drafted?: boolean | number
  publish_date?: string
  attachment_file?: File | Blob | null
  created_by?: string
}

export type UpdateAgmEgmNoticePayload = {
  type?: string
  audience?: string | null
  title?: string
  meeting_at?: string | null
  is_published?: boolean | number
  is_drafted?: boolean | number
  publish_date?: string | null
  attachment_file?: File | Blob | null
  updated_by?: string
  remove_attachment?: boolean | number
}

export type PublishAgmEgmNoticePayload = {
  updated_by?: string
  publish_date?: string
}

function appendIfPresent(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null || value === "") {
    return
  }

  if (typeof value === "boolean") {
    formData.append(key, value ? "1" : "0")
    return
  }

  formData.append(key, String(value))
}

function buildNoticeFormData(
  payload: CreateAgmEgmNoticePayload | UpdateAgmEgmNoticePayload
) {
  const formData = new FormData()

  appendIfPresent(formData, "type", payload.type)
  appendIfPresent(formData, "audience", payload.audience)
  appendIfPresent(formData, "title", payload.title)
  appendIfPresent(formData, "meeting_at", payload.meeting_at)
  appendIfPresent(formData, "is_published", payload.is_published)
  appendIfPresent(formData, "is_drafted", payload.is_drafted)
  appendIfPresent(formData, "publish_date", payload.publish_date)
  appendIfPresent(formData, "created_by", (payload as CreateAgmEgmNoticePayload).created_by)
  appendIfPresent(formData, "updated_by", (payload as UpdateAgmEgmNoticePayload).updated_by)
  appendIfPresent(
    formData,
    "remove_attachment",
    (payload as UpdateAgmEgmNoticePayload).remove_attachment
  )

  if (payload.attachment_file) {
    formData.append("attachment_file", payload.attachment_file)
  }

  return formData
}

export const getAgmEgmNoticesHandler = async (
  filters?: AgmEgmNoticeListFilters
): Promise<PaginatedAgmEgmNoticeResponse> => {
  const params: Record<string, string | number> = {}

  if (filters?.search) {
    params.search = filters.search
  }

  if (filters?.type) {
    params.type = filters.type
  }

  if (filters?.audience) {
    params.audience = filters.audience
  }

  if (filters?.is_published !== undefined && filters?.is_published !== null) {
    params.is_published =
      typeof filters.is_published === "boolean"
        ? filters.is_published
          ? 1
          : 0
        : filters.is_published
  }

  if (filters?.is_drafted !== undefined && filters?.is_drafted !== null) {
    params.is_drafted =
      typeof filters.is_drafted === "boolean"
        ? filters.is_drafted
          ? 1
          : 0
        : filters.is_drafted
  }

  if (filters?.from_date) {
    params.from_date = filters.from_date
  }

  if (filters?.to_date) {
    params.to_date = filters.to_date
  }

  if (filters?.page) {
    params.page = filters.page
  }

  if (filters?.per_page) {
    params.per_page = filters.per_page
  }

  const response = await axios.get<AgmEgmNoticeListApiResponse>(
    `${URI}/api/v1/agm-egm-notices`,
    {
      params,
      headers: {
        Accept: "application/json",
      },
      withCredentials: true,
    }
  )

  if (!response.data.success) {
    throw response.data
  }

  return response.data.data
}

export const getAgmEgmNoticeByIdHandler = async (
  id: number | string
): Promise<AgmEgmNoticeItem> => {
  const response = await axios.get<AgmEgmNoticeSingleApiResponse>(
    `${URI}/api/v1/agm-egm-notices/${id}`,
    {
      headers: {
        Accept: "application/json",
      },
      withCredentials: true,
    }
  )

  if (!response.data.success) {
    throw response.data
  }

  return response.data.data
}

export const createAgmEgmNoticeHandler = async (
  payload: CreateAgmEgmNoticePayload
): Promise<AgmEgmNoticeItem> => {
  const formData = buildNoticeFormData(payload)

  const response = await axios.post<AgmEgmNoticeSingleApiResponse>(
    `${URI}/api/v1/agm-egm-notices`,
    formData,
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    }
  )

  if (!response.data.success) {
    throw response.data
  }

  return response.data.data
}

export const updateAgmEgmNoticeHandler = async (
  id: number | string,
  payload: UpdateAgmEgmNoticePayload
): Promise<AgmEgmNoticeItem> => {
  const formData = buildNoticeFormData(payload)

  const response = await axios.post<AgmEgmNoticeSingleApiResponse>(
    `${URI}/api/v1/agm-egm-notices/${id}`,
    formData,
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    }
  )

  if (!response.data.success) {
    throw response.data
  }

  return response.data.data
}

export const publishAgmEgmNoticeHandler = async (
  id: number | string,
  payload?: PublishAgmEgmNoticePayload
): Promise<AgmEgmNoticeItem> => {
  const response = await axios.patch<AgmEgmNoticeSingleApiResponse>(
    `${URI}/api/v1/agm-egm-notices/${id}/publish`,
    {
      updated_by: payload?.updated_by,
      publish_date: payload?.publish_date,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      withCredentials: true,
    }
  )

  if (!response.data.success) {
    throw response.data
  }

  return response.data.data
}

export const deleteAgmEgmNoticeHandler = async (
  id: number | string,
  deleted_by?: string
): Promise<{ success: true; message: string }> => {
  const response = await axios.delete<AgmEgmNoticeDeleteApiResponse>(
    `${URI}/api/v1/agm-egm-notices/${id}`,
    {
      data: {
        deleted_by,
      },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      withCredentials: true,
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