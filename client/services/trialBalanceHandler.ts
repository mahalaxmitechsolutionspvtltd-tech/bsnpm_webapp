import { apiClient } from "@/lib/api-client"
import {
    GetTrialBalanceParams,
    TrialBalanceApiResponse,
    TrialBalanceData,
} from "@/types/trialBalanceTypes"

export const getTrialBalanceHandler = async (
    params: GetTrialBalanceParams = {}
): Promise<TrialBalanceData> => {
    const response = await apiClient.get<TrialBalanceApiResponse>(
        "/api/v1/get-trial-balance",
        {
            params,
        }
    )

    return response.data.data
}