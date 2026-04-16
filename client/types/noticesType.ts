export type NoticeAudience = string

export interface NoticeItem {
    id: number | string
    title: string
    audience: NoticeAudience
    message: string
    attachment_path: string | null
    attachment_name: string | null
    publish_at: string
    expire_at: string | null
    created_by_admin_id: number | string | null
    created_at: string | null
    updated_by_admin_id: number | string | null
    updated_at: string | null
}

export interface NoticeListResponse {
    success: boolean
    message: string
    data: NoticeItem[]
}

export interface NoticeSingleResponse {
    success: boolean
    message: string
    data: NoticeItem
}

export interface NoticeDeleteResponse {
    success: boolean
    message: string
}

export interface NoticeListParams {
    audience?: string
    search?: string
}

export interface CreateNoticePayload {
    title: string
    audience: string
    message: string
    publish_at: string
    expire_at?: string | null
    created_by_admin_id: number | string
    updated_by_admin_id?: number | string | null
    attachment?: File | Blob | null
    attachment_path?: string | null
    attachment_name?: string | null
}

export interface UpdateNoticePayload {
    title?: string
    audience?: string
    message?: string
    publish_at?: string
    expire_at?: string | null
    updated_by_admin_id: number | string
    attachment?: File | Blob | null
    attachment_path?: string | null
    attachment_name?: string | null
    remove_attachment?: boolean
}

export interface ApiValidationError {
    success?: boolean
    message?: string
    errors?: Record<string, string[] | string>
}