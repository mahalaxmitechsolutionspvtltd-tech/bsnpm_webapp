import { GetLoanEmiSchedulesResponse } from "@/types/emiSchedulesType";
import { GetRecoveryNoticesApiResponse, LoanEmiOverduesNotice, LoanEmiSummary, SendRecoveryNoticeRequest, SendRecoveryNoticeResponse } from "@/types/loanOverdues";

import { AddLoanSchemeFormValues, ApiResponse, ApproveLoanApplicationPayload, ApproveLoanApplicationResponse, LoanTypes } from "@/types/loanTypes";
import axios from "axios";

const URI = process.env.NEXT_PUBLIC_API_BASE_URL;


const getLoanSchemesHandler = async (): Promise<LoanTypes[]> => {
    const response = await axios.get<ApiResponse>(
        `${URI}/api/v1/get-loan-schemes`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            withCredentials: true
        }
    )

    return Array.isArray(response.data?.data) ? response.data.data : []
}

const addLoanSchemes = async (payload: AddLoanSchemeFormValues) => {
    const response = await axios.post(`${URI}/api/v1/add-loan-schemes`, payload, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        withCredentials: true
    });
    return response.data
}

const updateLoanSchemes = async (scheme_id: number | string, payload: AddLoanSchemeFormValues) => {
    const response = await axios.put(`${URI}/api/v1/update-loan-schemes/${scheme_id}`, payload, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        withCredentials: true
    });
    return response.data
}

const deleteLoanSchemes = async (scheme_id: number | string, deleted_by: string) => {
    const response = await axios.post(`${URI}/api/v1/delete-loan-schemes/${scheme_id}`, deleted_by, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        withCredentials: true
    });
    return response.data
}

export const getLoanApplicationsHandler = async () => {
    const response = await axios.get(`${URI}/api/v1/get-loan-applications`, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        withCredentials: true,
    })

    return response.data
}


export const approveLoanApplicationHandler = async (application_id: number | string, payload: ApproveLoanApplicationPayload): Promise<ApproveLoanApplicationResponse> => {

    const response = await axios.patch<ApproveLoanApplicationResponse>(
        `${URI}/api/v1/loan/approve-application/${application_id}`,
        payload,
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            withCredentials: true,
        }
    )

    return response.data
}

export const getLoanEmiSchedulesHandler = async (search = '', page = 1, per_page = 10): Promise<GetLoanEmiSchedulesResponse> => {

    const response = await axios.get<GetLoanEmiSchedulesResponse>(`${URI}/api/v1/loan/emi-schedules`,
        {
            params: { search, page, per_page },
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            withCredentials: true,
        }
    )
    return response.data
}

const getLoanEmiOvedues = async (): Promise<LoanEmiSummary[]> => {
    const response = await axios.get(`${URI}/api/v1/loan/emi-summary`, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        withCredentials: true,
    })

    return Array.isArray(response.data?.data) ? response.data.data : []
}

export const getRecoveryNoticesHandler = async (): Promise<LoanEmiOverduesNotice[]> => {
    const response = await axios.get<GetRecoveryNoticesApiResponse>(
        `${URI}/api/v1/loan/recovery-notices`,
        {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            withCredentials: true,
        }
    )

    return Array.isArray(response.data?.data) ? response.data.data : []
}

export const sendRecoveryNoticeHandler = async ({
    applicationNo,
    payload,
}: SendRecoveryNoticeRequest): Promise<SendRecoveryNoticeResponse> => {
    const response = await axios.post<SendRecoveryNoticeResponse>(
        `${URI}/api/v1/loan/send-recovery-notice/${applicationNo}`,
        payload,
        {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            withCredentials: true,
        }
    )

    return response.data
}

export {
    getLoanSchemesHandler,
    addLoanSchemes,
    updateLoanSchemes,
    deleteLoanSchemes,
    getLoanEmiOvedues
}