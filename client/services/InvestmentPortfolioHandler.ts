import { GetMemberInvestmentPortfolioParams, MemberInvestmentPortfolioResponse } from '@/types/InvestmentPortfolio'
import axios from 'axios'


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined')
}

const memberInvestmentPortfolioApi = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    }
})

export const getMemberInvestmentPortfolioHandler = async (
    params: GetMemberInvestmentPortfolioParams = {}
): Promise<MemberInvestmentPortfolioResponse> => {
    const response = await memberInvestmentPortfolioApi.get<MemberInvestmentPortfolioResponse>(
        '/api/v1/member-investment-portfolio',
        {
            params: {
                ...(params.search ? { search: params.search } : {})
            }
        }
    )

    return response.data
}