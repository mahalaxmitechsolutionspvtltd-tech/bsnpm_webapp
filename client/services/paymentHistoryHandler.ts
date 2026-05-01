
import axios from "axios"


const URI = process.env.NEXT_PUBLIC_API_BASE_URL
type PaymentHistoryStatusFilter = 'pending' | 'approved'

export type GetPaymentHistoryParams = {
    status?: PaymentHistoryStatusFilter
    page?: number
    per_page?: number
    member_id?: string
    application_no?: string
}

export const getPaymentHistoryHandler = async (params: GetPaymentHistoryParams = {}) => {
    const response = await axios.get(`${URI}/api/v1/payment-history`, {
        params: {
            status: params.status ?? 'pending',
            page: params.page,
            per_page: params.per_page,
            member_id: params.member_id,
            application_no: params.application_no,
        },
        headers:{
            'Content-Type':'application/json'
        },
        withCredentials:true
    })

    return response.data
}

export const approvePaymentStatusHandler = async (
    accountManagementId: number | string,
    payload: {
        application_no: string
        updated_by: string
    }
) => {
    const response = await axios.patch(
        `${URI}/api/v1/payment-history/approve/${accountManagementId}`,
        payload,
        {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            withCredentials: true,
        }
    )

    return response.data
}

