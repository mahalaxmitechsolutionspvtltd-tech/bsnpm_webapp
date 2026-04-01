export type Notice = {
    id: number
    title: string
    audience: 'ADMIN' | 'MEMBER' | 'SANCHALAK'
    message: string
    attachment_path: string | null
    attachment_name: string | null
    publish_at: string
    expire_at: string | null
    created_by_admin_id: number
    created_at: string
    updated_by_admin_id: number | null
    updated_at: string
}

export type GetNoticesParams = {
    audience?: 'ADMIN' | 'MEMBER' | 'SANCHALAK'
    search?: string
}