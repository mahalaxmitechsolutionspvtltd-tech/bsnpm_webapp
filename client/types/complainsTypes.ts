export type ComplaintReplyItem = {
  message: string
  timestamp: string
  updated_by?: string | null
}

export type ComplaintItem = {
  id: number
  member_id: string
  member_name: string
  subject: string
  category: string
  message: string
  admin_reply: ComplaintReplyItem[] | null
  member_reply: ComplaintReplyItem[] | null
  status: string
  created_by: string | null
  created_at: string | null
  updated_by: string | null
  updated_at: string | null
  is_deleted: boolean | number
  deleted_by: string | null
}

export type ComplaintListFilters = {
  search?: string
  status?: string
  category?: string
  member_id?: string
  page?: number
  per_page?: number
}

export type PaginationLink = {
  url: string | null
  label: string
  active: boolean
}

export type PaginatedComplaintResponse = {
  current_page: number
  data: ComplaintItem[]
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

export type ComplaintListApiResponse =
  | ApiSuccessResponse<PaginatedComplaintResponse>
  | ApiErrorResponse

export type ComplaintSingleApiResponse =
  | ApiSuccessResponse<ComplaintItem>
  | ApiErrorResponse

export type ComplaintDeleteApiResponse =
  | ApiSuccessResponse<null>
  | ApiErrorResponse

export type ReplyComplaintPayload = {
  message: string
  updated_by?: string
  status?: string
}
