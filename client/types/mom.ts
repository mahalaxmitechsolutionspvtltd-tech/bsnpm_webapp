export type MomAudience =
  | "all"
  | "staff"
  | "members"
  | "committee"
  | "board"
  | string

export interface MomItem {
  id: number
  title: string
  audience: MomAudience | null
  meeting_date: string | null
  publish_date: string | null
  key_points: string | null
  attachment_file: string | null
  is_published: boolean
  is_deleted: boolean
  created_at: string | null
  updated_at: string | null
}

export interface MomListQuery {
  search?: string
  page?: number
  per_page?: number
}

export interface AddMomPayload {
  title: string
  audience?: string | null
  meeting_date: string
  publish_date?: string | null
  key_points?: string | null
  attachment_file?: string | null
  is_published?: boolean
}

export interface UpdateMomPayload {
  title?: string
  audience?: string | null
  meeting_date?: string
  publish_date?: string | null
  key_points?: string | null
  attachment_file?: string | null
  is_published?: boolean
}

export interface PublishMomPayload {
  is_published?: boolean
  publish_date?: string | null
}

export interface LaravelPaginationLink {
  url: string | null
  label: string
  active: boolean
}

export interface LaravelPaginatedResponse<T> {
  current_page: number
  data: T[]
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  links: LaravelPaginationLink[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

export interface ApiSuccessResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface ApiErrorResponse {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}