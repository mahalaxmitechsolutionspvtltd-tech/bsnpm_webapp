export type GalleryFileType =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "archive"
  | "text"
  | "file"

export type GalleryFileItem = {
  id?: number
  file_index: number
  title: string | null
  description: string | null
  updated_by: string | null
  original_link?: string
  link?: string | null
  file_name: string | null
  extension: string | null
  file_type: GalleryFileType
  file_url: string | null
  previewable: boolean
}

export type GalleryFolderItem = {
  id: number
  folder_name: string
  created_by: string | null
  created_at: string | null
  updated_by: string | null
  updated_at: string | null
  is_deleted?: boolean
  deleted_by?: string | null
  total_files: number
  files: GalleryFileItem[]
}

export type GalleryListData = {
  total_folders: number
  total_files: number
  folders: GalleryFolderItem[]
}

export type ApiSuccessResponse<T> = {
  success: true
  message: string
  data: T
}

export type ApiErrorResponse<E = Record<string, string[]>> = {
  success: false
  message: string
  errors?: E
}

export type ApiResponse<T, E = Record<string, string[]>> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse<E>

export type GetGalleryResponse = ApiResponse<GalleryListData>
export type AddFolderResponse = ApiResponse<GalleryFolderItem>
export type UpdateFolderResponse = ApiResponse<GalleryFolderItem>

export type AddFileData = {
  folder: GalleryFolderItem
  file: GalleryFileItem
}

export type UpdateFileData = {
  folder: GalleryFolderItem
  file: GalleryFileItem
}

export type DeleteFolderData = {
  id: number
  folder_name: string
  is_deleted: boolean
  deleted_by: string | null
}

export type DeleteFileData = {
  deleted_file: GalleryFileItem
  folder: GalleryFolderItem
}

export type AddFileResponse = ApiResponse<AddFileData>
export type UpdateFileResponse = ApiResponse<UpdateFileData>
export type DeleteFolderResponse = ApiResponse<DeleteFolderData>
export type DeleteFileResponse = ApiResponse<DeleteFileData>

export type AddFolderPayload = {
  folder_name: string
  created_by?: string
}

export type UpdateFolderPayload = {
  folder_name: string
  updated_by?: string
}

export type AddFilePayload = {
  title?: string
  description?: string
  updated_by?: string
  link?: string
  file?: File
}

export type UpdateFilePayload = {
  title?: string
  description?: string
  updated_by?: string
  link?: string
  file?: File
  replace_existing_file?: boolean
}

export type DeleteFolderPayload = {
  deleted_by?: string
  delete_files?: boolean
}

export type DeleteFilePayload = {
  deleted_by?: string
  delete_physical_file?: boolean
}