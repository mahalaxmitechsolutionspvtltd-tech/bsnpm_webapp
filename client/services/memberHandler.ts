import axios from "axios";
import type { Member, MemberListResponse, CreateMemberPayload, UpdateMemberStatusPayload } from "@/types/memberTypes";


const URI = process.env.NEXT_PUBLIC_API_BASE_URL;



const getMemberHandler = async (): Promise<Member[]> => {
    const response = await axios.get<MemberListResponse>(`${URI}/api/v1/members`, {
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        withCredentials: true
    });

    return response.data.data ?? [];
};

const addMemberHandler = async (payload: CreateMemberPayload) => {
    const response = await axios.post(`${URI}/api/v1/create-member`, payload, {
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        withCredentials: true,
    })

    return response.data
}

const updateMemberStatusHandler = async (payload: UpdateMemberStatusPayload) => {
    const response = await axios.patch(
        `${URI}/api/v1/update-member-status/${payload.member_id}`,
        {
            status: payload.status,
            updated_by: payload.updated_by ?? null,
        },
        {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            withCredentials: true,
        }
    )

    return response.data
}

export { getMemberHandler, addMemberHandler, updateMemberStatusHandler };