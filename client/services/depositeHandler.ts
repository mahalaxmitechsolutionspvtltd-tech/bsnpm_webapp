import axios from "axios";
import type { ApproveDepositRenewalPayload, CreateDepositSchemePayload, DepositApplicationStatus, DepositScheme, UpdateDepositApplicationStartDatePayload, UpdateDepositSchemePayload } from "@/types/depositeTypes";

const URI = process.env.NEXT_PUBLIC_API_BASE_URL;

type DepositSchemeApiResponse = {
    success?: boolean;
    message?: string;
    data?: DepositScheme[];
};

const getDepositeSchemesHandler = async (): Promise<DepositScheme[]> => {
    const response = await axios.get<DepositSchemeApiResponse>(`${URI}/api/v1/get-deposite-schemes`, {
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        withCredentials: true,
    });

    return Array.isArray(response.data?.data) ? response.data.data : [];
};

const addDepositeSchemeHandler = async (payload: CreateDepositSchemePayload) => {
    const response = await axios.post(`${URI}/api/v1/add-deposite-scheme`, payload, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        withCredentials: true
    })

    return response;
}

const updateDepositeSchemeHandler = async (id: number, payload: UpdateDepositSchemePayload) => {
    const response = await axios.post(`${URI}/api/v1/update-deposite-scheme/${id}`, payload, {
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        withCredentials: true,
    })

    return response.data
}


const getAllDepositeApplications = async () => {
    const response = await axios.get(`${URI}/api/v1/get-deposite-applications`, {
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        withCredentials: true
    })

    return response.data.data ?? []
}

const statusUpdateHandler = async (application_id: number | string, payload: DepositApplicationStatus) => {
    const response = await axios.patch(`${URI}/api/v1/deposite/update-application-status/${application_id}`, payload,
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

const applicationStartDateUpdateHandler = async (
    application_id: number | string,
    payload: UpdateDepositApplicationStartDatePayload
) => {
    const response = await axios.patch(
        `${URI}/api/v1/deposite/application-start-date/${application_id}`,
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


const getDepositeApplicaionRenewals = async () => {
    const response = await axios.get(`${URI}/api/v1/deposite/get-renewals-application`, {
        headers: {
            'Content-Type': 'Application/json',
            'Accept': "application/json",
        },
        withCredentials: true,

    });
    return response.data;
}

const getDepositInstallmentsByOldApplicationId = async (oldApplicationId: string) => {
    const response = await axios.get(`${URI}/api/v1/get-deposit-installments/${oldApplicationId}`, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        withCredentials: true
    })

    return response.data
}

const approveDepositRenewalApplication = async (payload: ApproveDepositRenewalPayload) => {
    const response = await axios.post(`${URI}/api/v1/approve-deposit-renewal`,payload,
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            withCredentials: true
        }
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
    approveDepositRenewalApplication
};