import { GetNoticesParams, Notice } from '@/types/noticesType'
import axios from 'axios'

const URI = process.env.NEXT_PUBLIC_API_BASE_URL

export const getNotices = async (params?: GetNoticesParams): Promise<Notice[]> => {
    const response = await axios.get(`${URI}/api/v1/loan/notices'`, {
        params,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        withCredentials: true,
    })

    return Array.isArray(response.data?.data) ? response.data.data : []
}