import { apiClient } from "@/lib/api-client"
import {
    DashboardOverviewFilters,
    DashboardOverviewResponse,
} from "@/types/dashboardTypes"

export const getDashboardOverviewHandler = async (
    filters?: DashboardOverviewFilters
): Promise<DashboardOverviewResponse["data"]> => {
    const params: Record<string, string | number> = {}

    if (filters?.financial_year) {
        params.financial_year = filters.financial_year
    }

    if (filters?.month !== undefined && filters?.month !== null && filters?.month !== "") {
        params.month = filters.month
    }

    if (filters?.year !== undefined && filters?.year !== null && filters?.year !== "") {
        params.year = filters.year
    }

    const response = await apiClient.get<DashboardOverviewResponse>(
        "/api/v1/dashboard/overview",
        {
            params,
        }
    )

    return response.data.data
}