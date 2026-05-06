import { apiClient } from "@/lib/api-client"
import {
    GetMemberInvestmentPortfolioParams,
    MemberInvestmentPortfolioResponse,
} from "@/types/InvestmentPortfolio"

export const getMemberInvestmentPortfolioHandler = async (
    params: GetMemberInvestmentPortfolioParams = {}
): Promise<MemberInvestmentPortfolioResponse> => {
    const response = await apiClient.get<MemberInvestmentPortfolioResponse>(
        "/api/v1/member-investment-portfolio",
        {
            params: {
                ...(params.search ? { search: params.search } : {}),
            },
        }
    )

    return response.data
}