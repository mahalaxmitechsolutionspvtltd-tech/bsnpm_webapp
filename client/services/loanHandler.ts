import { apiClient } from "@/lib/api-client"
import { GetLoanEmiSchedulesResponse } from "@/types/emiSchedulesType"
import {
    GetRecoveryNoticesApiResponse,
    LoanEmiOverduesNotice,
    LoanEmiSummary,
    SendRecoveryNoticeRequest,
    SendRecoveryNoticeResponse,
} from "@/types/loanOverdues"
import {
    AddLoanSchemeFormValues,
    ApiResponse,
    ApproveLoanApplicationPayload,
    ApproveLoanApplicationResponse,
    LoanTypes,
} from "@/types/loanTypes"

const getLoanSchemesHandler = async (): Promise<LoanTypes[]> => {
    const response = await apiClient.get<ApiResponse>("/api/v1/get-loan-schemes")

    return Array.isArray(response.data?.data) ? response.data.data : []
}

const addLoanSchemes = async (payload: AddLoanSchemeFormValues) => {
    const response = await apiClient.post("/api/v1/add-loan-schemes", payload)

    return response.data
}

const updateLoanSchemes = async (
    scheme_id: number | string,
    payload: AddLoanSchemeFormValues
) => {
    const response = await apiClient.put(
        `/api/v1/update-loan-schemes/${scheme_id}`,
        payload
    )

    return response.data
}

const deleteLoanSchemes = async (
    scheme_id: number | string,
    deleted_by: string
) => {
    const response = await apiClient.post(
        `/api/v1/delete-loan-schemes/${scheme_id}`,
        {
            deleted_by,
        }
    )

    return response.data
}

export const getLoanApplicationsHandler = async () => {
    const response = await apiClient.get("/api/v1/get-loan-applications")

    return response.data
}

export const approveLoanApplicationHandler = async (
    application_id: number | string,
    payload: ApproveLoanApplicationPayload
): Promise<ApproveLoanApplicationResponse> => {
    const response = await apiClient.patch<ApproveLoanApplicationResponse>(
        `/api/v1/loan/approve-application/${application_id}`,
        payload
    )

    return response.data
}

export const getLoanEmiSchedulesHandler = async (
    search = "",
    page = 1,
    per_page = 10
): Promise<GetLoanEmiSchedulesResponse> => {
    const response = await apiClient.get<GetLoanEmiSchedulesResponse>(
        "/api/v1/loan/emi-schedules",
        {
            params: {
                search,
                page,
                per_page,
            },
        }
    )

    return response.data
}

const getLoanEmiOvedues = async (): Promise<LoanEmiSummary[]> => {
    const response = await apiClient.get("/api/v1/loan/emi-summary")

    return Array.isArray(response.data?.data) ? response.data.data : []
}

export const getRecoveryNoticesHandler = async (): Promise<LoanEmiOverduesNotice[]> => {
    const response = await apiClient.get<GetRecoveryNoticesApiResponse>(
        "/api/v1/loan/recovery-notices"
    )

    return Array.isArray(response.data?.data) ? response.data.data : []
}

export const sendRecoveryNoticeHandler = async ({
    applicationNo,
    payload,
}: SendRecoveryNoticeRequest): Promise<SendRecoveryNoticeResponse> => {
    const response = await apiClient.post<SendRecoveryNoticeResponse>(
        `/api/v1/loan/send-recovery-notice/${applicationNo}`,
        payload
    )

    return response.data
}

export {
    getLoanSchemesHandler,
    addLoanSchemes,
    updateLoanSchemes,
    deleteLoanSchemes,
    getLoanEmiOvedues,
}