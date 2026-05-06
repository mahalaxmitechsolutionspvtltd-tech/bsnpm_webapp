import { apiClient } from "@/lib/api-client"

export type GetPaymentHistoryParams = {
  page?: number
  per_page?: number
  member_id?: string
  application_no?: string
}

export const getPaymentHistoryHandler = async (
  params: GetPaymentHistoryParams = {}
) => {
  const response = await apiClient.get("/api/v1/payment-history", {
    params: {
      page: params.page,
      per_page: params.per_page,
      member_id: params.member_id,
      application_no: params.application_no,
    },
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
  const response = await apiClient.patch(
    `/api/v1/payment-history/approve/${accountManagementId}`,
    payload
  )

  return response.data
}