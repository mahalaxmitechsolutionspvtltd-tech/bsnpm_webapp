import axios from 'axios'
import { DataEntry, DataEntryFormData } from '@/types/dataEntryTypes'

const URI = process.env.NEXT_PUBLIC_API_BASE_URL

export const getDataEntryHandler = async (): Promise<DataEntry[]> => {
    const response = await axios.get(`${URI}/api/v1/data-entry`, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        withCredentials: true,
    })

    return Array.isArray(response.data?.data) ? response.data.data : []
}

export const addDataEntryHandler = async (payload: DataEntryFormData): Promise<DataEntry> => {
    const response = await axios.post(`${URI}/api/v1/add-data-entry`, payload, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        withCredentials: true,
    })

    return response.data?.data as DataEntry
}

export const updateDataEntryHandler = async (
    id: number | string,
    payload: DataEntryFormData
) => {
    const response = await axios.patch(`${URI}/api/v1/update-data-entry/${id}`, payload, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        withCredentials: true,
    })

    return response.data
}