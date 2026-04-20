import { ComplaintDeleteApiResponse, ComplaintItem, ComplaintListApiResponse, ComplaintListFilters, ComplaintSingleApiResponse, PaginatedComplaintResponse, ReplyComplaintPayload } from "@/types/complainsTypes"
import axios from "axios"

const URI = process.env.NEXT_PUBLIC_API_BASE_URL


export const getComplaintsHandler = async (
  filters?: ComplaintListFilters
): Promise<PaginatedComplaintResponse> => {
  const params: Record<string, string | number> = {}

  if (filters?.search) {
    params.search = filters.search
  }

  if (filters?.status) {
    params.status = filters.status
  }

  if (filters?.category) {
    params.category = filters.category
  }

  if (filters?.member_id) {
    params.member_id = filters.member_id
  }

  if (filters?.page) {
    params.page = filters.page
  }

  if (filters?.per_page) {
    params.per_page = filters.per_page
  }

  const response = await axios.get<ComplaintListApiResponse>(
    `${URI}/api/v1/complaints`,
    {
      params,
      headers: {
        Accept: "application/json",
      },
      withCredentials: true,
    }
  )

  if (!response.data.success) {
    throw response.data
  }

  return response.data.data
}

export const getComplaintByIdHandler = async (
  id: number | string
): Promise<ComplaintItem> => {
  const response = await axios.get<ComplaintSingleApiResponse>(
    `${URI}/api/v1/complaints/${id}`,
    {
      headers: {
        Accept: "application/json",
      },
      withCredentials: true,
    }
  )

  if (!response.data.success) {
    throw response.data
  }

  return response.data.data
}

export const replyComplaintHandler = async (
  id: number | string,
  payload: ReplyComplaintPayload
): Promise<ComplaintItem> => {
  const response = await axios.patch<ComplaintSingleApiResponse>(
    `${URI}/api/v1/complaints/${id}/reply`,
    {
      message: payload.message,
      updated_by: payload.updated_by,
      status: payload.status,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      withCredentials: true,
    }
  )

  if (!response.data.success) {
    throw response.data
  }

  return response.data.data
}

export const deleteComplaintHandler = async (
  id: number | string,
  deleted_by?: string
): Promise<{ success: true; message: string }> => {
  const response = await axios.delete<ComplaintDeleteApiResponse>(
    `${URI}/api/v1/complaints/${id}`,
    {
      data: {
        deleted_by,
      },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      withCredentials: true,
    }
  )

  if (!response.data.success) {
    throw response.data
  }

  return {
    success: true,
    message: response.data.message,
  }
}


