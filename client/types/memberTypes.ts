export type MemberStatus =
    | "active"
    | "inactive"
    | "pending"
    | "blocked"
    | "deleted"
    | string

export type MemberGender =
    | "Male"
    | "Female"
    | "other"
    | string

export type member_joining_fee =
    | "yes"
    | "no"

export type share_capital =
    | "yes"
    | "no"

export type emergancy_fund =
    | "yes"
    | "no"



export interface Nominees {
    id: number
    member_name: string
    nominee_name: string
    relation: string
    nominee_contact: string
    created_by: string
    updated_by: string
    created_at: string
    update_at: string
}

export interface Member {
    id: number
    member_id: string
    full_name: string
    email: string | null
    mobile_number: string | null
    residential_address: string | null
    gender: MemberGender | null
    status: MemberStatus | null
    profile_photo: string | null
    nominee: Nominees | null
    password: string
    created_by: string | null
    created_at: string | null
    updated_by: string | null
    updated_at: string | null
    is_deleted: 0 | 1 | boolean
    deleted_by: string | null
    deleted_at: string | null
}

export interface CreateMemberPayload {

    full_name: string
    email?: string | null
    mobile_number?: string | null
    gender?: MemberGender | null
    status?: MemberStatus | null
    member_joining_fee?: member_joining_fee | null
    share_capital?: share_capital | null
    emergancy_fund?: emergancy_fund | null
    password: string
    created_by?: string | null
}

export interface UpdateMemberPayload {
    member_id?: string
    full_name?: string
    email?: string | null
    mobile_number?: string | null
    residential_address?: string | null
    gender?: MemberGender | null
    status?: MemberStatus | null
    profile_photo?: string | null
    password?: string
    updated_by?: string | null
    is_deleted?: 0 | 1 | boolean
    deleted_by?: string | null
    deleted_at?: string | null
}

export interface MemberListResponse {
    success: boolean
    message?: string
    data: Member[]
}

export interface MemberSingleResponse {
    success: boolean
    message?: string
    data: Member
}

export interface MemberMutationResponse {
    success: boolean
    message: string
    data?: Member
}

export type UpdateMemberStatusPayload = {
    member_id: string
    status: "active" | "defaulter" | "resigned" | "deactive"
    updated_by?: string | null
}