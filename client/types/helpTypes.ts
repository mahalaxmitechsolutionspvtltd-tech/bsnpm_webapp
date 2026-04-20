export type HelpStatus = "Pending" | "Replied" | "Closed" | string

export interface HelpReplyItem {
  message: string
  admin_name?: string | null
  reply_at: string
}

export interface HelpMemberReplyItem {
  message: string
  reply_at: string
  [key: string]: unknown
}

export interface HelpItem {
  id: number
  member_id: string
  member_name: string
  subject: string
  category: string
  message: string
  attachment: string | null
  attachment_url: string | null
  status: HelpStatus
  created_by: string | null
  created_at: string | null
  admin_reply: HelpReplyItem[] | null
  member_replies: HelpMemberReplyItem[] | null
  updated_by: string | null
  updated_at: string | null
}

export interface HelpListResponse {
  success: boolean
  message: string
  data: HelpItem[]
}

export interface HelpSingleResponse {
  success: boolean
  message: string
  data: HelpItem
}

export interface HelpReplyPayload {
  message: string
  admin_name?: string
  updated_by?: string
  status?: HelpStatus
}

export interface HelpQueryParams {
  member_id?: string
  status?: string
  category?: string
  search?: string
}

export interface ApiErrorResponse {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}