import { DashboardOverviewFilters, DashboardOverviewResponse } from "@/types/dashboardTypes"
import axios from "axios"

const URI = process.env.NEXT_PUBLIC_API_BASE_URL


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

  const response = await axios.get<DashboardOverviewResponse>(
    `${URI}/api/v1/dashboard/overview`,
    {
      params,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      withCredentials: true,
    }
  )

  return response.data.data
}