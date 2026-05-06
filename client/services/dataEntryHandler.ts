import { apiClient } from "@/lib/api-client"
import { DataEntry, DataEntryFormData } from "@/types/dataEntryTypes"

export const getDataEntryHandler = async (): Promise<DataEntry[]> => {
    const response = await apiClient.get("/api/v1/data-entry")

    return Array.isArray(response.data?.data) ? response.data.data : []
}

export const addDataEntryHandler = async (
    payload: DataEntryFormData
): Promise<DataEntry> => {
    const response = await apiClient.post("/api/v1/add-data-entry", payload)

    return response.data?.data as DataEntry
}

export const updateDataEntryHandler = async (
    id: number | string,
    payload: DataEntryFormData
) => {
    const response = await apiClient.patch(
        `/api/v1/update-data-entry/${id}`,
        payload
    )

    return response.data
}