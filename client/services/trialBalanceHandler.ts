import axios from 'axios'
import { GetTrialBalanceParams, TrialBalanceApiResponse, TrialBalanceData } from '@/types/trialBalanceTypes'

const URI = process.env.NEXT_PUBLIC_API_BASE_URL

export const getTrialBalanceHandler = async (
    params: GetTrialBalanceParams = {}
): Promise<TrialBalanceData> => {
    const response = await axios.get<TrialBalanceApiResponse>(`${URI}/api/v1/get-trial-balance`, {
        params,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        withCredentials: true,
    })

    return response.data.data
}