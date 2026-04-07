import { PaymentHistoryDetailsResponse, PaymentHistoryDialogItem, PaymentHistoryListResponse, PaymentHistoryTableItem } from "@/types/paymentsTypes"
import axios from "axios"


const URI = process.env.NEXT_PUBLIC_API_BASE_URL

export const getPaymentHistoryHandler = async (): Promise<PaymentHistoryTableItem[]> => {
    const response = await axios.get<PaymentHistoryListResponse>(
        `${URI}/api/v1/payment-history`, {
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        withCredentials: true
    }
    )
    return Array.isArray(response.data?.data) ? response.data.data : []
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

