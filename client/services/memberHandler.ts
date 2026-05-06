import { apiClient } from "@/lib/api-client"
import type {
    CreateMemberPayload,
    Member,
    MemberListResponse,
    UpdateMemberStatusPayload,
} from "@/types/memberTypes"

const getMemberHandler = async (): Promise<Member[]> => {
    const response = await apiClient.get<MemberListResponse>("/api/v1/members")

    return response.data.data ?? []
}

const addMemberHandler = async (payload: CreateMemberPayload) => {
    const response = await apiClient.post("/api/v1/create-member", payload)

    return response.data
}

const updateMemberStatusHandler = async (payload: UpdateMemberStatusPayload) => {
    const response = await apiClient.patch(
        `/api/v1/update-member-status/${payload.member_id}`,
        {
            status: payload.status,
            updated_by: payload.updated_by ?? null,
        }
    )

    return response.data
}

export const LogoutHandler = async (): Promise<void> => {
    await apiClient.post("/api/v1/logout", {})
}

export { getMemberHandler, addMemberHandler, updateMemberStatusHandler }