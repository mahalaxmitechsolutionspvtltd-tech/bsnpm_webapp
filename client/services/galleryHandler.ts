import axios from "axios"
import type {
    AddFilePayload,
    AddFileResponse,
    AddFolderPayload,
    AddFolderResponse,
    DeleteFilePayload,
    DeleteFileResponse,
    DeleteFolderPayload,
    DeleteFolderResponse,
    GetGalleryResponse,
    UpdateFilePayload,
    UpdateFileResponse,
    UpdateFolderPayload,
    UpdateFolderResponse,
} from "@/types/galleryTypes"

const URI = process.env.NEXT_PUBLIC_API_BASE_URL

const jsonHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
}

const multipartHeaders = {
    Accept: "application/json",
}

const buildAddFileFormData = (payload: AddFilePayload): FormData => {
    const formData = new FormData()

    if (typeof payload.title !== "undefined") {
        formData.append("title", payload.title ?? "")
    }

    if (typeof payload.description !== "undefined") {
        formData.append("description", payload.description ?? "")
    }

    if (typeof payload.updated_by !== "undefined") {
        formData.append("updated_by", payload.updated_by ?? "")
    }

    if (typeof payload.link !== "undefined" && payload.link !== "") {
        formData.append("link", payload.link)
    }

    if (payload.file instanceof File) {
        formData.append("file", payload.file)
    }

    return formData
}

const buildUpdateFileFormData = (payload: UpdateFilePayload): FormData => {
    const formData = new FormData()

    if (typeof payload.title !== "undefined") {
        formData.append("title", payload.title ?? "")
    }

    if (typeof payload.description !== "undefined") {
        formData.append("description", payload.description ?? "")
    }

    if (typeof payload.updated_by !== "undefined") {
        formData.append("updated_by", payload.updated_by ?? "")
    }

    if (typeof payload.link !== "undefined" && payload.link !== "") {
        formData.append("link", payload.link)
    }

    if (typeof payload.replace_existing_file !== "undefined") {
        formData.append("replace_existing_file", payload.replace_existing_file ? "1" : "0")
    }

    if (payload.file instanceof File) {
        formData.append("file", payload.file)
    }

    return formData
}

export const getGalleryHandler = async (): Promise<GetGalleryResponse> => {
    const response = await axios.get<GetGalleryResponse>(
        `${URI}/api/v1/gallery/get-data`,
        {
            headers: jsonHeaders,
            withCredentials: true,
        }
    )
    return response.data
}

export const addFolderHandler = async (
    payload: AddFolderPayload
): Promise<AddFolderResponse> => {
    const response = await axios.post<AddFolderResponse>(
        `${URI}/api/v1/gallery/add-folder`,
        payload,
        {
            headers: jsonHeaders,
            withCredentials: true,
        }
    )
    return response.data
}

export const addFileHandler = async (
    folderId: number | string,
    payload: AddFilePayload
): Promise<AddFileResponse> => {
    const formData = buildAddFileFormData(payload)

    const response = await axios.post<AddFileResponse>(
        `${URI}/api/v1/gallery/folder/${folderId}/add-file`,
        formData,
        {
            headers: multipartHeaders,
            withCredentials: true,
        }
    )
    return response.data
}

export const updateFolderHandler = async (
    folderId: number | string,
    payload: UpdateFolderPayload
): Promise<UpdateFolderResponse> => {
    const response = await axios.patch<UpdateFolderResponse>(
        `${URI}/api/v1/gallery/folder/${folderId}/update-folder`,
        payload,
        {
            headers: jsonHeaders,
            withCredentials: true,
        }
    )
    return response.data
}

export const updateFileHandler = async (
    folderId: number | string,
    fileIndex: number | string,
    payload: UpdateFilePayload
): Promise<UpdateFileResponse> => {
    const formData = buildUpdateFileFormData(payload)

    const response = await axios.post<UpdateFileResponse>(
        `${URI}/api/v1/gallery/folder/${folderId}/file/${fileIndex}/update-file`,
        formData,
        {
            headers: multipartHeaders,
            withCredentials: true,
        }
    )
    return response.data
}

export const deleteFolderHandler = async (
    folderId: number | string,
    payload?: DeleteFolderPayload
): Promise<DeleteFolderResponse> => {
    const response = await axios.delete<DeleteFolderResponse>(
        `${URI}/api/v1/gallery/folder/${folderId}/delete-folder`,
        {
            headers: jsonHeaders,
            withCredentials: true,
            data: payload ?? {},
        }
    )
    return response.data
}

export const deleteFileHandler = async (
    folderId: number | string,
    fileIndex: number | string,
    payload?: DeleteFilePayload
): Promise<DeleteFileResponse> => {
    const response = await axios.delete<DeleteFileResponse>(
        `${URI}/api/v1/gallery/folder/${folderId}/file/${fileIndex}/delete-file`,
        {
            headers: jsonHeaders,
            withCredentials: true,
            data: payload ?? {},
        }
    )
    return response.data
}