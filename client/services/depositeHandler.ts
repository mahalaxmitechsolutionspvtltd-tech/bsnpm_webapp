import { apiClient } from "@/lib/api-client"
import type {
    ApproveDepositRenewalPayload,
    CreateDepositSchemePayload,
    DepositApplicationStatus,
    DepositScheme,
    UpdateDepositApplicationStartDatePayload,
    UpdateDepositSchemePayload,
} from "@/types/depositeTypes"

type DepositSchemeApiResponse = {
    success?: boolean
    message?: string
    data?: DepositScheme[]
}

const getDepositeSchemesHandler = async (): Promise<DepositScheme[]> => {
    const response = await apiClient.get<DepositSchemeApiResponse>(
        "/api/v1/get-deposite-schemes"
    )

    return Array.isArray(response.data?.data) ? response.data.data : []
}

const addDepositeSchemeHandler = async (payload: CreateDepositSchemePayload) => {
    const response = await apiClient.post(
        "/api/v1/add-deposite-scheme",
        payload
    )

    return response
}

const updateDepositeSchemeHandler = async (
    id: number,
    payload: UpdateDepositSchemePayload
) => {
    const response = await apiClient.post(
        `/api/v1/update-deposite-scheme/${id}`,
        payload
    )

    return response.data
}

const getAllDepositeApplications = async () => {
    const response = await apiClient.get(
        "/api/v1/get-deposite-applications"
    )

    return response.data.data ?? []
}

const statusUpdateHandler = async (
    application_id: number | string,
    payload: DepositApplicationStatus
) => {
    const response = await apiClient.patch(
        `/api/v1/deposite/update-application-status/${application_id}`,
        payload
    )

    return response.data
}

const applicationStartDateUpdateHandler = async (
    application_id: number | string,
    payload: UpdateDepositApplicationStartDatePayload
) => {
    const response = await apiClient.patch(
        `/api/v1/deposite/application-start-date/${application_id}`,
        payload
    )

    return response.data
}

const getDepositeApplicaionRenewals = async () => {
    const response = await apiClient.get(
        "/api/v1/deposite/get-renewals-application"
    )

    return response.data
}

const getDepositInstallmentsByOldApplicationId = async (
    oldApplicationId: string
) => {
    const response = await apiClient.get(
        `/api/v1/get-deposit-installments/${oldApplicationId}`
    )

    return response.data
}

const approveDepositRenewalApplication = async (
    payload: ApproveDepositRenewalPayload
) => {
    const response = await apiClient.post(
        "/api/v1/approve-deposit-renewal",
        payload
    )

    return response.data
}

export {
    getDepositeSchemesHandler,
    addDepositeSchemeHandler,
    updateDepositeSchemeHandler,
    getAllDepositeApplications,
    statusUpdateHandler,
    applicationStartDateUpdateHandler,
    getDepositeApplicaionRenewals,
    getDepositInstallmentsByOldApplicationId,
    approveDepositRenewalApplication,
}